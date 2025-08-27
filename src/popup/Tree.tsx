import React, { useMemo, useRef, useState } from 'react'
import type { TreeDocument, TreeNode, TreeUIState } from '../models'
import { filterTree, highlight } from '../search'
import { insertChild, removeNode, updateNode, moveNode, moveMultipleNodes } from '../treeOps'
import { upsertNodes } from './sqlStorage'   // фолбэк, если не передадют onCommitNodes
import { getUniversalItemsToAdd, universalItemToTreeNode, getSourceDescription, copySelectedNodes, deleteSourceNodesForIntraTreeMove } from '../universalAdd'
type Props = {
  doc: TreeDocument
  onAddRootCategory: () => void
  onAddCurrentTabToRoot: () => void
  forceExpand?: boolean
  selectedTab?: { id: number; title: string; url: string } | null
  /** Если передать — именно он будет коммитить узлы (рекомендуется вызывать App.updateNodesFor) */
  onCommitNodes?: (docId: string, nodes: TreeNode[]) => Promise<void> | void
  // Состояние UI дерева
  uiState: TreeUIState
  onUpdateUIState: (updater: (prev: TreeUIState) => TreeUIState) => void
  // Новые пропсы для системы выделения
  selectionMode?: boolean
  moveMode?: boolean
  isNodeSelected?: (nodeId: string) => boolean
  onToggleNodeSelection?: (node: TreeNode) => void
  // Групповые операции
  onDeleteSelected?: () => void
  removeNodesFromSelection?: (treeId: string, nodeIds: string[]) => void
  // Данные всех деревьев для поддержки межпроектных переносов
  allTrees?: TreeDocument[]
  onUpdateTreeNodes?: (treeId: string, nodes: TreeNode[]) => Promise<void>
  // Глобальные функции выделения для междеревных операций
  globalIsNodeSelected?: (treeId: string, nodeId: string) => boolean
}

/* ---------- helpers для Chrome API (Promise-обёртки) ---------- */
function pTabsQuery(q: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise(res => chrome.tabs.query(q, res))
}
function pTabsCreate(c: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
  return new Promise(res => chrome.tabs.create(c, res))
}
function pTabsUpdate(tabId: number, props: chrome.tabs.UpdateProperties) {
  return new Promise<chrome.tabs.Tab>((res, rej) => {
    chrome.tabs.update(tabId, props, (tab) => {
      if (chrome.runtime.lastError || !tab) return rej(chrome.runtime.lastError ?? new Error("No tab"));
      res(tab);
    });
  });
}
function pWindowsUpdate(windowId: number, props: chrome.windows.UpdateInfo): Promise<chrome.windows.Window | undefined> {
  return new Promise(res => chrome.windows.update(windowId, props, res))
}
function pTabsGroup(opts: chrome.tabs.GroupOptions): Promise<number> {
  return new Promise((res, rej) => chrome.tabs.group(opts, gid => {
    const err = chrome.runtime.lastError
    if (err) rej(err); else res(gid)
  }))
}
function pTabGroupsGet(groupId: number): Promise<chrome.tabGroups.TabGroup> {
  return new Promise((res, rej) => chrome.tabGroups.get(groupId, g => {
    const err = chrome.runtime.lastError
    if (err) rej(err); else res(g)
  }))
}
function pTabGroupsUpdate(groupId: number, info: chrome.tabGroups.UpdateProperties): Promise<chrome.tabGroups.TabGroup> {
  return new Promise((res, rej) => chrome.tabGroups.update(groupId, info, g => {
    const err = chrome.runtime.lastError
    if (err) rej(err); else res(g!)
  }))
}

const normUrl = (u?: string) => (u ? u.split('#')[0] : '')

