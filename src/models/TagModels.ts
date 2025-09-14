/**
 * Модели данных для системы тегов
 */

// Модель тега
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: string; // ISO дата создания
  updatedAt: string; // ISO дата обновления
}

// Связь между тегом и закладкой
export interface TagRelation {
  tagId: string;
  nodeId: string;
  treeId: string;
}

// Расширение модели TreeNode для поддержки тегов
export interface TaggedTreeNode {
  id: string;
  tags?: string[]; // Массив ID тегов
}

// Настройки отображения тегов
export interface TagDisplaySettings {
  showInTree: boolean;
  showColors: boolean;
  maxTagsToShow: number;
}

// Состояние фильтрации по тегам
export interface TagFilterState {
  selectedTags: string[];
  matchType: 'any' | 'all'; // 'any' - любой из тегов, 'all' - все теги
  showUntagged: boolean;
}