import { useState, useEffect, useCallback } from 'react';
import { Tag, TagRelation, TagFilterState } from '../models/TagModels';
import { TreeNode } from '../models';

interface UseTagsOptions {
  initialTags?: Tag[];
  initialRelations?: TagRelation[];
  storageKey?: string;
}

/**
 * Хук для управления тегами и их связями с закладками
 */
export function useTags({
  initialTags = [],
  initialRelations = [],
  storageKey = 'visual-bookmarks-tags'
}: UseTagsOptions = {}) {
  // Состояние для хранения тегов и их связей
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [relations, setRelations] = useState<TagRelation[]>(initialRelations);
  const [filterState, setFilterState] = useState<TagFilterState>({
    selectedTags: [],
    matchType: 'any',
    showUntagged: false
  });

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.tags) setTags(parsedData.tags);
          if (parsedData.relations) setRelations(parsedData.relations);
        }
      } catch (error) {
        console.error('Ошибка при загрузке тегов из localStorage:', error);
      }
    };

    // Загружаем данные только если не были переданы начальные значения
    if (initialTags.length === 0 && initialRelations.length === 0) {
      loadFromStorage();
    }
  }, [storageKey, initialTags.length, initialRelations.length]);

  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tags, relations }));
    } catch (error) {
      console.error('Ошибка при сохранении тегов в localStorage:', error);
    }
  }, [tags, relations, storageKey]);

  // Создание нового тега
  const createTag = useCallback((name: string, color?: string): Tag => {
    const newTag: Tag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      color: color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTags(prevTags => [...prevTags, newTag]);
    return newTag;
  }, []);

  // Обновление существующего тега
  const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
    setTags(prevTags => 
      prevTags.map(tag => 
        tag.id === id 
          ? { ...tag, ...updates, updatedAt: new Date().toISOString() } 
          : tag
      )
    );
  }, []);

  // Удаление тега
  const deleteTag = useCallback((id: string) => {
    setTags(prevTags => prevTags.filter(tag => tag.id !== id));
    setRelations(prevRelations => prevRelations.filter(rel => rel.tagId !== id));
  }, []);

  // Добавление тега к узлу
  const addTagToNode = useCallback((tagId: string, nodeId: string, treeId: string) => {
    // Проверяем, существует ли уже такая связь
    const exists = relations.some(
      rel => rel.tagId === tagId && rel.nodeId === nodeId && rel.treeId === treeId
    );

    if (!exists) {
      setRelations(prevRelations => [
        ...prevRelations,
        { tagId, nodeId, treeId }
      ]);
    }
  }, [relations]);

  // Удаление тега из узла
  const removeTagFromNode = useCallback((tagId: string, nodeId: string, treeId: string) => {
    setRelations(prevRelations => 
      prevRelations.filter(
        rel => !(rel.tagId === tagId && rel.nodeId === nodeId && rel.treeId === treeId)
      )
    );
  }, []);

  // Получение тегов для конкретного узла
  const getNodeTags = useCallback((nodeId: string, treeId: string): Tag[] => {
    const nodeTagIds = relations
      .filter(rel => rel.nodeId === nodeId && rel.treeId === treeId)
      .map(rel => rel.tagId);
    
    return tags.filter(tag => nodeTagIds.includes(tag.id));
  }, [tags, relations]);

  // Получение узлов с конкретным тегом
  const getNodesWithTag = useCallback((tagId: string, treeId: string): string[] => {
    return relations
      .filter(rel => rel.tagId === tagId && rel.treeId === treeId)
      .map(rel => rel.nodeId);
  }, [relations]);

  // Фильтрация узлов по тегам
  const filterNodesByTags = useCallback((
    nodes: TreeNode[], 
    treeId: string,
    filter: TagFilterState = filterState
  ): TreeNode[] => {
    if (filter.selectedTags.length === 0 && !filter.showUntagged) {
      return nodes;
    }

    return nodes.filter(node => {
      // Получаем теги узла
      const nodeTags = relations
        .filter(rel => rel.nodeId === node.id && rel.treeId === treeId)
        .map(rel => rel.tagId);
      
      // Если узел не имеет тегов и showUntagged=true, включаем его
      if (nodeTags.length === 0 && filter.showUntagged) {
        return true;
      }
      
      // Если выбраны теги для фильтрации
      if (filter.selectedTags.length > 0) {
        if (filter.matchType === 'any') {
          // Включаем узел, если он имеет хотя бы один из выбранных тегов
          return filter.selectedTags.some(tagId => nodeTags.includes(tagId));
        } else {
          // Включаем узел, если он имеет все выбранные теги
          return filter.selectedTags.every(tagId => nodeTags.includes(tagId));
        }
      }
      
      return false;
    });
  }, [relations, filterState]);

  // Обновление состояния фильтра
  const updateFilterState = useCallback((newFilterState: TagFilterState) => {
    setFilterState(newFilterState);
  }, []);

  return {
    tags,
    relations,
    filterState,
    createTag,
    updateTag,
    deleteTag,
    addTagToNode,
    removeTagFromNode,
    getNodeTags,
    getNodesWithTag,
    filterNodesByTags,
    updateFilterState
  };
}

export default useTags;