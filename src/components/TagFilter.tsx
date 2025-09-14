import React, { useState } from 'react';
import Tag from './Tag';
import Icon from '../icons';
import { Tag as TagModel, TagFilterState } from '../models/TagModels';

interface TagFilterProps {
  tags: TagModel[];
  filterState: TagFilterState;
  onFilterChange: (newFilter: TagFilterState) => void;
  className?: string;
}

/**
 * Компонент для фильтрации закладок по тегам
 */
const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  filterState,
  onFilterChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Фильтрация тегов по поисковому запросу
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Обработчик выбора тега
  const handleTagSelect = (tagId: string) => {
    const selectedTags = [...filterState.selectedTags];
    const index = selectedTags.indexOf(tagId);
    
    if (index === -1) {
      // Добавляем тег, если его нет в выбранных
      selectedTags.push(tagId);
    } else {
      // Удаляем тег, если он уже выбран
      selectedTags.splice(index, 1);
    }
    
    onFilterChange({
      ...filterState,
      selectedTags
    });
  };

  // Обработчик изменения типа соответствия (все/любой)
  const handleMatchTypeChange = (matchType: 'any' | 'all') => {
    onFilterChange({
      ...filterState,
      matchType
    });
  };

  // Обработчик изменения показа незатегированных элементов
  const handleShowUntaggedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterState,
      showUntagged: e.target.checked
    });
  };

  // Очистка всех фильтров
  const handleClearFilters = () => {
    onFilterChange({
      selectedTags: [],
      matchType: 'any',
      showUntagged: false
    });
  };

  return (
    <div className={`tag-filter ${className}`} style={{
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      {/* Заголовок с кнопкой разворачивания */}
      <div 
        className="tag-filter-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderBottom: isExpanded ? '1px solid #ddd' : 'none',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon type="tag" size={16} />
          <span style={{ fontWeight: 'bold' }}>Фильтр по тегам</span>
          {filterState.selectedTags.length > 0 && (
            <span style={{
              backgroundColor: '#3498db',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {filterState.selectedTags.length}
            </span>
          )}
        </div>
        <Icon 
          type={isExpanded ? 'close' : 'search'} 
          size={16} 
          color="#666"
        />
      </div>
      
      {/* Содержимое фильтра (отображается только если развернуто) */}
      {isExpanded && (
        <div className="tag-filter-content" style={{ padding: '10px' }}>
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
                  selected={filterState.selectedTags.includes(tag.id)}
                  onClick={handleTagSelect}
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
          
          {/* Настройки фильтра */}
          {filterState.selectedTags.length > 0 && (
            <div className="filter-settings" style={{
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px'
            }}>
              <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                Настройки фильтра:
              </div>
              
              {/* Тип соответствия */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="matchType"
                      checked={filterState.matchType === 'any'}
                      onChange={() => handleMatchTypeChange('any')}
                    />
                    Любой из тегов
                  </label>
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="matchType"
                      checked={filterState.matchType === 'all'}
                      onChange={() => handleMatchTypeChange('all')}
                    />
                    Все теги
                  </label>
                </div>
              </div>
              
              {/* Показывать незатегированные */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={filterState.showUntagged}
                    onChange={handleShowUntaggedChange}
                  />
                  Показывать элементы без тегов
                </label>
              </div>
            </div>
          )}
          
          {/* Кнопки действий */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={handleClearFilters}
              disabled={filterState.selectedTags.length === 0 && !filterState.showUntagged}
              style={{
                padding: '8px 12px',
                backgroundColor: filterState.selectedTags.length === 0 && !filterState.showUntagged ? '#f1f1f1' : '#e74c3c',
                color: filterState.selectedTags.length === 0 && !filterState.showUntagged ? '#999' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: filterState.selectedTags.length === 0 && !filterState.showUntagged ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Icon 
                type="clear" 
                size={14} 
                color={filterState.selectedTags.length === 0 && !filterState.showUntagged ? '#999' : '#fff'} 
              />
              Сбросить фильтры
            </button>
            
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;