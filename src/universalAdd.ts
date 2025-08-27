import type { TreeNode } from './models'

export type StagedTab = {
  title: string
  url: string
}

export type SimpleTab = {
  id: number
  windowId?: number
  title: string
  url: string
  favIconUrl?: string
}

export type UniversalItem = {
  id: string
  title: string
  url?: string
  source: 'selection' | 'staged' | 'current'
  treeId?: string
  nodeId?: string
  children?: TreeNode[]
}

/**
 * Универсальная функция для определения элементов к добавлению по приоритету:
 * 1. Выделенные закладки в системе выделения
 * 2. Staged tabs из background script (через contextMenu)
 * 3. Текущая выбранная вкладка в интерфейсе
 */
export async function getUniversalItemsToAdd(params: {
  // Выделенные закладки - высший приоритет
  selectedNodes?: Array<{ treeId: string, nodeId: string, title: string, url?: string }>
  // Текущая выбранная вкладка в интерфейсе
  selectedTab?: SimpleTab | null
  // Дополнительная информация о структуре дерева для поиска полных узлов
  sourceTreeData?: Array<{ treeId: string, nodes: TreeNode[] }>
}): Promise<UniversalItem[]> {
  const { selectedNodes = [], selectedTab, sourceTreeData = [] } = params
  
  // 1. Приоритет 1: Выделенные закладки (любые - ссылки и папки)
  if (selectedNodes.length > 0) {
    // Ищем полные узлы в структуре дерева
    const fullNodes: UniversalItem[] = []
    
    for (const selectedNode of selectedNodes) {
      const sourceTree = sourceTreeData.find(tree => tree.treeId === selectedNode.treeId)
      if (sourceTree) {
        const fullNode = findNodeInTree(sourceTree.nodes, selectedNode.nodeId)
        if (fullNode) {
          fullNodes.push({
            id: fullNode.id,
            title: fullNode.title,
            url: fullNode.url,
            source: 'selection' as const,
            treeId: selectedNode.treeId,
            nodeId: selectedNode.nodeId,
            children: fullNode.children
          })
        }
      } else {
        // Fallback если не найдена структура дерева
        fullNodes.push({
          id: selectedNode.nodeId,
          title: selectedNode.title,
          url: selectedNode.url,
          source: 'selection' as const,
          treeId: selectedNode.treeId,
          nodeId: selectedNode.nodeId
        })
      }
    }
    
    return fullNodes
  }
  
  // 2. Приоритет 2: Staged tabs из background
  try {
    const stagedResponse = await chrome.runtime.sendMessage({ type: 'VB_POP_STAGED_TABS' })
    if (stagedResponse?.ok && Array.isArray(stagedResponse.tabs) && stagedResponse.tabs.length > 0) {
      return stagedResponse.tabs.map((tab: StagedTab) => ({
        id: crypto.randomUUID(),
        title: tab.title || tab.url,
        url: tab.url,
        source: 'staged' as const
      }))
    }
  } catch (error) {
    console.warn('Failed to get staged tabs:', error)
  }
  
  // 3. Приоритет 3: Текущая выбранная вкладка
  if (selectedTab) {
    return [{
      id: crypto.randomUUID(),
      title: selectedTab.title || selectedTab.url,
      url: selectedTab.url,
      source: 'current' as const
    }]
  }
  
  return []
}

/**
 * Поиск узла в дереве по ID
 */
function findNodeInTree(nodes: TreeNode[], nodeId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node
    }
    if (node.children) {
      const found = findNodeInTree(node.children, nodeId)
      if (found) return found
    }
  }
  return null
}

/**
 * Преобразует UniversalItem в TreeNode
 */
export function universalItemToTreeNode(item: UniversalItem): TreeNode {
  return {
    id: item.source === 'selection' && item.nodeId ? item.nodeId : (item.id || crypto.randomUUID()),
    title: item.title,
    url: item.url,
    children: item.children || []
  }
}

/**
 * Получает описание источника для отображения пользователю
 */
export function getSourceDescription(source: UniversalItem['source'], count: number): string {
  switch (source) {
    case 'selection':
      return count === 1 ? 'выделенная закладка' : `выделенные закладки (${count})`
    case 'staged':
      return count === 1 ? 'вкладка из контекстного меню' : `вкладки из контекстного меню (${count})`
    case 'current':
      return 'текущая вкладка'
    default:
      return 'элементы'
  }
}

