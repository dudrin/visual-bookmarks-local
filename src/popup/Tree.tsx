import React, { useMemo, useRef, useState } from 'react'
import type { TreeDocument, TreeNode } from '../models'
import { filterTree, highlight } from '../search'
import { insertChild, removeNode, updateNode, moveNode } from '../treeOps'
import { upsertNodes } from './sqlStorage'   // фолбэк, если не передадут onCommitNodes

/** запросить у background буфер и очистить его */
async function popStagedTabs(): Promise<Array<{title:string; url:string}>> {
  const res = await chrome.runtime.sendMessage({ type: "VB_POP_STAGED_TABS" });
  if (res?.ok && Array.isArray(res.tabs)) return res.tabs as Array<{title:string; url:string}>;
  return [];
}

type Props = {
  doc: TreeDocument
  onAddRootCategory: () => void
  onAddCurrentTabToRoot: () => void
  forceExpand?: boolean
  selectedTab?: { id: number; title: string; url: string } | null
  /** Если передать — именно он будет коммитить узлы (рекомендуется вызывать App.updateNodesFor) */
  onCommitNodes?: (docId: string, nodes: TreeNode[]) => Promise<void> | void
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
    if (err || !g) rej(err ?? new Error('No group')); else res(g)
  }))
}

const normUrl = (u?: string) => (u ? u.split('#')[0] : '')

/** Открыть/активировать URL с учётом групп вкладок. */
async function openOrFocusUrl(url: string, docTitle: string) {
  const target = normUrl(url)
  if (!target) return

  const all = await pTabsQuery({})
  const existing = all.find(t => normUrl(t.url || '') === target)
  if (existing?.id) {
    if (typeof existing.windowId === 'number') await pWindowsUpdate(existing.windowId, { focused: true })
    await pTabsUpdate(existing.id, { active: true })
    return
  }

  const [activeWinTab] = await pTabsQuery({ active: true, currentWindow: true })
  const winId = activeWinTab?.windowId ?? (await pTabsQuery({ currentWindow: true }))[0]?.windowId
  const created = await pTabsCreate({ url: target, active: true, windowId: winId })

  if (!chrome.tabGroups || typeof created.id !== 'number') return

  const tabsInWindow = await pTabsQuery({ windowId: created.windowId })
  const uniqueGroupIds = Array.from(new Set(
    tabsInWindow.map(t => (typeof t.groupId === 'number' ? t.groupId : -1)).filter(gid => gid >= 0)
  ))

  let targetGroupId: number | null = null
  for (const gid of uniqueGroupIds) {
    try {
      const g = await pTabGroupsGet(gid)
      if (g.title === docTitle) { targetGroupId = gid; break }
    } catch { /* ignore */ }
  }

  if (targetGroupId !== null) { await pTabsGroup({ tabIds: created.id, groupId: targetGroupId }); return }

  const activeGroupId = (activeWinTab && typeof activeWinTab.groupId === 'number' && activeWinTab.groupId >= 0)
    ? activeWinTab.groupId : -1
  if (activeGroupId >= 0) { await pTabsGroup({ tabIds: created.id, groupId: activeGroupId }); return }

  try {
    const newGroupId = await pTabsGroup({ tabIds: created.id })
    await pTabGroupsUpdate(newGroupId, { title: docTitle })
  } catch { /* not critical */ }
}

/* ---------- helpers для массового добавления выделенных вкладок ---------- */
const isNormalTab = (t: chrome.tabs.Tab) =>
  !!(t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))

// Универсальный конвертер таба/объекта {title,url} -> TreeNode
function toNode(t: chrome.tabs.Tab | {title:string; url:string}): TreeNode {
  const title = 'title' in t ? (t.title || (t as any).url || '') : ''
  const url = 'url' in t ? (t as any).url || '' : ''
  return {
    id: crypto.randomUUID(),
    title: (title || url).trim() || 'Без названия',
    url,
    children: []
  }
}

async function getHighlightedTabs(): Promise<chrome.tabs.Tab[]> {
  const ts = await pTabsQuery({ currentWindow: true, highlighted: true })
  return ts.filter(isNormalTab)
}

/* ------------------- UI ------------------- */

const TitleWithHighlight: React.FC<{ text: string, q: string, isLink?: boolean }> = ({ text, q, isLink }) => {
  const parts = useMemo(() => highlight(text, q), [text, q])
  return (<>{parts.map((p,i)=> typeof p==='string' ? <span key={i}>{p}</span> : <mark key={i}>{p.mark}</mark>)}{isLink && <span className="muted"> ↗</span>}</>)
}

