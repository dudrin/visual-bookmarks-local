import React, { useState, useEffect, useRef } from 'react';
import Tag from './Tag';
import Icon from '../icons';
import { Tag as TagModel } from '../models/TagModels';

interface TagManagerProps {
  tags: TagModel[];
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagCreate?: (tagName: string, color?: string) => void;
  onTagDelete?: (tagId: string) => void;
  onTagEdit?: (tagId: string, updates: Partial<TagModel>) => void;
  showControls?: boolean;
  className?: string;
}

/**
 * Компонент для управления тегами
 * Позволяет просматривать, выбирать, создавать, редактировать и удалять теги
 */
const TagManager: React.FC<TagManagerProps> = ({
  tags,
  selectedTags = [],
  onTagSelect,
  onTagCreate,
  onTagDelete,
  onTagEdit,
  showControls = true,
  className = ''
}) => {
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagColor, setNewTagColor] = useState<string>('#3498db');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Фильтрация тегов по поисковому запросу
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Обработчик создания нового тега
  const handleCreateTag = () => {
    if (newTagName.trim() && onTagCreate) {
      onTagCreate(newTagName.trim(), newTagColor);
      setNewTagName('');
      setIsCreating(false);
    }
  };

  // Обработчик нажатия Enter в поле ввода
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTagName('');
    }
  };

  // Фокус на поле ввода при открытии формы создания
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Генерация случайного цвета для нового тега
  const generateRandomColor = () => {
    const colors = [
      '#3498db', // синий
      '#2ecc71', // зеленый
      '#e74c3c', // красный
      '#f39c12', // оранжевый
      '#9b59b6', // фиолетовый
      '#1abc9c', // бирюзовый
      '#34495e', // темно-синий
      '#e67e22', // оранжево-коричневый
      '#16a085', // зелено-бирюзовый
      '#d35400', // темно-оранжевый
      '#27ae60', // изумрудный
      '#2980b9', // темно-синий
      '#8e44ad', // темно-фиолетовый
      '#f1c40f', // желтый
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className={`tag-manager ${className}`}>
      {/* Поиск тегов */}
      {tags.length > 0 && (
        <div className="tag-search" style={{
          marginBottom: '10px',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="Поиск тегов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 30px 8px 8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
          <Icon 
            type="search" 
            size={16} 
            color="#999"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />
        </div>
      )}
      
      {/* Список тегов */}
      <div className="tags-list" style={{
        marginBottom: '10px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => (
            <Tag
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color || '#3498db'}
              selected={selectedTags.includes(tag.id)}
              onClick={onTagSelect ? () => onTagSelect(tag.id) : undefined}
              onRemove={onTagDelete ? () => onTagDelete(tag.id) : undefined}
              size="medium"
            />
          ))
        ) : searchQuery ? (
          <div style={{ 
            padding: '10px', 
            color: '#666', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            Теги не найдены
          </div>
        ) : tags.length === 0 ? (
          <div style={{ 
            padding: '10px', 
            color: '#666', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            Нет созданных тегов
          </div>
        ) : null}
      </div>
      
      {/* Форма создания нового тега */}
      {showControls && (
        <div className="tag-create">
          {isCreating ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Название тега"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  style={{
                    width: '30px',
                    height: '30px',
                    padding: '0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={() => setNewTagColor(generateRandomColor())}
                  style={{
                    padding: '6px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="Случайный цвет"
                >
                  🎲
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: newTagName.trim() ? '#3498db' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: newTagName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  Создать
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: '#f1f1f1',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '8px',
                backgroundColor: '#f1f1f1',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                gap: '6px'
              }}
            >
              <Icon type="tag" size={14} />
              Создать новый тег
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TagManager;