/**
 * Проверяет, есть ли потенциальные элементы для добавления
 */
export async function hasUniversalItemsToAdd(params: {
  selectedNodes?: Array<{ treeId: string, nodeId: string, title: string, url?: string }>
  selectedTab?: SimpleTab | null
}): Promise<{ hasItems: boolean, count: number, source?: UniversalItem['source'] }> {
  const { selectedNodes = [], selectedTab } = params
  
  // Проверяем выделенные узлы (любые - ссылки и папки)
  if (selectedNodes.length > 0) {
    return { hasItems: true, count: selectedNodes.length, source: 'selection' }
  }
  
  // Проверяем staged tabs - но не потребляем их
  try {
    const stagedCheck = await chrome.storage.session.get(['vb_stagedTabs', 'vb_stagedExpiresAt'])
    const exp = Number(stagedCheck.vb_stagedExpiresAt || 0)
    const tabs: StagedTab[] = Array.isArray(stagedCheck.vb_stagedTabs) ? stagedCheck.vb_stagedTabs : []
    if (tabs.length > 0 && Date.now() < exp) {
      return { hasItems: true, count: tabs.length, source: 'staged' }
    }
  } catch (error) {
    console.warn('Failed to check staged tabs:', error)
  }
  
  // Проверяем текущую вкладку
  if (selectedTab) {
    return { hasItems: true, count: 1, source: 'current' }
  }
  
  return { hasItems: false, count: 0 }
}

/**
 * Упрощенная функция копирования выделенных узлов (аналогично staged tabs)
 * Когда moveMode = true, удаляет исходные узлы ПОСЛЕ успешного копирования
 */
export async function copySelectedNodes(params: {
  selectedNodes: Array<{ treeId: string, nodeId: string, title: string, url?: string }>
  sourceTreeData: Array<{ treeId: string, nodes: TreeNode[] }>
  moveMode?: boolean
  onUpdateTree?: (treeId: string, newNodes: TreeNode[]) => Promise<void>
  targetTreeId?: string // Для определения внутридерева перемещений
}): Promise<TreeNode[]> {
  const { selectedNodes, sourceTreeData, moveMode = false, onUpdateTree, targetTreeId } = params
  
  console.log('[DEBUG] copySelectedNodes called:', {
    selectedNodesCount: selectedNodes.length,
    selectedNodes: selectedNodes.map(n => `${n.treeId}:${n.nodeId} (${n.title})`),
    moveMode,
    hasUpdateFunction: !!onUpdateTree
  })
  
  // Проверяем, что для режима перемещения предоставлена функция обновления
  if (moveMode && !onUpdateTree) {
    throw new Error('Режим перемещения требует функцию обновления деревьев')
  }
  
  const copiedNodes: TreeNode[] = []
  
  // ВСЕГДА используем режим копирования - создаем копии узлов с новыми ID
  for (const selectedNode of selectedNodes) {
    const sourceTree = sourceTreeData.find(tree => tree.treeId === selectedNode.treeId)
    if (sourceTree) {
      const fullNode = findNodeInTree(sourceTree.nodes, selectedNode.nodeId)
      if (fullNode) {
        // Создаем копию с новым ID
        const copiedNode = copyNodeRecursively(fullNode)
        copiedNodes.push(copiedNode)
        console.log('[DEBUG] Copied node:', { original: fullNode.id, copy: copiedNode.id, title: copiedNode.title })
      } else {
        console.warn(`[DEBUG] Node not found in tree: ${selectedNode.nodeId} in ${selectedNode.treeId}`)
      }
    } else {
      console.warn(`[DEBUG] Source tree not found: ${selectedNode.treeId}`)
      // Fallback - создаем простой узел
      const simpleNode: TreeNode = {
        id: crypto.randomUUID(),
        title: selectedNode.title,
        url: selectedNode.url,
        children: []
      }
      copiedNodes.push(simpleNode)
      console.log('[DEBUG] Created simple node:', simpleNode)
    }
  }
  
  if (copiedNodes.length === 0) {
    throw new Error(moveMode ? 'Не найдено узлов для перемещения' : 'Не удалось найти узлы для копирования')
  }
  
  // Если режим перемещения - удаляем исходные узлы ПОСЛЕ успешного копирования
  if (moveMode && onUpdateTree) {
    console.log('[DEBUG] Move mode: deleting source nodes after successful copy')
    
    try {
      // Группируем узлы по деревьям
      const nodesByTree = new Map<string, string[]>()
      for (const selectedNode of selectedNodes) {
        if (!nodesByTree.has(selectedNode.treeId)) {
          nodesByTree.set(selectedNode.treeId, [])
        }
        nodesByTree.get(selectedNode.treeId)!.push(selectedNode.nodeId)
      }
      
      // Удаляем узлы из каждого дерева, КРОМЕ целевого при внутридерева перемещении
      for (const [treeId, nodeIds] of nodesByTree) {
        // При внутридерева перемещении НЕ удаляем сразу - это будет сделано позже
        if (targetTreeId && treeId === targetTreeId) {
          console.log(`[DEBUG] Skipping source deletion for intra-tree move in ${treeId}`)
          continue
        }
        
        const sourceTree = sourceTreeData.find(tree => tree.treeId === treeId)
        if (sourceTree) {
          console.log(`[DEBUG] Deleting ${nodeIds.length} nodes from tree ${treeId}`)
          
          let updatedNodes = sourceTree.nodes
          for (const nodeId of nodeIds) {
            updatedNodes = removeNodeById(updatedNodes, nodeId)
          }
          
          console.log(`[DEBUG] Updating tree ${treeId}: ${sourceTree.nodes.length} -> ${updatedNodes.length} nodes`)
          await onUpdateTree(treeId, updatedNodes)
        }
      }
      
      console.log('[DEBUG] Successfully deleted source nodes after move')
    } catch (error) {
      console.error('[DEBUG] Failed to delete source nodes after copy:', error)
      console.warn('[DEBUG] Copy was successful, but source deletion failed - manual cleanup may be needed')
    }
  }
  
  console.log('[DEBUG] Total processed nodes:', copiedNodes.length, 'mode:', moveMode ? 'move (copy+delete)' : 'copy')
  return copiedNodes
}

