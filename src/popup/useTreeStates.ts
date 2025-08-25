import { useState, useRef, useCallback, useEffect } from 'react'
import type { TreeUIState } from '../models'

// Состояние по умолчанию для нового дерева
const createDefaultState = (): TreeUIState => ({
  expandedNodes: new Set<string>(),
  searchQuery: '',
  filterLevel: -1,
  scrollPosition: 0,
})

// Сериализация состояния для сохранения
const serializeState = (state: TreeUIState) => ({
  expandedNodes: Array.from(state.expandedNodes),
  searchQuery: state.searchQuery,
  filterLevel: state.filterLevel,
  scrollPosition: state.scrollPosition,
})

// Десериализация состояния из сохраненных данных
const deserializeState = (data: any): TreeUIState => {
  if (!data || typeof data !== 'object') return createDefaultState()
  
  return {
    expandedNodes: new Set(Array.isArray(data.expandedNodes) ? data.expandedNodes : []),
    searchQuery: typeof data.searchQuery === 'string' ? data.searchQuery : '',
    filterLevel: typeof data.filterLevel === 'number' ? data.filterLevel : -1,
    scrollPosition: typeof data.scrollPosition === 'number' ? data.scrollPosition : 0,
  }
}

/**
 * Хук для управления состоянием UI деревьев с автоматическим сохранением
 */
export function useTreeStates() {
  const [states, setStates] = useState<Map<string, TreeUIState>>(new Map())
  const saveTimer = useRef<number | null>(null)

  // Загрузка сохраненных состояний при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vb_tree_ui_states')
      if (saved) {
        const parsed = JSON.parse(saved)
        const restoredStates = new Map<string, TreeUIState>()
        
        Object.entries(parsed).forEach(([treeId, data]) => {
          restoredStates.set(treeId, deserializeState(data))
        })
        
        setStates(restoredStates)
      }
    } catch (error) {
      console.warn('Failed to load tree UI states:', error)
    }
  }, [])

  // Сохранение состояний с дебаунсом
  const saveStates = useCallback((currentStates: Map<string, TreeUIState>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    
    saveTimer.current = window.setTimeout(() => {
      try {
        const serialized: Record<string, any> = {}
        currentStates.forEach((state, treeId) => {
          serialized[treeId] = serializeState(state)
        })
        
        localStorage.setItem('vb_tree_ui_states', JSON.stringify(serialized))
      } catch (error) {
        console.warn('Failed to save tree UI states:', error)
      }
    }, 500) // 500ms дебаунс
  }, [])

  // Получение состояния для конкретного дерева
  const getState = useCallback((treeId: string): TreeUIState => {
    return states.get(treeId) || createDefaultState()
  }, [states])

  // Обновление состояния дерева
  const updateState = useCallback((treeId: string, updater: (prev: TreeUIState) => TreeUIState) => {
    setStates(prevStates => {
      const newStates = new Map(prevStates)
      const currentState = newStates.get(treeId) || createDefaultState()
      const newState = updater(currentState)
      newStates.set(treeId, newState)
      
      // Сохраняем асинхронно
      saveStates(newStates)
      
      return newStates
    })
  }, [saveStates])

  // Удаление состояния дерева
  const removeState = useCallback((treeId: string) => {
    setStates(prevStates => {
      const newStates = new Map(prevStates)
      newStates.delete(treeId)
      saveStates(newStates)
      return newStates
    })
  }, [saveStates])

  // Очистка всех состояний
  const clearAllStates = useCallback(() => {
    setStates(new Map())
    localStorage.removeItem('vb_tree_ui_states')
  }, [])

  return {
    getState,
    updateState,
    removeState,
    clearAllStates,
  }
}