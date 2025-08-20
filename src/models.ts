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

export type TreeDocument = {
  id: string;
  title: string;
  nodes: TreeNode[];
  createdAt?: string; // ISO
};

export const DEBUG = false;