/**
 * Рекурсивное копирование узла с новыми ID
 */
function copyNodeRecursively(node: TreeNode): TreeNode {
  return {
    id: crypto.randomUUID(), // Новый ID для копии
    title: node.title,
    url: node.url,
    children: node.children ? node.children.map(copyNodeRecursively) : []
  }
}

/**
 * Обработка удаления исходных узлов при внутридерева перемещениях
 * Вызывается ПОСЛЕ вставки скопированных узлов в целевое место
 */
export async function deleteSourceNodesForIntraTreeMove(params: {
  selectedNodes: Array<{ treeId: string, nodeId: string }>
  treeId: string
  currentTreeNodes: TreeNode[]
  onUpdateTree: (treeId: string, newNodes: TreeNode[]) => Promise<void>
}): Promise<void> {
  const { selectedNodes, treeId, currentTreeNodes, onUpdateTree } = params
  
  console.log('[DEBUG] deleteSourceNodesForIntraTreeMove called for tree:', treeId)
  
  // Отфильтровываем только узлы из этого дерева
  const nodeIdsToDelete = selectedNodes
    .filter(node => node.treeId === treeId)
    .map(node => node.nodeId)
    
  if (nodeIdsToDelete.length === 0) {
    console.log('[DEBUG] No nodes to delete for intra-tree move')
    return
  }
  
  console.log(`[DEBUG] Deleting ${nodeIdsToDelete.length} source nodes after intra-tree move`)
  
  let updatedNodes = currentTreeNodes
  for (const nodeId of nodeIdsToDelete) {
    updatedNodes = removeNodeById(updatedNodes, nodeId)
  }
  
  await onUpdateTree(treeId, updatedNodes)
  console.log('[DEBUG] Successfully deleted source nodes for intra-tree move')
}

/**
 * Простое удаление узла по ID из дерева
 */
function removeNodeById(nodes: TreeNode[], nodeId: string): TreeNode[] {
  return nodes
    .filter(node => node.id !== nodeId) // Удаляем узел с нужным ID
    .map(node => {
      if (node.children && node.children.length > 0) {
        // Рекурсивно обрабатываем дочерние узлы
        return { ...node, children: removeNodeById(node.children, nodeId) }
      }
      return node
    })
}
