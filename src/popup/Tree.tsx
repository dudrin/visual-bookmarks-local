import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { TreeDocument, TreeNode, TreeUIState } from '../models'
import { filterTree, highlight } from '../search'
import { insertChild, removeNode, updateNode, moveNode, moveMultipleNodes, updateNodeComment } from '../treeOps'
import { upsertNodes } from './sqlStorage'   // фолбэк, если не передадют onCommitNodes
import { getUniversalItemsToAdd, universalItemToTreeNode, getSourceDescription, copySelectedNodes, deleteSourceNodesForIntraTreeMove } from '../universalAdd'
import SaveIcon from '../components/IconSave'; // иконка-сохранение
import CheckIcon from '../components/IconCheck'; // иконка-индикатор
import CommentEditor from './CommentEditor'; // Добавляем импорт

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
    if (err) rej(err); else res(g!)
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
  
  // Состояние для отслеживания наличия сохраненного файла
  const [fileExists, setFileExists] = useState<boolean>(false);
  const [checkingFile, setCheckingFile] = useState<boolean>(true); // По умолчанию true, чтобы показать индикатор загрузки
  const [showCommentEditor, setShowCommentEditor] = useState<boolean>(false); // Состояние для редактора комментариев

  // Проверяем наличие файла при монтировании компонента и при изменении URL
  useEffect(() => {
    const checkFileExistence = async () => {
      if (node.url) {
        setCheckingFile(true);
        try {
          // Проверяем фактическое наличие файла
          const exists = await hasLocalCopy(node.url, node.title);
          setFileExists(exists);
        } catch (error) {
          console.error('Error checking file existence:', error);
          setFileExists(false);
        } finally {
          setCheckingFile(false);
        }
      } else {
        setCheckingFile(false);
      }
    };
    
    checkFileExistence();
    
    // Слушаем события обновления кэша
    const handleSavedPagesUpdated = (event: CustomEvent) => {
      if (event.detail.url === node.url) {
        setFileExists(event.detail.exists);
        setCheckingFile(false); // Убедимся, что индикатор загрузки скрыт
      }
    };
    
    window.addEventListener('savedPagesUpdated', handleSavedPagesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('savedPagesUpdated', handleSavedPagesUpdated as EventListener);
    };
  }, [node.url, node.title]);
  
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

  const editComment = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Открываем модальный редактор вместо prompt
    setShowCommentEditor(true);
  };

  const handleSaveComment = async (comment: string) => {
    await saveNodes(updateNodeComment(allNodes, node.id, comment));
    setShowCommentEditor(false);
  };

  const handleCancelComment = () => {
    setShowCommentEditor(false);
  };

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

  // --- Новый рендер: выделение только по чекбоксу, остальные действия всегда работают ---
  return (
    <div className="node" draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <div
        className={`node-row ${isSelected ? 'selected' : ''} ${node.comment ? 'has-comment' : ''}`}
        role="treeitem"
        aria-expanded={(!isLink || hasChildren) ? effectiveOpen : undefined}
        tabIndex={-1}
        data-node-id={node.id}
        onClick={handleRowClick} // ВСЕГДА работает
      >
        {/* Чекбокс выделения */}
        {selectionMode && (
          <div 
            className={`selection-checkbox ${isSelected ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleNodeSelection?.(node)
            }}
            title="Выделить/снять выделение"
          />
        )}
        {/* Точка раскрытия */}
        <span 
          className={'dot ' + getDotClass()} 
          title={effectiveOpen ? 'Свернуть' : 'Развернуть'}
          onClick={(e) => {
            e.stopPropagation()
            if (!isLink || hasChildren) {
              if (isExpanded) {
                onToggleExpanded(node.id, false)
                onToggleExpanded(`closed:${node.id}`, true)
              } else {
                onToggleExpanded(node.id, true)
                onToggleExpanded(`closed:${node.id}`, false)
              }
            }
          }}
        />
        {/* Ссылка или папка */}
        {isLink ? (
          <span className="link-wrap">
            {(() => {
              const src = faviconForUrl(node.url)
              return src ? (
                <img className="favicon" src={src} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.visibility='hidden'}} alt=""/>
              ) : <span style={{ width: 16, height: 16 }} />
            })()}
            <a 
              className="link link-text" 
              href={node.url} 
              target="_blank" 
              rel="noreferrer"
              onClick={(e) => {
                // Всегда переход по ссылке
                e.stopPropagation()
                // Не нужно ничего для выделения!
              }}
            >
              <TitleWithHighlight text={node.title} q={q} isLink />
            </a>
          </span>
        ) : (
          <span 
            className="node-title"
            onClick={(e) => {
              e.stopPropagation()
              // Только раскрытие/сворачивание
              if (hasChildren) {
                if (isExpanded) {
                  onToggleExpanded(node.id, false)
                  onToggleExpanded(`closed:${node.id}`, true)
                } else {
                  onToggleExpanded(node.id, true)
                  onToggleExpanded(`closed:${node.id}`, false)
                }
              }
            }}
          >
            <TitleWithHighlight text={node.title} q={q} />
          </span>
        )}
        <div className="node-actions">
          {/* Всегда показываем кнопку открытия для ссылок */}
          {isLink && <button className="icon-btn" title="Перейти/открыть" onClick={openHere}>↗</button>}
          {/* Всегда показываем кнопку добавления категории */}
          <button className="icon-btn" title="Добавить категорию" onClick={addCategoryHere}>📁＋</button>
          {/* Всегда показываем кнопку добавления выделенных вкладок */}
          <button className="icon-btn" title="Добавить выделенные вкладки (используйте ПКМ → 'Добавить выделенные вкладки')" onClick={addSelectedTabHere}>🔗⇧</button>
          {/* Кнопка для редактирования комментария */}
          <button 
            className={`icon-btn ${node.comment ? 'comment-active' : ''}`} 
            title={node.comment ? `Комментарий: ${node.comment}` : "Добавить комментарий"} 
            onClick={editComment}
          >
            {node.comment ? '💬' : '💬＋'}
          </button>
          <button className="icon-btn" title="Переименовать" onClick={renameHere}>✏️</button>
          <button className="icon-btn" title="Удалить" onClick={deleteHere}>🗑️</button>
          {isLink && (
            <>
              <div className="open-saved-icon-container">
                {checkingFile ? (
                  // Индикатор загрузки во время проверки файла
                  <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #ccc', borderTop: '2px solid #007acc', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : fileExists ? (
                  <button
                    className="icon-btn"
                    title="Открыть сохраненную страницу"
                    onClick={() => openSavedPage(node.url ?? '', node.title)}
                    style={{ fontSize: '14px' }}
                  >
                    📂
                  </button>
                ) : (
                  <div style={{ width: '36px', height: '36px' }}></div>
                )}
              </div>
              <div className="save-icon-container">
                <button
                  className="icon-btn"
                  title="Сохранить страницу локально"
                  onClick={() => savePageLocally(node.url ?? '', node.title)}
                  style={{ fontSize: '14px' }}
                >
                  <SaveIcon />
                </button>
              </div>
            </>
          )}
          {!isLink && (
            <>
              <div className="open-saved-icon-container">
                <div style={{ width: '36px', height: '36px' }}></div>
              </div>
              <div className="save-icon-container">
                <div style={{ width: '36px', height: '36px' }}></div>
              </div>
            </>
          )}

        </div>
      </div>

      {showCommentEditor && (
        <CommentEditor 
          comment={node.comment || ''} 
          onSave={handleSaveComment} 
          onCancel={handleCancelComment} 
        />
      )}

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

// Глобальное хранилище для отслеживания сохраненных страниц
let savedPagesCache: Record<string, boolean> = {};

// Функция для обновления кэша и уведомления компонентов
function updateSavedPagesCache(url: string, exists: boolean) {
  // Обновляем кэш в памяти
  if (exists) {
    savedPagesCache[url] = true;
  } else {
    delete savedPagesCache[url];
  }
  
  // Сохраняем в chrome.storage
  chrome.storage.local.set({ savedPages: savedPagesCache }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving to storage:', chrome.runtime.lastError);
    } else {
      console.log('Saved pages cache updated:', savedPagesCache);
    }
  });
  
  // Отправляем сообщение всем компонентам о необходимости обновления
  window.dispatchEvent(new CustomEvent('savedPagesUpdated', { detail: { url, exists } }));
}

// Инициализация кэша при загрузке компонента
chrome.storage.local.get(['savedPages'], async (result) => {
  if (result.savedPages) {
    savedPagesCache = result.savedPages;
    console.log('Initialized saved pages cache:', savedPagesCache);
    
    // Проверяем актуальность кэша - существуют ли файлы на самом деле
    const urls = Object.keys(savedPagesCache);
    for (const url of urls) {
      if (savedPagesCache[url] === true) {
        // Получаем заголовок страницы из URL или другим способом
        const title = getPageTitleFromUrl(url) || 'page';
        const exists = await hasLocalCopy(url, title);
        if (!exists) {
          // Если файл не существует, обновляем кэш
          updateSavedPagesCache(url, false);
        }
      }
    }
  }
});

// Вспомогательная функция для извлечения заголовка из URL
function getPageTitleFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    return domain;
  } catch (e) {
    return null;
  }
}

// Проверка, есть ли локальная копия (например, по url)
async function hasLocalCopy(url: string, title: string): Promise<boolean> {
  try {
    // Получаем папку сохранения из настроек
    const folder = await new Promise<string>((resolve) => {
      chrome.storage.local.get(['saveFolder'], (result) => {
        resolve(result.saveFolder || "SavedPages");
      });
    });
    
    // Формируем имя файла
    let fileName = title || 'page';
    // Удаляем недопустимые символы из имени файла
    fileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    // Обрезаем имя файла, если оно слишком длинное
    if (fileName.length > 100) {
      fileName = fileName.substring(0, 100);
    }
    // Убедимся, что имя файла заканчивается на .mhtml
    if (!fileName.toLowerCase().endsWith('.mhtml')) {
      fileName = fileName + '.mhtml';
    }
    
    // Проверяем кэш первым делом
    if (savedPagesCache[url] === false) {
      return false;
    }
    
    // Экранируем специальные символы для регулярного выражения
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // Ищем файл в downloads API
    return new Promise((resolve) => {
      chrome.downloads.search({
        filenameRegex: escapeRegExp(folder) + '[/\\\\]' + escapeRegExp(fileName)
      }, (results) => {
        try {
          // Фильтруем результаты, оставляя только завершенные загрузки с существующими файлами
          const validDownloads = results ? results.filter(download => {
            // Проверяем, что загрузка завершена и файл существует
            return download.state === 'complete' && 
                   (download.exists === true || 
                    (download.exists !== false && download.byExtensionId === chrome.runtime.id));
          }) : [];
          
          const fileExists = validDownloads.length > 0;
          console.log('File existence check:', fileName, 'in folder:', folder, 'Exists:', fileExists, 'Valid downloads:', validDownloads);
          
          // Обновляем кэш
          updateSavedPagesCache(url, fileExists);
          resolve(fileExists);
        } catch (filterError) {
          console.error('Error filtering download results:', filterError);
          // В случае ошибки фильтрации удаляем из кэша
          updateSavedPagesCache(url, false);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Error checking for local copy:', error);
    // В случае ошибки удаляем из кэша
    updateSavedPagesCache(url, false);
    return false;
  }
}

// Вспомогательная функция для получения заголовка страницы из кэша
function getPageTitleFromCache(url: string): string | null {
  // В реальной реализации здесь можно использовать кэш заголовков
  // Пока возвращаем null, чтобы использовать URL как fallback
  return null;
}

// Функция для открытия сохраненной страницы
async function openSavedPage(url: string, title: string) {
  console.log('Opening saved page:', url, title);
  
  // Получаем папку сохранения из настроек
  const folder = await new Promise<string>((resolve) => {
    chrome.storage.local.get(['saveFolder'], (result) => {
      resolve(result.saveFolder || "SavedPages");
    });
  });
  
  // Формируем имя файла
  let fileName = title || 'page';
  // Удаляем недопустимые символы из имени файла
  fileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  // Обрезаем имя файла, если оно слишком длинное
  if (fileName.length > 100) {
    fileName = fileName.substring(0, 100);
  }
  // Убедимся, что имя файла заканчивается на .mhtml
  if (!fileName.toLowerCase().endsWith('.mhtml')) {
    fileName = `${fileName}.mhtml`;
  }
  
  console.log('Looking for file with exact name:', `${folder}/${fileName}`);
  console.log('Or file containing:', fileName);
  
  // Формируем путь к файлу в папке Загрузки
  // Примечание: Chrome не позволяет напрямую открывать файлы по пути,
  // поэтому мы будем использовать downloads API для открытия файла
  try {
    // Пытаемся найти файл в загрузках по точному совпадению имени
    chrome.downloads.search({ filenameRegex: `${folder.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}/${fileName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}` }, async (results) => {
      console.log('Exact name search results:', results);
      if (results && results.length > 0) {
        // Находим самый свежий файл
        const file = results
          .filter(download => download.state === 'complete' && (download.exists === true || download.exists === undefined))
          .sort((a, b) => (b.startTime.localeCompare(a.startTime)))[0];
          
        if (file) {
          console.log('Opening file with ID:', file.id);
          try {
            // Для blob URL используем downloads.open, для файловых URL можно использовать tabs.create
            if (file.finalUrl && file.finalUrl.startsWith('blob:')) {
              chrome.downloads.open(file.id);
            } else if (file.finalUrl) {
              chrome.tabs.create({ url: file.finalUrl, active: true });
            } else {
              // Резервный вариант - использовать downloads.open
              chrome.downloads.open(file.id);
            }
            return;
          } catch (error: any) {
            console.error('Error opening file with exact match:', error);
            // Если файл удален, удаляем его из кэша
            if (error.message && error.message.includes('deleted')) {
              updateSavedPagesCache(url, false);
            }
            // Резервный вариант - использовать downloads.open
            try {
              chrome.downloads.open(file.id);
            } catch (fallbackError: any) {
              console.error('Error opening file with fallback method:', fallbackError);
              // Если файл удален, удаляем его из кэша
              if (fallbackError.message && fallbackError.message.includes('deleted')) {
                updateSavedPagesCache(url, false);
              }
              alert('Ошибка при открытии файла: ' + (fallbackError as Error).message);
            }
          }
        }
      }
      
      // Если точное совпадение не найдено, ищем по частичному совпадению
      chrome.downloads.search({ filenameRegex: fileName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') }, async (partialResults) => {
        console.log('Partial name search results:', partialResults);
        if (partialResults && partialResults.length > 0) {
          // Находим самый свежий файл
          const file = partialResults
            .filter(download => download.state === 'complete' && (download.exists === true || download.exists === undefined))
            .sort((a, b) => (b.startTime.localeCompare(a.startTime)))[0];
            
          if (file) {
            console.log('Opening file with ID (partial match):', file.id);
            try {
              // Для blob URL используем downloads.open, для файловых URL можно использовать использовать tabs.create
              if (file.finalUrl && file.finalUrl.startsWith('blob:')) {
                chrome.downloads.open(file.id);
              } else if (file.finalUrl) {
                chrome.tabs.create({ url: file.finalUrl, active: true });
              } else {
                // Резервный вариант - использовать downloads.open
                chrome.downloads.open(file.id);
              }
              return;
            } catch (error: any) {
              console.error('Error opening file with partial match:', error);
              // Если файл удален, удаляем его из кэша
              if (error.message && error.message.includes('deleted')) {
                updateSavedPagesCache(url, false);
              }
              // Резервный вариант - использовать downloads.open
              try {
                chrome.downloads.open(file.id);
              } catch (fallbackError: any) {
                console.error('Error opening file with fallback method:', fallbackError);
                // Если файл удален, удаляем его из кэша
                if (fallbackError.message && fallbackError.message.includes('deleted')) {
                  updateSavedPagesCache(url, false);
                }
                alert('Ошибка при открытии файла: ' + (fallbackError as Error).message);
              }
            }
            return;
          }
        }
        
        // Если ничего не найдено, показываем сообщение и удаляем из кэша
        updateSavedPagesCache(url, false);
        alert('Файл не найден. Возможно, он был удален или перемещен.');
      });
    });
  } catch (error: any) {
    console.error('Error searching for saved page:', error);
    // В случае ошибки удаляем из кэша
    updateSavedPagesCache(url, false);
    alert('Ошибка при поиске файла: ' + (error as Error).message);
  }
}

// Сохранение страницы локально
async function savePageLocally(url: string, title: string): Promise<boolean> {
  // Получить выбранную папку из настроек
    const folder = await getSaveFolder();
  
  async function getSaveFolder(): Promise<string | null> {
    // Replace this with your logic to retrieve the save folder, e.g., from chrome.storage
    return new Promise((resolve) => {
      chrome.storage.local.get(['saveFolder'], (result) => {
        resolve(result.saveFolder || "SavedPages");
      });
    });
  }
  
  if (!folder) {
    const userChoice = confirm(
      'Папка для сохранения офлайн-копий не установлена.\n\n' +
      'Файлы будут сохраняться в папку "SavedPages" внутри папки Загрузки вашего браузера.\n\n' +
      'Хотите перейти в настройки, чтобы выбрать другую папку?'
    );
    
    if (userChoice) {
      // Open settings (this would require implementing a way to open the settings page)
      // For now, we'll just proceed with the default folder
    }
  }
  
  // Получаем активную вкладку для получения точного заголовка
  chrome.tabs.query({ active: true, currentWindow: true }, activeTabs => {
    let actualTitle = title;
    if (activeTabs.length > 0 && activeTabs[0].url === url) {
      actualTitle = activeTabs[0].title || title;
    }
    
    // Сохранить страницу через chrome.pageCapture
    chrome.tabs.query({ url }, async tabs => {
      if (tabs.length === 0) {
        alert('Вкладка не найдена!');
        return false;
      }
      
      const tab = tabs[0];
      const tabId = tab.id!;
      
      // Check if tab is still loading
      if (tab.status !== 'complete') {
        const shouldWait = confirm(
          'Страница еще загружается. Для корректного сохранения необходимо дождаться полной загрузки страницы.\n\n' +
          'Нажмите "OK", чтобы подождать 3 секунды и попытаться сохранить снова, или "Отмена" для отмены операции.'
        );
        
        if (shouldWait) {
          // Wait for 3 seconds and then try again
          await new Promise(resolve => setTimeout(resolve, 3000));
          // Re-query the tab to get updated status
          chrome.tabs.get(tabId, updatedTab => {
            if (chrome.runtime.lastError) {
              alert('Ошибка при получении информации о вкладке: ' + chrome.runtime.lastError.message);
              return false;
            }
            // Try to save again
            return attemptPageCapture(updatedTab.id!, folder, actualTitle);
          });
        }
        return false;
      }
      
      // Tab is loaded, proceed with capture
      return attemptPageCapture(tabId, folder, actualTitle);
    });
  });
  
  return true;
}

// Separate function to handle the actual page capture
function attemptPageCapture(tabId: number, folder: string | null, title: string) {
  chrome.pageCapture.saveAsMHTML({ tabId }, mhtmlBlob => {
    // Handle errors from pageCapture
    if (chrome.runtime.lastError) {
      console.error('Page capture error:', chrome.runtime.lastError);
      const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
      if (errorMessage.includes('permissions')) {
        alert('Ошибка: У расширения нет разрешения на захват этой страницы.\n\n' +
              'Это может произойти с:\n' +
              '- Внутренними страницами Chrome (chrome://)\n' +
              '- Страницами расширений\n' +
              '- Страницами с жесткими политиками безопасности\n' +
              '- Страницами, которые еще загружаются\n\n' +
              'Попробуйте обновить страницу и повторить попытку.');
      } else {
        alert('Ошибка при захвате страницы: ' + errorMessage);
      }
      return;
    }
    
    // Сохранить файл в выбранную папку
    // Убедимся, что у файла правильное расширение
    let fileName = title || 'page';
    // Удаляем недопустимые символы из имени файла
    fileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    // Обрезаем имя файла, если оно слишком длинное
    if (fileName.length > 100) {
      fileName = fileName.substring(0, 100);
    }
    // Убедимся, что имя файла заканчивается на .mhtml
    if (!fileName.toLowerCase().endsWith('.mhtml')) {
      fileName = `${fileName}.mhtml`;
    }
    
    if (!mhtmlBlob) {
      alert('Ошибка: не удалось сохранить страницу. Страница может быть недоступна для захвата.');
      return;
    }
    
    // Проверяем тип контента блоба
    console.log('MHTML Blob type:', mhtmlBlob.type);
    console.log('MHTML Blob size:', mhtmlBlob.size);
    
    // Создаем новый Blob с правильным MIME-типом для MHTML
    // Это поможет Chrome правильно определить тип файла
    const mhtmlBlobWithCorrectType = new Blob([mhtmlBlob], { 
      type: 'application/x-mimearchive' // Правильный MIME-тип для MHTML файлов
    });
    
    const urlObj = URL.createObjectURL(mhtmlBlobWithCorrectType);
    chrome.downloads.download({
      url: urlObj,
      filename: `${folder}/${fileName}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        alert('Ошибка при сохранении файла: ' + chrome.runtime.lastError.message);
      } else {
        console.log('Download started with ID:', downloadId);
        // Показываем сообщение об успешном сохранении
        alert(`Страница успешно сохранена как "${fileName}" в папке "${folder}"\n\n` +
              `Для открытия файла дважды кликните по нему или откройте через контекстное меню ` +
              `"Открыть с помощью" и выберите браузер.`);
        
        // Обновляем информацию о сохраненных страницах
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting tab info:', chrome.runtime.lastError);
            return;
          }
          
          if (tab && tab.url) {
            const url = tab.url;
            console.log('Saving page to cache:', url);
            // Обновляем кэш через функцию updateSavedPagesCache
            updateSavedPagesCache(url, true);
            
            // Также сохраняем информацию о файле для более точного поиска
            chrome.downloads.search({ id: downloadId }, (results) => {
              if (results && results.length > 0) {
                const file = results[0];
                console.log('Saved file info:', file);
                // Можно сохранить дополнительную информацию о файле если нужно
              }
            });
          }
        });
      }
    });
    // Обновить индикатор
    // ...ваша логика обновления localCopies...
  });
}

export default Tree
