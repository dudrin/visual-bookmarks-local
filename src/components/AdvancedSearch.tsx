import React, { useState, useEffect, useRef } from 'react';
import Icon from '../icons';
import SearchResults from './SearchResults';
import FullTextSearch, { SearchResult, SearchOptions } from '../services/FullTextSearch';
import { Tag as TagModel } from '../models/TagModels';
import Tag from './Tag';

interface AdvancedSearchProps {
  searchService: FullTextSearch;
  tags?: TagModel[];
  onClose?: () => void;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

/**
 * Компонент расширенного поиска с поддержкой полнотекстового поиска
 */
const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchService,
  tags = [],
  onClose,
  onResultClick,
  className = ''
}) => {
  // Состояние поиска
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  
  // Настройки поиска
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    includeContent: true,
    includeTags: true,
    exactMatch: false,
    limit: 50
  });
  
  // Выбранные теги для фильтрации
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Статистика индекса
  const [indexStats, setIndexStats] = useState<{
    documentCount: number;
    termCount: number;
    storageSize: string;
  }>({ documentCount: 0, termCount: 0, storageSize: '0 байт' });
  
  // Ссылка на поле ввода для автофокуса
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Загрузка статистики индекса при монтировании
  useEffect(() => {
    setIndexStats(searchService.getStats());
  }, [searchService]);
  
  // Автофокус на поле ввода
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Обработчик изменения поискового запроса
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // Обработчик изменения настроек поиска
  const handleOptionChange = (option: keyof SearchOptions, value: any) => {
    setSearchOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // Обработчик выбора тега
  const handleTagSelect = (tagId: string) => {
    setSelectedTags(prev => {
      const index = prev.indexOf(tagId);
      if (index === -1) {
        return [...prev, tagId];
      } else {
        return prev.filter(id => id !== tagId);
      }
    });
  };
  
  // Очистка выбранных тегов
  const clearSelectedTags = () => {
    setSelectedTags([]);
  };
  
  // Выполнение поиска
  const handleSearch = async () => {
    if (!query.trim() && selectedTags.length === 0) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Выполняем поиск
      const searchResults = searchService.search(query, searchOptions);
      
      // Фильтруем результаты по тегам, если выбраны теги
      let filteredResults = searchResults;
      
      if (selectedTags.length > 0) {
        filteredResults = searchResults.filter(result => {
          // Получаем теги для документа
          const document = searchService.getDocumentById(result.id);
          if (!document || !document.tags || document.tags.length === 0) {
            return false;
          }
          
          // Проверяем, содержит ли документ хотя бы один из выбранных тегов
          return selectedTags.some(tagId => document.tags!.includes(tagId));
        });
      }
      
      setResults(filteredResults);
    } catch (error) {
      console.error('Ошибка при выполнении поиска:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Выполняем поиск при изменении запроса, настроек или выбранных тегов
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, searchOptions, selectedTags]);
  
  return (
    <div className={`advanced-search ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Заголовок */}
      <div className="advanced-search-header" style={{
        padding: '15px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Расширенный поиск</h2>
        
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            <Icon type="close" size={20} />
          </button>
        )}
      </div>
      
      {/* Форма поиска */}
      <div className="search-form" style={{
        padding: '15px',
        borderBottom: '1px solid #eee'
      }}>
        <div className="search-input-wrapper" style={{
          position: 'relative',
          marginBottom: '10px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Введите поисковый запрос..."
            style={{
              width: '100%',
              padding: '10px 40px 10px 15px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <Icon 
            type="search" 
            size={20} 
            color="#999"
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />
        </div>
        
        {/* Выбранные теги */}
        {selectedTags.length > 0 && (
          <div className="selected-tags" style={{
            marginBottom: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px'
          }}>
            {selectedTags.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              
              return (
                <Tag
                  key={tag.id}
                  id={tag.id}
                  name={tag.name}
                  color={tag.color}
                  selected
                  onClick={handleTagSelect}
                  size="small"
                />
              );
            })}
            
            <button
              onClick={clearSelectedTags}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 5px',
                fontSize: '12px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Icon type="clear" size={12} />
              Очистить
            </button>
          </div>
        )}
        
        {/* Кнопка настроек поиска */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setShowOptions(!showOptions)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              fontSize: '14px',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Icon type={showOptions ? 'close' : 'search'} size={14} />
            {showOptions ? 'Скрыть настройки' : 'Настройки поиска'}
          </button>
          
          <div style={{ fontSize: '12px', color: '#999' }}>
            Проиндексировано: {indexStats.documentCount} стр.
          </div>
        </div>
        
        {/* Настройки поиска */}
        {showOptions && (
          <div className="search-options" style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={searchOptions.includeContent}
                  onChange={(e) => handleOptionChange('includeContent', e.target.checked)}
                />
                Искать в содержимом страниц
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={searchOptions.includeTags}
                  onChange={(e) => handleOptionChange('includeTags', e.target.checked)}
                />
                Искать в тегах
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={searchOptions.exactMatch}
                  onChange={(e) => handleOptionChange('exactMatch', e.target.checked)}
                />
                Точное совпадение всех слов
              </label>
            </div>
            
            <div>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                Максимальное количество результатов:
              </label>
              <select
                value={searchOptions.limit}
                onChange={(e) => handleOptionChange('limit', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            {/* Фильтр по тегам */}
            {tags.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                  Фильтровать по тегам:
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '5px',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  padding: '5px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#fff'
                }}>
                  {tags.map(tag => (
                    <Tag
                      key={tag.id}
                      id={tag.id}
                      name={tag.name}
                      color={tag.color}
                      selected={selectedTags.includes(tag.id)}
                      onClick={handleTagSelect}
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Статистика индекса */}
            <div style={{ 
              marginTop: '15px', 
              fontSize: '12px', 
              color: '#999',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Проиндексировано: {indexStats.documentCount} стр.</span>
              <span>Размер индекса: {indexStats.storageSize}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Результаты поиска */}
      <div className="search-results-container" style={{
        flex: 1,
        overflow: 'auto',
        padding: '15px'
      }}>
        <SearchResults
          results={results}
          query={query}
          loading={loading}
          onResultClick={onResultClick}
          showPreview={true}
        />
      </div>
    </div>
  );
};

export default AdvancedSearch;