/** Открыть/активировать URL с учётом групп вкладок. */
async function openOrFocusUrl(url: string, docTitle: string) {
  const target = normUrl(url)
  if (!target) return

  // 1) Уже открыт?
  const all = await pTabsQuery({})
  const existing = all.find(t => normUrl(t.url || '') === target)
  if (existing?.id) {
    if (typeof existing.windowId === 'number') await pWindowsUpdate(existing.windowId, { focused: true })
    await pTabsUpdate(existing.id, { active: true })
    return
  }

  // 2) Получаем информацию о "родительской" вкладке и группе
  const sessionData = await chrome.storage.session.get(['vb_lastActiveTabId', 'vb_lastActiveGroupId']);
  const parentTabId = sessionData.vb_lastActiveTabId;
  const parentGroupId = sessionData.vb_lastActiveGroupId;

  const [activeWinTab] = await pTabsQuery({ active: true, currentWindow: true })
  const winId = activeWinTab?.windowId ?? (await pTabsQuery({ currentWindow: true }))[0]?.windowId
  const created = await pTabsCreate({ url: target, active: true, windowId: winId })

  if (!chrome.tabGroups || typeof created.id !== 'number') return

  // 3) Приоритеты для выбора группы:
  // а) Группа с названием дерева
  const tabsInWindow = await pTabsQuery({ windowId: created.windowId })
  const uniqueGroupIds = Array.from(new Set(
    tabsInWindow.map(t => (typeof t.groupId === 'number' ? t.groupId : -1)).filter(gid => gid >= 0)
  ))
  let targetGroupId: number | null = null
  for (const gid of uniqueGroupIds) {
    try {
      const g = await pTabGroupsGet(gid)
      if (g.title === docTitle) { targetGroupId = gid; break }
    } catch {}
  }
  if (targetGroupId !== null) { await pTabsGroup({ tabIds: created.id, groupId: targetGroupId }); return }

  // б) Группа "родительской" вкладки
  if (typeof parentGroupId === 'number' && parentGroupId >= 0) {
    try {
      // Проверяем, что группа существует в том же окне
      const groupStillExists = uniqueGroupIds.includes(parentGroupId);
      if (groupStillExists) {
        await pTabsGroup({ tabIds: created.id, groupId: parentGroupId });
        return;
      }
    } catch {}
  }

  // в) Группа текущей активной вкладки (запасной вариант)
  const activeGroupId = (activeWinTab && typeof activeWinTab.groupId === 'number' && activeWinTab.groupId >= 0)
    ? activeWinTab.groupId : -1
  if (activeGroupId >= 0) { await pTabsGroup({ tabIds: created.id, groupId: activeGroupId }); return }

  // г) Создаём новую группу с названием дерева
  try {
    const newGroupId = await pTabsGroup({ tabIds: created.id })
    await pTabGroupsUpdate(newGroupId, { title: docTitle })
  } catch {}
}

/* ---------- helpers для «выделенных вкладок» ---------- */
const isNormalTab = (t: chrome.tabs.Tab) =>
  !!(t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))

const toNode = (t: chrome.tabs.Tab): TreeNode => ({
  id: crypto.randomUUID(),
  title: (t.title || t.url || '').trim() || 'Без названия',
  url: t.url || '',
  children: []
})


/* ------------------- UI helpers ------------------- */

const TitleWithHighlight: React.FC<{ text: string, q: string, isLink?: boolean }> = ({ text, q, isLink }) => {
  const parts = useMemo(() => highlight(text, q), [text, q])
  return (
    <>
      {parts.map((p,i)=> typeof p==='string' ? <span key={i}>{p}</span> : <mark key={i}>{p.mark}</mark>)}
      {isLink && <span className="muted"> ↗</span>}
    </>
  )
}

