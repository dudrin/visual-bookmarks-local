import React from 'react';

// Типы иконок, которые поддерживаются в приложении
export type IconType = 
  | 'bookmark'
  | 'folder'
  | 'folder-open'
  | 'checkbox'
  | 'checkbox-checked'
  | 'move'
  | 'copy'
  | 'delete'
  | 'clear'
  | 'search'
  | 'tag'
  | 'edit'
  | 'preview'
  | 'note'
  | 'close';

export interface IconProps {
  type: IconType;
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Компонент Icon для отображения SVG иконок
 * Заменяет текстовые иконки на SVG для лучшей масштабируемости и внешнего вида
 */
const Icon: React.FC<IconProps> = ({ 
  type, 
  size = 16, 
  color = 'currentColor',
  className = '',
  onClick,
  style = {}
}) => {
  // Объект с SVG-путями для каждого типа иконки
  const iconPaths: Record<IconType, string> = {
    'bookmark': 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm3 2h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z',
    'folder': 'M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2H4zm0 2h5.17l1.41 1.41.59.59H20v10H4V6z',
    'folder-open': 'M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2H4zm0 2h5.17l1.41 1.41.59.59H20v2H11.17l-2-2H4v8h16V8h-7.17l-1.41-1.41L11.83 6H4z',
    'checkbox': 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5z',
    'checkbox-checked': 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm11.59 2.59l-6.59 6.59-2.59-2.59-1.41 1.41 4 4 8-8-1.41-1.41z',
    'move': 'M13 6v5h5v2h-5v5h-2v-5H6v-2h5V6h2z',
    'copy': 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z',
    'delete': 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    'clear': 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    'search': 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    'tag': 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
    'edit': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    'preview': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    'note': 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
    'close': 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
  };

  const path = iconPaths[type];

  // Объединяем стили по умолчанию со стилями из props
  const combinedStyles = {
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={color}
      className={`icon icon-${type} ${className}`}
      onClick={onClick}
      style={combinedStyles}
      role="img"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
};

export default Icon;