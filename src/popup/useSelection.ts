import { useState, useRef, useCallback, useEffect } from 'react'
import type { SelectionState, TreeNode } from '../models'

// Состояние по умолчанию для выделения
const createDefaultSelectionState = (): SelectionState => ({
  selectedNodes: new Map(),
  selectionMode: false,
  moveMode: false, // по умолчанию режим копирования
})

// Сериализация состояния выделения для сохранения
const serializeSelectionState = (state: SelectionState) => ({
  selectedNodes: Array.from(state.selectedNodes.entries()),
  selectionMode: state.selectionMode,
  moveMode: state.moveMode,
})

// Десериализация состояния выделения
const deserializeSelectionState = (data: any): SelectionState => {
  if (!data || typeof data !== 'object') return createDefaultSelectionState()
  
  const selectedNodes = new Map()
  if (Array.isArray(data.selectedNodes)) {
    data.selectedNodes.forEach(([key, value]: [string, any]) => {
      if (typeof key === 'string' && value && typeof value === 'object') {
        selectedNodes.set(key, value)
      }
    })
  }
  
  return {
    selectedNodes,
    selectionMode: typeof data.selectionMode === 'boolean' ? data.selectionMode : false,
    moveMode: typeof data.moveMode === 'boolean' ? data.moveMode : false,
  }
}

/**
 * Хук для управления глобальным состоянием выделения элементов
 */
export function useSelection() {
  const [selectionState, setSelectionState] = useState<SelectionState>(createDefaultSelectionState)
  const saveTimer = useRef<number | null>(null)

  // Загрузка сохраненного состояния выделения при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vb_selection_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSelectionState(deserializeSelectionState(parsed))
      }
    } catch (error) {
      console.warn('Failed to load selection state:', error)
    }
  }, [])

  // Сохранение состояния с дебаунсом
  const saveSelectionState = useCallback((state: SelectionState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem('vb_selection_state', JSON.stringify(serializeSelectionState(state)))
      } catch (error) {
        console.warn('Failed to save selection state:', error)
      }
    }, 200) // 200ms дебаунс для более быстрого отклика
  }, [])

  // Включение/выключение режима выделения
  const toggleSelectionMode = useCallback(() => {
    setSelectionState(prev => {
      const newState = { ...prev, selectionMode: !prev.selectionMode }
      if (!newState.selectionMode) {
        // При выключении режима выделения очищаем все выделения
        newState.selectedNodes = new Map()
      }
      saveSelectionState(newState)
      return newState
    })
  }, [saveSelectionState])

  // Переключение режима перемещения/копирования
  const toggleMoveMode = useCallback(() => {
    setSelectionState(prev => {
      const newState = { ...prev, moveMode: !prev.moveMode }
      saveSelectionState(newState)
      return newState
    })
  }, [saveSelectionState])

  // Выделение/снятие выделения узла
  const toggleNodeSelection = useCallback((treeId: string, node: TreeNode) => {
    setSelectionState(prev => {
      const newSelectedNodes = new Map(prev.selectedNodes)
      const nodeKey = `${treeId}:${node.id}`
      
      if (newSelectedNodes.has(nodeKey)) {
        newSelectedNodes.delete(nodeKey)
      } else {
        newSelectedNodes.set(nodeKey, {
          treeId,
          nodeId: node.id,
          title: node.title,
          url: node.url
        })
      }
      
      const newState = { ...prev, selectedNodes: newSelectedNodes }
      saveSelectionState(newState)
      return newState
    })
  }, [saveSelectionState])

  // Проверка, выделен ли узел
  const isNodeSelected = useCallback((treeId: string, nodeId: string): boolean => {
    return selectionState.selectedNodes.has(`${treeId}:${nodeId}`)
  }, [selectionState.selectedNodes])

  // Очистка всех выделений
  const clearSelection = useCallback(() => {
    setSelectionState(prev => {
      const newState = { ...prev, selectedNodes: new Map() }
      saveSelectionState(newState)
      return newState
    })
  }, [saveSelectionState])

  // Выделение нескольких узлов
  const selectMultipleNodes = useCallback((nodes: Array<{ treeId: string; node: TreeNode }>) => {
    setSelectionState(prev => {
      const newSelectedNodes = new Map(prev.selectedNodes)
      
      nodes.forEach(({ treeId, node }) => {
        const nodeKey = `${treeId}:${node.id}`
        newSelectedNodes.set(nodeKey, {
          treeId,
          nodeId: node.id,
          title: node.title,
          url: node.url
        })
      })
      
      const newState = { ...prev, selectedNodes: newSelectedNodes }
      saveSelectionState(newState)
      return newState
    })
  }, [saveSelectionState])

  // Получение количества выделенных элементов
  const getSelectionCount = useCallback((): number => {
    return selectionState.selectedNodes.size
  }, [selectionState.selectedNodes.size])

  // Получение выделенных элементов для конкретного дерева
  const getSelectedNodesForTree = useCallback((treeId: string) => {
    const result: Array<{ nodeId: string; title: string; url?: string }> = []
    selectionState.selectedNodes.forEach((value, key) => {
      if (value.treeId === treeId) {
        result.push({
          nodeId: value.nodeId,
          title: value.title,
          url: value.url
        })
      }
    })
    return result
  }, [selectionState.selectedNodes])

  // Получение всех выделенных элементов
  const getAllSelectedNodes = useCallback(() => {
    return Array.from(selectionState.selectedNodes.values())
  }, [selectionState.selectedNodes])

  // Получение выделенных узлов для конкретного дерева с полными узлами
  const getSelectedNodesWithData = useCallback((treeId: string, allNodes: TreeNode[]): TreeNode[] => {
    const selectedIds = new Set<string>()
    selectionState.selectedNodes.forEach((value, key) => {
      if (value.treeId === treeId) {
        selectedIds.add(value.nodeId)
      }
    })
    
    // Рекурсивно ищем узлы по ID
    const findNodes = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = []
      for (const node of nodes) {
        if (selectedIds.has(node.id)) {
          result.push(node)
        }
        if (node.children) {
          result.push(...findNodes(node.children))
        }
      }
      return result
    }
    
    return findNodes(allNodes)
  }, [selectionState.selectedNodes])

  // Получение ID выделенных узлов для конкретного дерева
  const getSelectedNodeIds = useCallback((treeId: string): string[] => {
    const result: string[] = []
    selectionState.selectedNodes.forEach((value, key) => {
      if (value.treeId === treeId) {
        result.push(value.nodeId)
      }
    })
    return result
  }, [selectionState.selectedNodes])

  // Удаление выделенных узлов из состояния выделения (после операций)
  const removeNodesFromSelection = useCallback((treeId: string, nodeIds: string[]) => {
    setSelectionState(prev => {
      const newSelectedNodes = new Map(prev.selectedNodes)
      nodeIds.forEach(nodeId => {
        newSelectedNodes.delete(`${treeId}:${nodeId}`)
      })
      const newState = { ...prev, selectedNodes: newSelectedNodes }
      saveSelectionState(newState)
      return newState
    })
  }, [saveSelectionState])

  return {
    selectionState,
    toggleSelectionMode,
    toggleMoveMode,
    toggleNodeSelection,
    isNodeSelected,
    clearSelection,
    selectMultipleNodes,
    getSelectionCount,
    getSelectedNodesForTree,
    getAllSelectedNodes,
    getSelectedNodesWithData,
    getSelectedNodeIds,
    removeNodesFromSelection,
  }
}