function faviconForUrl(url?: string): string {
  if (!url) return ''
  if (!/^https?:/i.test(url)) return ''
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=16`
}

/** max глубина дерева */
function computeMaxDepth(nodes: TreeNode[], depth = 0): number {
  let m = depth
  for (const n of nodes) m = Math.max(m, computeMaxDepth(n.children || [], depth + 1))
  return m
}

/** Обрезка дерева до depth (включительно). depth=-1 — без обрезки */
function cutTreeToDepth(nodes: TreeNode[], depth: number, cur = 0): TreeNode[] {
  if (depth < 0) return nodes
  return nodes.map(n => ({
    ...n,
    children: cur >= depth ? [] : cutTreeToDepth(n.children || [], depth, cur + 1)
  }))
}

const NodeView: React.FC<{
  node: TreeNode
  q: string
  allNodes: TreeNode[]
  setAllNodes: (ns: TreeNode[]) => void
  docId: string
  docTitle: string
  forceExpand?: boolean
  selectedTab?: { id: number; title: string; url: string } | null
  depth?: number
  maxLevel?: number
  expandedNodes: Set<string>
  onToggleExpanded: (nodeId: string, isExpanded: boolean) => void
  // Новые пропсы для системы выделения
  selectionMode?: boolean
  moveMode?: boolean
  isNodeSelected?: (nodeId: string) => boolean
  onToggleNodeSelection?: (node: TreeNode) => void
  removeNodesFromSelection?: (treeId: string, nodeIds: string[]) => void
  // Параметры для универсального переноса
  allTrees?: TreeDocument[]
  onUpdateTreeNodes?: (treeId: string, nodes: TreeNode[]) => Promise<void>
  globalIsNodeSelected?: (treeId: string, nodeId: string) => boolean
}> = ({ node, q, allNodes, setAllNodes, docId, docTitle, forceExpand, selectedTab, depth = 0, maxLevel = -1, expandedNodes, onToggleExpanded, selectionMode = false, moveMode = false, isNodeSelected, onToggleNodeSelection, removeNodesFromSelection, allTrees = [], onUpdateTreeNodes, globalIsNodeSelected }) => {
  // Определяем состояние выделения для этого узла
  const isSelected = isNodeSelected ? isNodeSelected(node.id) : false
  
  // Определяем начальное состояние раскрытия на основе фильтра уровней
  const shouldBeOpenByLevel = maxLevel < 0 || depth < maxLevel
  
  // Проверяем, есть ли явное состояние для этого узла
  const hasExplicitState = expandedNodes.has(node.id) || expandedNodes.has(`closed:${node.id}`)
  
  let isExpanded: boolean
  if (hasExplicitState) {
    // Пользователь явно установил состояние
    isExpanded = expandedNodes.has(node.id)
  } else {
    // Используем состояние по фильтру уровня
    isExpanded = shouldBeOpenByLevel
  }
  
  const isLink = !!node.url
  const hasChildren = !!(node.children && node.children.length)
  const effectiveOpen = (forceExpand || (q ? true : isExpanded))

  // локально меняем состояние; запись в БД делает родительский Tree
  const saveNodes = async (next: TreeNode[]) => { setAllNodes(next) }

  const addCategoryHere = async (e?:React.MouseEvent) => {
    e?.stopPropagation()
    const name = prompt('Название категории')?.trim()
    if (!name) return
    await saveNodes(insertChild(allNodes, node.id, { id: crypto.randomUUID(), title: name, children: [] }))
  }

  const addSelectedTabHere = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    // Убираем проверку isLink, чтобы разрешить добавление в ссылки
    
    try {
      // Получаем выделенные закладки для проверки
      let selectedNodes: Array<{ treeId: string, nodeId: string, title: string, url?: string }> = []
      
      if (selectionMode && globalIsNodeSelected) {
        // Получаем выделенные узлы (ссылки и папки)
        const collectSelected = (trees: TreeDocument[]) => {
          const result: Array<{ treeId: string, nodeId: string, title: string, url?: string }> = []
          
          trees.forEach(tree => {
            const findSelectedNodes = (nodes: TreeNode[]): void => {
              nodes.forEach(n => {
                if (globalIsNodeSelected(tree.id, n.id)) {
                  result.push({
                    treeId: tree.id,
                    nodeId: n.id,
                    title: n.title,
                    url: n.url
                  })
                }
                if (n.children) {
                  findSelectedNodes(n.children)
                }
              })
            }
            findSelectedNodes(tree.nodes)
          })
          
          return result
        }
        
        selectedNodes = collectSelected(allTrees)
      }
      
      console.log('[DEBUG] addSelectedTabHere:', {
        selectionMode,
        allTreesCount: allTrees.length,
        selectedNodesCount: selectedNodes.length,
        selectedNodes: selectedNodes.map(n => `${n.treeId}:${n.nodeId} (${n.title})`),
        targetNodeId: node.id,
        targetTreeId: docId
      })
      
      // Получаем элементы для добавления по приоритету
      const itemsToAdd = await getUniversalItemsToAdd({
        selectedNodes,
        selectedTab,
        sourceTreeData: allTrees.map(t => ({ treeId: t.id, nodes: t.nodes }))
      })
      
      console.log('[DEBUG] itemsToAdd:', {
        count: itemsToAdd.length,
        source: itemsToAdd[0]?.source,
        items: itemsToAdd.map(item => ({ id: item.id, title: item.title, source: item.source }))
      })

      if (itemsToAdd.length === 0) {
        alert('Нет элементов для добавления.\n\n' +
              'Для добавления вкладок:\n' +
              '1. Выделите вкладки в браузере (Ctrl+клик)\n' +
              '2. Нажмите ПКМ на странице\n' +
              '3. Выберите "Добавить выделенные вкладки в Visual Bookmarks"\n' +
              '4. Затем нажмите эту кнопку\n\n' +
              'Для перемещения закладок:\n' +
              '1. Включите режим выделения\n' +
              '2. Выделите нужные закладки\n' +
              '3. Нажмите на иконку 🔗⇧ в нужной папке\n\n' +
              'Или выберите одну вкладку справа для добавления.')
        return
      }
      
      // Определяем источник для обработки
      const source = itemsToAdd[0].source
      
      if (source === 'selection') {
        // Используем простое копирование (аналогично staged tabs)
        try {
          const copiedNodes = await copySelectedNodes({
            selectedNodes,
            sourceTreeData: allTrees.map(t => ({ treeId: t.id, nodes: t.nodes })),
            moveMode,
            onUpdateTree: onUpdateTreeNodes,
            targetTreeId: docId // Для определения внутридерева перемещений
          })
          
          console.log('[DEBUG] Got copied nodes:', copiedNodes.length)
          
          if (copiedNodes.length > 0) {
            // Добавляем скопированные узлы в целевую папку
            let next = allNodes
            for (const copiedNode of copiedNodes) {
              next = insertChild(next, node.id, copiedNode)
            }
            await saveNodes(next)
            
            // Для внутридерева перемещений - удаляем исходные узлы ПОСЛЕ вставки
            if (moveMode && onUpdateTreeNodes) {
              await deleteSourceNodesForIntraTreeMove({
                selectedNodes: selectedNodes.map(n => ({ treeId: n.treeId, nodeId: n.nodeId })),
                treeId: docId,
                currentTreeNodes: next,
                onUpdateTree: (treeId, newNodes) => {
                  setAllNodes(newNodes)
                  return Promise.resolve()
                }
              })
            }
            
            // Очищаем выделение после копирования/перемещения
            if (removeNodesFromSelection) {
              selectedNodes.forEach(n => removeNodesFromSelection(n.treeId, [n.nodeId]))
            }
            
            console.log(`Успешно ${moveMode ? 'перемещено' : 'скопировано'} ${copiedNodes.length} элементов`)
          } else {
            alert('Не удалось скопировать выделенные элементы')
          }
        } catch (error) {
          console.error('Error copying nodes:', error)
          alert('Ошибка при копировании: ' + (error as Error).message)
        }
      } else {
        // Добавляем новые узлы
        let next = allNodes
        for (const item of itemsToAdd) {
          const newNode = universalItemToTreeNode(item)
          next = insertChild(next, node.id, newNode)
        }
        await saveNodes(next)
      }
      
      // Показываем уведомление о результате
      const description = getSourceDescription(source, itemsToAdd.length)
      console.log(`Успешно ${source === 'selection' ? (moveMode ? 'перемещено' : 'скопировано') : 'добавлено'}: ${description}`)
      
    } catch (error) {
      console.error('Error in addSelectedTabHere:', error)
      alert('Ошибка при добавлении элементов: ' + (error as Error).message)
    }
  }

  const renameHere = async (e?:React.MouseEvent) => {
    e?.stopPropagation()
    const name = prompt('Новое название', node.title)?.trim()
    if (!name) return
    await saveNodes(updateNode(allNodes, node.id, n => ({ ...n, title: name })))
  }

  const deleteHere = async (e?:React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('Удалить этот узел и всех его потомков?')) return
    await saveNodes(removeNode(allNodes, node.id))
  }

  const onDragStart = (e: React.DragEvent) => { e.dataTransfer.setData('text/plain', node.id); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || draggedId === node.id) return
    await saveNodes(moveNode(allNodes, draggedId, node.id))
  }

  const openHere = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!node.url) return
    await openOrFocusUrl(node.url, docTitle)
  }

  const handleRowClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleNodeSelection) {
      // В режиме выделения - переключаем выделение
      e.stopPropagation()
      onToggleNodeSelection(node)
    } else if (!isLink || hasChildren) {
      // Обычный режим - управление раскрытием
      // При клике помечаем узел как явно управляемый пользователем
      if (isExpanded) {
        // Сворачиваем: удаляем из expanded, добавляем в closed
        onToggleExpanded(node.id, false)
        onToggleExpanded(`closed:${node.id}`, true)
      } else {
        // Раскрываем: добавляем в expanded, удаляем из closed
        onToggleExpanded(node.id, true)
        onToggleExpanded(`closed:${node.id}`, false)
      }
    } else if (isLink && !hasChildren) {
      // Открываем ссылку только если у нее нет дочерних элементов
      openHere(e as any)
    }
  }

  // Определяем класс для точки узла
  const getDotClass = () => {
    if (isLink) {
      // Ссылка с дочерними элементами
      if (hasChildren) {
        return 'link-parent'
      }
      // Обычная ссылка
      return 'link'
    }
    // Папка
    return 'folder'
  }

  return (
    <div className="node" draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <div
        className={`node-row ${isSelected ? 'selected' : ''}`}
        role="treeitem"
        aria-expanded={(!isLink || hasChildren) ? effectiveOpen : undefined}
        tabIndex={-1}
        data-node-id={node.id}
        onClick={handleRowClick}
      >
        {selectionMode && (
          <div 
            className={`selection-checkbox ${isSelected ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleNodeSelection?.(node)
            }}
          />
        )}
        <span className={'dot ' + getDotClass()} title={effectiveOpen ? 'Свернуть' : 'Развернуть'} />
        {isLink ? (
          <span className="link-wrap">
            {(() => {
              const src = faviconForUrl(node.url)
              return src ? (
                <img className="favicon" src={src} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.visibility='hidden'}} alt=""/>
              ) : <span style={{ width: 16, height: 16 }} />
            })()}
            <a className="link link-text" href={node.url} target="_blank" rel="noreferrer">
              <TitleWithHighlight text={node.title} q={q} isLink />
            </a>
          </span>
        ) : (
          <span className="node-title"><TitleWithHighlight text={node.title} q={q} /></span>
        )}
        <div className="node-actions">
          {/* Всегда показываем кнопку открытия для ссылок */}
          {isLink && <button className="icon-btn" title="Перейти/открыть" onClick={openHere}>↗</button>}
          {/* Всегда показываем кнопку добавления категории */}
          <button className="icon-btn" title="Добавить категорию" onClick={addCategoryHere}>📁＋</button>
          {/* Всегда показываем кнопку добавления выделенных вкладок */}
          <button className="icon-btn" title="Добавить выделенные вкладки (используйте ПКМ → 'Добавить выделенные вкладки')" onClick={addSelectedTabHere}>🔗⇧</button>
          <button className="icon-btn" title="Переименовать" onClick={renameHere}>✏️</button>
          <button className="icon-btn" title="Удалить" onClick={deleteHere}>🗑️</button>
        </div>
      </div>

      {effectiveOpen && hasChildren && (
        <div className="children" role="group">
          {node.children!.map(ch => (
            <NodeView
              key={ch.id}
              node={ch}
              q={q}
              allNodes={allNodes}
              setAllNodes={setAllNodes}
              docId={docId}
              docTitle={docTitle}
              forceExpand={forceExpand}
              selectedTab={selectedTab}
              depth={depth + 1}
              maxLevel={maxLevel}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
              selectionMode={selectionMode}
              moveMode={moveMode}
              isNodeSelected={isNodeSelected}
              onToggleNodeSelection={onToggleNodeSelection}
              removeNodesFromSelection={removeNodesFromSelection}
              allTrees={allTrees}
              onUpdateTreeNodes={onUpdateTreeNodes}
              globalIsNodeSelected={globalIsNodeSelected}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const Tree: React.FC<Props> = ({ doc, onAddRootCategory, onAddCurrentTabToRoot, forceExpand, selectedTab, onCommitNodes, uiState, onUpdateUIState, selectionMode = false, moveMode = false, isNodeSelected, onToggleNodeSelection, onDeleteSelected, removeNodesFromSelection, allTrees = [], onUpdateTreeNodes, globalIsNodeSelected }) => {
  // Используем состояние из пропсов
  const q = uiState.searchQuery
  const level = uiState.filterLevel
  const expandedNodes = uiState.expandedNodes
  
  const [allNodes, setAllNodes] = useState<TreeNode[]>(doc.nodes)

  // защита от перекрёстного автосейва
  const currentDocIdRef = useRef(doc.id)
  const skipSaveRef     = useRef(false)
  const dirtyRef        = useRef(false)
  const saveTimer       = useRef<number | null>(null)

  React.useEffect(() => {
    currentDocIdRef.current = doc.id
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    skipSaveRef.current = true
    dirtyRef.current = false
    setAllNodes(doc.nodes)
  }, [doc.id, doc.nodes])

  // Универсальная функция для добавления выделенного (вкладки или закладки) в корень
  const handleAddSelectedToRoot = async () => {
    try {
      // Получаем выделенные закладки для проверки
      let selectedNodes: Array<{ treeId: string, nodeId: string, title: string, url?: string }> = []
      
      if (selectionMode && globalIsNodeSelected) {
        // Получаем выделенные узлы (и ссылки, и папки)
        const collectSelected = (trees: TreeDocument[]) => {
          const result: Array<{ treeId: string, nodeId: string, title: string, url?: string }> = []
          
          trees.forEach(tree => {
            const findSelectedNodes = (nodes: TreeNode[]): void => {
              nodes.forEach(n => {
                if (globalIsNodeSelected(tree.id, n.id)) {
                  result.push({
                    treeId: tree.id,
                    nodeId: n.id,
                    title: n.title,
                    url: n.url
                  })
                }
                if (n.children) {
                  findSelectedNodes(n.children)
                }
              })
            }
            findSelectedNodes(tree.nodes)
          })
          
          return result
        }
        
        selectedNodes = collectSelected(allTrees)
      }
      
      // Получаем элементы для добавления по приоритету
      const itemsToAdd = await getUniversalItemsToAdd({
        selectedNodes,
        selectedTab,
        sourceTreeData: allTrees.map(t => ({ treeId: t.id, nodes: t.nodes }))
      })
      
      if (itemsToAdd.length === 0) {
        alert('Нет элементов для добавления.\n\n' +
              'Для добавления вкладок:\n' +
              '1. Выделите вкладки в браузере (Ctrl+клик)\n' +
              '2. Нажмите ПКМ на странице\n' +
              '3. Выберите "Добавить выделенные вкладки в Visual Bookmarks"\n' +
              '4. Затем нажмите эту кнопку\n\n' +
              'Для перемещения закладок:\n' +
              '1. Включите режим выделения\n' +
              '2. Выделите нужные закладки\n' +
              '3. Нажмите эту кнопку\n\n' +
              'Или выберите одну вкладку справа для добавления.')
        return
      }
      
      // Определяем источник для обработки
      const source = itemsToAdd[0].source
      
      if (source === 'selection') {
        // Используем простое копирование в корень
        try {
          const copiedNodes = await copySelectedNodes({
            selectedNodes,
            sourceTreeData: allTrees.map(t => ({ treeId: t.id, nodes: t.nodes })),
            moveMode,
            onUpdateTree: onUpdateTreeNodes,
            targetTreeId: doc.id // Для определения внутридерева перемещений
          })
          
          if (copiedNodes.length > 0) {
            // Добавляем скопированные узлы в корень
            const updatedNodes = [...copiedNodes, ...allNodes]
            setAllNodesDirty(updatedNodes)
            
            // Для внутридерева перемещений - удаляем исходные узлы ПОСЛЕ вставки
            if (moveMode && onUpdateTreeNodes) {
              await deleteSourceNodesForIntraTreeMove({
                selectedNodes: selectedNodes.map(n => ({ treeId: n.treeId, nodeId: n.nodeId })),
                treeId: doc.id,
                currentTreeNodes: updatedNodes,
                onUpdateTree: (treeId, newNodes) => {
                  setAllNodes(newNodes)
                  return Promise.resolve()
                }
              })
            }
            
            // Очищаем выделение
            if (removeNodesFromSelection) {
              selectedNodes.forEach(n => removeNodesFromSelection(n.treeId, [n.nodeId]))
            }
            
            console.log(`Успешно ${moveMode ? 'перемещено' : 'скопировано'} в корень: ${copiedNodes.length} элементов`)
          } else {
            alert('Не удалось скопировать выделенные элементы')
          }
        } catch (error) {
          console.error('Error copying to root:', error)
          alert('Ошибка при копировании: ' + (error as Error).message)
        }
      } else {
        // Добавляем новые узлы в корень
        const newNodes = itemsToAdd.map(universalItemToTreeNode)
        const updatedNodes = [...newNodes, ...allNodes]
        setAllNodesDirty(updatedNodes)
      }
      
      // Показываем уведомление о результате
      const description = getSourceDescription(source, itemsToAdd.length)
      console.log(`Успешно ${source === 'selection' ? (moveMode ? 'перемещено' : 'скопировано') : 'добавлено'} в корень: ${description}`)
      
    } catch (error) {
      console.error('Error in handleAddSelectedToRoot:', error)
      alert('Ошибка при добавлении элементов: ' + (error as Error).message)
    }
  }

  // Обработчики для обновления UI состояния
  const handleSearchChange = (newQuery: string) => {
    onUpdateUIState(prev => ({ ...prev, searchQuery: newQuery }))
  }
  
  const handleLevelChange = (newLevel: number) => {
    onUpdateUIState(prev => ({ 
      ...prev, 
      filterLevel: newLevel,
      // Сбрасываем явные состояния раскрытия при смене уровня
      expandedNodes: new Set<string>()
    }))
  }
  
  const handleToggleExpanded = (nodeId: string, isExpanded: boolean) => {
    onUpdateUIState(prev => {
      const newExpandedNodes = new Set(prev.expandedNodes)
      if (isExpanded) {
        newExpandedNodes.add(nodeId)
      } else {
        newExpandedNodes.delete(nodeId)
      }
      return { ...prev, expandedNodes: newExpandedNodes }
    })
  }
  
  const setAllNodesDirty = (ns: TreeNode[]) => { dirtyRef.current = true; setAllNodes(ns) }

  React.useEffect(() => {
    if (skipSaveRef.current) { skipSaveRef.current = false; return }
    if (!dirtyRef.current) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)

    const snapshot = allNodes
    const docIdAtSchedule = doc.id
    saveTimer.current = window.setTimeout(() => {
      if (docIdAtSchedule !== currentDocIdRef.current) return
      dirtyRef.current = false
      if (onCommitNodes) {
        Promise.resolve(onCommitNodes(docIdAtSchedule, snapshot)).catch(console.error)
      } else {
        upsertNodes(docIdAtSchedule, snapshot).catch(console.error)
      }
    }, 200)

    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current) }
  }, [allNodes, doc.id])

  // поиск
  const searched = useMemo(() => filterTree(allNodes, q.trim()), [allNodes, q])

  // глубина
  const maxDepth = useMemo(() => Math.max(0, computeMaxDepth(allNodes) - 1), [allNodes])
  
  // не обрезаем дерево физически - level влияет только на начальное раскрытие в NodeView
  const shown = searched

  return (
    <div className={`tree ${selectionMode ? 'selection-mode' : ''}`} role="tree">
      <div className="tree-actions">
        <button onClick={onAddRootCategory}>+ Категория (в корень)</button>
        <button onClick={onAddCurrentTabToRoot}>+ Текущая вкладка (в корень)</button>
        <button 
          onClick={handleAddSelectedToRoot}
          className="selected-to-root-btn"
          title="Добавить выделенные вкладки или переместить выделенные закладки в корень"
        >
          🔗⇧ + Выделенное (в корень)
        </button>

        {/* Фильтр уровней — ТОЛЬКО КЛИК, без hover */}
        <div className="levelbar" aria-label="Фильтр по уровню">
          <span className="muted" style={{ marginRight: 4 }}>Уровень:</span>
          {[...Array(maxDepth + 1)].map((_, i) => (
            <button
              key={i}
              className={'chip' + (level === i ? ' active' : '')}
              onClick={() => handleLevelChange(i)}
              title={`Показать до уровня ${i}`}
            >{i}</button>
          ))}
          <button
            className={'chip' + (level < 0 ? ' active' : '')}
            onClick={() => handleLevelChange(-1)}
            title="Показать все уровни"
          >Все</button>
        </div>

        <input
          type="text"
          placeholder="Поиск по названию/URL"
          style={{marginLeft:'auto'}}
          value={q}
          onChange={e=>handleSearchChange(e.target.value)}
        />
      </div>

      <div 
        className="nodes"
        onScroll={(e) => {
          const target = e.target as HTMLElement
          onUpdateUIState(prev => ({ ...prev, scrollPosition: target.scrollTop }))
        }}
        ref={(el) => {
          if (el && el.scrollTop !== uiState.scrollPosition) {
            el.scrollTop = uiState.scrollPosition
          }
        }}
      >
        {shown.length===0 && <div className="muted">Ничего не найдено.</div>}
        {shown.map(n => (
          <NodeView
            key={n.id}
            node={n}
            q={q}
            allNodes={allNodes}
            setAllNodes={setAllNodesDirty}
            docId={doc.id}
            docTitle={doc.title}
            forceExpand={forceExpand}
            selectedTab={selectedTab}
            depth={0}
            maxLevel={level}
            expandedNodes={expandedNodes}
            onToggleExpanded={handleToggleExpanded}
            selectionMode={selectionMode}
            moveMode={moveMode}
            isNodeSelected={isNodeSelected}
            onToggleNodeSelection={onToggleNodeSelection}
            removeNodesFromSelection={removeNodesFromSelection}
            allTrees={allTrees}
            onUpdateTreeNodes={onUpdateTreeNodes}
            globalIsNodeSelected={globalIsNodeSelected}
          />
        ))}
      </div>
    </div>
  )
}

export default Tree
