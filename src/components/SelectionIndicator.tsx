import React from 'react';
import Icon from '../icons';

type SelectionIndicatorProps = {
  selectionCount: number;
  selectionMode: boolean;
  moveMode: boolean;
  onToggleSelectionMode: () => void;
  onToggleMoveMode: () => void;
  onClearSelection: () => void;
  onDeleteSelected?: () => void;
};

/**
 * Компонент индикатора выделения элементов
 * Показывает количество выделенных элементов и предоставляет кнопки для управления выделением
 */
const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  selectionCount,
  selectionMode,
  moveMode,
  onToggleSelectionMode,
  onToggleMoveMode,
  onClearSelection,
  onDeleteSelected
}) => {
  return (
    <div className="selection-indicator">
      <div className="selection-controls">
        <button 
          className={`selection-mode-btn ${selectionMode ? 'active' : ''}`}
          onClick={onToggleSelectionMode}
          title={selectionMode ? 'Выключить режим выделения' : 'Включить режим выделения'}
        >
          <Icon 
            type={selectionMode ? 'checkbox-checked' : 'checkbox'} 
            size={18} 
            className="selection-icon" 
          />
          {selectionMode ? 'Режим выделения' : 'Выделить'}
        </button>
        
        {selectionMode && (
          <button 
            className={`move-mode-btn ${moveMode ? 'active' : ''}`}
            onClick={onToggleMoveMode}
            title={moveMode ? 'Переключить на копирование' : 'Переключить на перемещение'}
          >
            <Icon 
              type={moveMode ? 'move' : 'copy'} 
              size={18} 
              className="move-icon" 
            />
            {moveMode ? 'Переместить' : 'Копировать'}
          </button>
        )}
        
        {selectionMode && selectionCount > 0 && (
          <>
            <div className="selection-count">
              <span className="count-badge">{selectionCount}</span>
              <span className="count-text">
                {selectionCount === 1 ? 'элемент' : 
                 selectionCount < 5 ? 'элемента' : 'элементов'} выделено
              </span>
            </div>
            
            <div className="group-operations">
              {onDeleteSelected && (
                <button 
                  className="group-operation-btn delete-btn"
                  onClick={onDeleteSelected}
                  title="Удалить выделенные элементы"
                >
                  <Icon type="delete" size={18} className="delete-icon" />
                  Удалить
                </button>
              )}
            </div>
            
            <button 
              className="clear-selection-btn"
              onClick={onClearSelection}
              title="Убрать все выделения"
            >
              <Icon type="clear" size={18} className="clear-icon" />
              Убрать выделение
            </button>
          </>
        )}
      </div>
      
      {selectionMode && selectionCount === 0 && (
        <div className="selection-hint">
          <span className="hint-text">
            Кликайте на элементы для выделения или используйте Ctrl+клик
          </span>
        </div>
      )}
    </div>
  );
};

export default SelectionIndicator;