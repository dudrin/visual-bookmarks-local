import React, { useMemo, useRef, useState } from 'react'
import type { TreeDocument, TreeNode, TreeUIState } from '../models'
import { filterTree, highlight } from '../search'
import { insertChild, removeNode, updateNode, moveNode } from '../treeOps'
import { upsertNodes } from './sqlStorage'   // фолбэк, если не передадут onCommitNodes
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
}> = ({ node, q, allNodes, setAllNodes, docId, docTitle, forceExpand, selectedTab, depth = 0, maxLevel = -1, expandedNodes, onToggleExpanded }) => {
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

  const addSelectedTabHere = async (e?:React.MouseEvent) => {
    e?.stopPropagation()
    if (isLink) return
    
    // Сначала проверяем, есть ли буферизованные вкладки из контекстного меню
    try {
      const response = await chrome.runtime.sendMessage({ type: 'VB_POP_STAGED_TABS' });
      
      if (response?.ok && Array.isArray(response.tabs) && response.tabs.length > 0) {
        // Преобразуем staged tabs в узлы
        const newNodes = response.tabs.map((tab: { title: string; url: string }) => ({
          id: crypto.randomUUID(),
          title: tab.title || tab.url,
          url: tab.url,
          children: []
        }));
        
        // Вставляем все узлы
        let next = allNodes
        for (const newNode of newNodes) {
          next = insertChild(next, node.id, newNode)
        }
        await saveNodes(next)
        return
      }
    } catch (error) {
      console.error('Error getting staged tabs:', error);
    }
    
    // Если нет буферизованных вкладок, используем selectedTab или показываем инструкцию
    if (!selectedTab) { 
      alert('Для добавления нескольких вкладок:\n\n1. Выделите вкладки в браузере (Ctrl+клик)\n2. Нажмите ПКМ на странице\n3. Выберите "Добавить выделенные вкладки в Visual Bookmarks"\n4. Затем нажмите эту кнопку\n\nИли выберите одну вкладку справа для добавления.'); 
      return 
    }
    
    // Добавляем выбранную вкладку
    await saveNodes(insertChild(allNodes, node.id, {
      id: crypto.randomUUID(),
      title: selectedTab.title || selectedTab.url,
      url: selectedTab.url,
      children: []
    }))
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

  return (
    <div className="node" draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <div
        className="node-row"
        role="treeitem"
        aria-expanded={!isLink ? effectiveOpen : undefined}
        tabIndex={-1}
        data-node-id={node.id}
        onClick={()=>{
          if (!isLink) {
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
          }
        }}
      >
        <span className={'dot ' + (isLink ? 'link' : 'folder')} title={effectiveOpen ? 'Свернуть' : 'Развернуть'} />
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
          {isLink && <button className="icon-btn" title="Перейти/открыть" onClick={openHere}>↗</button>}
          {!isLink && <button className="icon-btn" title="Добавить категорию" onClick={addCategoryHere}>📁＋</button>}
          {!isLink && <button className="icon-btn" title="Добавить выделенные вкладки (используйте ПКМ → 'Добавить выделенные вкладки')" onClick={addSelectedTabHere}>🔗⇧</button>}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

const Tree: React.FC<Props> = ({ doc, onAddRootCategory, onAddCurrentTabToRoot, forceExpand, selectedTab, onCommitNodes, uiState, onUpdateUIState }) => {
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
    <div className="tree" role="tree">
      <div className="tree-actions">
        <button onClick={onAddRootCategory}>+ Категория (в корень)</button>
        <button onClick={onAddCurrentTabToRoot}>+ Текущая вкладка (в корень)</button>

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
          />
        ))}
      </div>
    </div>
  )
}

export default Tree