function faviconForUrl(url?: string): string {
  if (!url) return ''
  if (!/^https?:/i.test(url)) return ''
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=16`
}

const NodeView: React.FC<{
  node: TreeNode
  q: string
  allNodes: TreeNode[]
  setAllNodes: (ns: TreeNode[]) => void
  docId: string
  docTitle: string
  depth: number
  expandDepth?: number | undefined
  forceExpand?: boolean
  selectedTab?: { id: number; title: string; url: string } | null
}> = ({ node, q, allNodes, setAllNodes, docId, docTitle, depth, expandDepth, forceExpand, selectedTab }) => {
  const [open, setOpen] = useState(true)
  const isLink = !!node.url
  const hasChildren = !!(node.children && node.children.length)

  /// стало: «уровень» задаёт только дефолт, клик по узлу всегда может открыть глубже
const effectiveOpen =
  q ? true
    : forceExpand ? true
      : ((expandDepth !== undefined ? (depth < expandDepth) : false) || open)

  const saveNodes = async (next: TreeNode[]) => { setAllNodes(next) }

  const addCategoryHere = async (e?:React.MouseEvent) => {
    e?.stopPropagation()
    const name = prompt('Название категории')?.trim()
    if (!name) return
    await saveNodes(insertChild(allNodes, node.id, { id: crypto.randomUUID(), title: name, children: [] }))
  }

  // ПРИОРИТЕТ: staged буфер -> выделенные вкладки -> выбранная справа
  const addSelectedTabHere = async (e?:React.MouseEvent) => {
    e?.stopPropagation()
    if (isLink) return

    // 1) буфер из контекстного меню
    const staged = await popStagedTabs()
    if (staged.length) {
      let next = allNodes
      for (let i = staged.length - 1; i >= 0; i--) next = insertChild(next, node.id, toNode(staged[i]))
      await saveNodes(next); return
    }

    // 2) выделенные вкладки текущего окна
    const highlighted = await getHighlightedTabs()
    if (highlighted.length) {
      let next = allNodes
      for (let i = highlighted.length - 1; i >= 0; i--) next = insertChild(next, node.id, toNode(highlighted[i]))
      await saveNodes(next); return
    }

    // 3) фолбэк — выбранная справа
    if (!selectedTab) { alert('Выделите вкладки в браузере или выберите вкладку справа'); return }
    await saveNodes(insertChild(allNodes, node.id, {
      id: crypto.randomUUID(), title: selectedTab.title || selectedTab.url, url: selectedTab.url, children: []
    }))
  }

  const renameHere = async (e?:React.MouseEvent) => { e?.stopPropagation(); const name = prompt('Новое название', node.title)?.trim(); if (!name) return
    await saveNodes(updateNode(allNodes, node.id, n => ({ ...n, title: name }))) }
  const deleteHere = async (e?:React.MouseEvent) => { e?.stopPropagation(); if (!confirm('Удалить этот узел и всех его потомков?')) return
    await saveNodes(removeNode(allNodes, node.id)) }

  const onDragStart = (e: React.DragEvent) => { e.dataTransfer.setData('text/plain', node.id); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const onDrop = async (e: React.DragEvent) => { e.preventDefault(); const draggedId = e.dataTransfer.getData('text/plain'); if (!draggedId || draggedId === node.id) return; await saveNodes(moveNode(allNodes, draggedId, node.id)) }

  const openHere = async (e: React.MouseEvent) => { e.stopPropagation(); if (!node.url) return; await openOrFocusUrl(node.url, docTitle) }

  return (
    <div className="node" draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <div className="node-row" role="treeitem" aria-expanded={!isLink ? effectiveOpen : undefined} tabIndex={-1} data-node-id={node.id}
           onClick={()=>!isLink && setOpen(o=>!o)}>
        <span className={'dot ' + (isLink ? 'link' : 'folder')} title={effectiveOpen ? 'Свернуть' : 'Развернуть'} />
        {isLink ? (
          <span className="link-wrap">
            {(() => { const src = faviconForUrl(node.url); return src ? (
              <img className="favicon" src={src} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.visibility='hidden'}} alt=""/>
            ) : <span style={{ width: 16, height: 16 }} /> })()}
            <a className="link link-text" href={node.url} target="_blank" rel="noreferrer"><TitleWithHighlight text={node.title} q={q} isLink /></a>
          </span>
        ) : (<span className="node-title"><TitleWithHighlight text={node.title} q={q} /></span>)}
        <div className="node-actions">
          {isLink && <button className="icon-btn" title="Перейти/открыть" onClick={openHere}>↗</button>}
          {!isLink && <button className="icon-btn" title="Добавить категорию" onClick={addCategoryHere}>📁＋</button>}
          {!isLink && <button className="icon-btn" title="Добавить выделенные вкладки" onClick={addSelectedTabHere}>🔗⇧</button>}
          <button className="icon-btn" title="Переименовать" onClick={renameHere}>✏️</button>
          <button className="icon-btn" title="Удалить" onClick={deleteHere}>🗑️</button>
        </div>
      </div>
      {effectiveOpen && hasChildren && (
        <div className="children" role="group">
          {node.children!.map(ch => (
            <NodeView key={ch.id} node={ch} q={q} allNodes={allNodes} setAllNodes={setAllNodes}
                      docId={docId} docTitle={docTitle} depth={depth+1} expandDepth={expandDepth}
                      forceExpand={forceExpand} selectedTab={selectedTab} />
          ))}
        </div>
      )}
    </div>
  )
}

/* -------- утилиты глубины -------- */
function calcMaxDepth(nodes: TreeNode[]): number {
  let max = 0
  const walk = (arr: TreeNode[], d: number) => {
    for (const n of arr) {
      max = Math.max(max, d)
      if (n.children?.length) walk(n.children, d+1)
    }
  }
  walk(nodes, 0)
  return max
}

const Tree: React.FC<Props> = ({ doc, onAddRootCategory, onAddCurrentTabToRoot, forceExpand, selectedTab, onCommitNodes }) => {
  const [q, setQ] = useState('')
  const [allNodes, setAllNodes] = useState<TreeNode[]>(doc.nodes)

  // управление глубиной развёртывания
  const [lockDepth, setLockDepth] = useState<number|undefined>(undefined)   // клик
  const [hoverDepth, setHoverDepth] = useState<number|undefined>(undefined) // наведение
  const expandDepth = hoverDepth ?? lockDepth

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
    setLockDepth(undefined)  // сбрасываем «защёлку» при смене дерева
  }, [doc.id, doc.nodes])

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

  const viewNodes = useMemo(() => filterTree(allNodes, q.trim()), [allNodes, q])

  // Добавление выделенных/буферных вкладок в КОРЕНЬ
  // ПРИОРИТЕТ: staged буфер -> выделенные вкладки -> выбранная справа
  const addHighlightedToRoot = async () => {
    // 1) staged
    const staged = await popStagedTabs()
    if (staged.length) {
      setAllNodesDirty([...staged.map(toNode), ...allNodes])
      return
    }
    // 2) highlighted
    const tabs = await getHighlightedTabs()
    if (tabs.length) {
      setAllNodesDirty([...tabs.map(toNode), ...allNodes])
      return
    }
    // 3) fallback — selectedTab
    if (!selectedTab) { alert('Нет буфера/выделения. Выберите вкладку справа.'); return }
    setAllNodesDirty([{ id: crypto.randomUUID(), title: selectedTab.title || selectedTab.url, url: selectedTab.url, children: [] }, ...allNodes])
  }

  const maxDepth = useMemo(() => calcMaxDepth(allNodes), [allNodes])

  return (
    <div className="tree" role="tree">
      <div className="tree-actions">
        <button onClick={onAddRootCategory}>+ Категория (в корень)</button>
        <button onClick={onAddCurrentTabToRoot}>+ Текущая вкладка (в корень)</button>
        <button onClick={addHighlightedToRoot}>+ Выделенные (в корень)</button>

        {/* Лента уровней */}
        <div className="levels"
             onMouseLeave={() => setHoverDepth(undefined)}
             style={{ marginLeft: '12px', display:'flex', gap:4, alignItems:'center' }}>
          <span className="muted" style={{marginRight:4}}>Уровень:</span>
          {[...Array(Math.min(maxDepth, 6)+1)].map((_,d)=>(
            <button key={d}
              className={'level-btn' + ((lockDepth===d) ? ' active' : '')}
              title={`Показать до ${d}-го уровня`}
              onMouseEnter={()=>setHoverDepth(d)}
              onClick={()=>setLockDepth(d)}>{d}</button>
          ))}
          <button className={'level-btn' + ((lockDepth===Infinity) ? ' active':'' )}
                  title="Раскрыть всё"
                  onMouseEnter={()=>setHoverDepth(Infinity)}
                  onClick={()=>setLockDepth(Infinity)}>Все</button>
          <button className="level-btn"
                  title="Сброс"
                  onClick={()=>{ setLockDepth(undefined); setHoverDepth(undefined); }}>×</button>
        </div>

        <input type="text" placeholder="Поиск по названию/URL" style={{marginLeft:'auto'}}
               value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <div className="nodes">
        {viewNodes.length===0 && <div className="muted">Ничего не найдено.</div>}
        {viewNodes.map(n => (
          <NodeView key={n.id} node={n} q={q} allNodes={allNodes} setAllNodes={setAllNodesDirty}
                    docId={doc.id} docTitle={doc.title} depth={0} expandDepth={expandDepth}
                    forceExpand={forceExpand} selectedTab={selectedTab} />
        ))}
      </div>
    </div>
  )
}

export default Tree