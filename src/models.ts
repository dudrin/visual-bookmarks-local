export type TreeNode = {
  id: string;
  title: string;
  url?: string;
  children?: TreeNode[];
  // офлайн/вложения — только метаданные
  offlineId?: number;        // chrome.downloads id
  offlinePath?: string;      // путь файла в системе загрузок
  mime?: string | null;      // тип, если это документ/изображение/архив и т.п.
};

// Состояние UI для каждого дерева
export type TreeUIState = {
  // раскрытые узлы по их ID
  expandedNodes: Set<string>;
  // текущий поисковый запрос
  searchQuery: string;
  // выбранный уровень фильтра (-1 = все)
  filterLevel: number;
  // позиция прокрутки
  scrollPosition: number;
};

// Глобальное состояние выделения элементов (персистентно между деревьями)
export type SelectionState = {
  // ID выделенных узлов с указанием к какому дереву они принадлежат
  selectedNodes: Map<string, { treeId: string; nodeId: string; title: string; url?: string }>;
  // включён ли режим выделения
  selectionMode: boolean;
  // режим перемещения (true) или копирования (false)
  moveMode: boolean;
};

export type TreeDocument = {
  id: string;
  title: string;
  nodes: TreeNode[];
  createdAt?: string; // ISO
};

export const DEBUG = false;
