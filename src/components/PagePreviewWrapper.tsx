import React, { useRef, useEffect } from 'react';
import PagePreview from './PagePreview';
import usePagePreview from '../hooks/usePagePreview';

interface PagePreviewWrapperProps {
  children: React.ReactNode;
  url: string;
  title: string;
  enabled?: boolean;
  previewDelay?: number;
  width?: number;
  height?: number;
}

/**
 * Компонент-обертка для предпросмотра страниц
 * Оборачивает элемент и показывает превью при наведении
 */
const PagePreviewWrapper: React.FC<PagePreviewWrapperProps> = ({
  children,
  url,
  title,
  enabled = true,
  previewDelay = 700,
  width = 320,
  height = 200
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    previewUrl,
    previewTitle,
    isVisible,
    position,
    showPreview,
    hidePreview
  } = usePagePreview({ delay: previewDelay, enabled });

  // Обработчики событий мыши
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !url) return;
    
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Вычисляем позицию для превью
    // Показываем справа от элемента, если есть место, иначе слева
    const viewportWidth = window.innerWidth;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;
    
    let x = 0;
    if (spaceRight >= width + 10) {
      // Показываем справа
      x = rect.right + 10;
    } else if (spaceLeft >= width + 10) {
      // Показываем слева
      x = rect.left - width - 10;
    } else {
      // Показываем по центру, если нет места ни справа, ни слева
      x = Math.max(10, (viewportWidth - width) / 2);
    }
    
    // По вертикали центрируем относительно элемента
    const y = Math.max(10, rect.top + rect.height / 2 - height / 2);
    
    showPreview(url, title, x, y);
  };

  const handleMouseLeave = () => {
    hidePreview();
  };

  // Обработка клика для предотвращения показа превью
  const handleClick = () => {
    hidePreview();
  };

  // Создаем портал для превью, чтобы он не был ограничен родительским контейнером
  return (
    <>
      <div 
        ref={wrapperRef}
        className="page-preview-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </div>
      
      {isVisible && previewUrl && (
        <div 
          className="page-preview-portal"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <PagePreview
            url={previewUrl}
            title={previewTitle || ''}
            width={width}
            height={height}
            onClose={hidePreview}
          />
        </div>
      )}
    </>
  );
};

export default PagePreviewWrapper;