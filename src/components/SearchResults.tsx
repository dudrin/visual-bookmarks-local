import React from 'react';
import { SearchResult } from '../services/FullTextSearch';
import Icon from '../icons';
import PagePreviewWrapper from './PagePreviewWrapper';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
  onResultClick?: (result: SearchResult) => void;
  showPreview?: boolean;
}

/**
 * Компонент для отображения результатов поиска
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  loading,
  onResultClick,
  showPreview = true
}) => {
  // Форматирование даты последней индексации
  const formatLastIndexed = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'сегодня';
    } else if (diffDays === 1) {
      return 'вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} нед. назад`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Подсветка совпадений в тексте
  const highlightMatches = (text: string, query: string): JSX.Element => {
    if (!query.trim()) {
      return <>{text}</>;
    }
    
    const terms = query.toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1);
    
    if (terms.length === 0) {
      return <>{text}</>;
    }
    
    // Создаем регулярное выражение для поиска всех терминов
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    
    // Разбиваем текст на части и подсвечиваем совпадения
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => {
          const isMatch = terms.some(term => 
            part.toLowerCase() === term.toLowerCase()
          );
          
          return isMatch ? (
            <mark 
              key={i}
              style={{
                backgroundColor: '#ffeb3b',
                padding: '0 2px',
                borderRadius: '2px',
                fontWeight: 'bold'
              }}
            >
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          );
        })}
      </>
    );
  };

  // Обработчик клика по результату
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // По умолчанию открываем URL в новой вкладке
      window.open(result.url, '_blank');
    }
  };

  return (
    <div className="search-results" style={{
      padding: '10px',
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Заголовок с количеством результатов */}
      <div className="search-results-header" style={{
        marginBottom: '15px',
        padding: '0 0 10px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>
          {loading ? (
            'Поиск...'
          ) : results.length > 0 ? (
            `Найдено результатов: ${results.length}`
          ) : (
            'Ничего не найдено'
          )}
        </h3>
        
        {query && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            По запросу: <strong>{query}</strong>
          </div>
        )}
      </div>
      
      {/* Индикатор загрузки */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          <div className="spinner" style={{
            width: '30px',
            height: '30px',
            margin: '0 auto 10px',
            border: '3px solid rgba(0,0,0,0.1)',
            borderRadius: '50%',
            borderTop: '3px solid #3498db',
            animation: 'spin 1s linear infinite'
          }}></div>
          Выполняется поиск...
        </div>
      )}
      
      {/* Список результатов */}
      {!loading && results.length > 0 && (
        <div className="search-results-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {results.map((result) => (
            <div 
              key={result.id}
              className="search-result-item"
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #eee',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                ':hover': {
                  backgroundColor: '#f9f9f9'
                }
              }}
              onClick={() => handleResultClick(result)}
            >
              {showPreview ? (
                <PagePreviewWrapper
                  url={result.url}
                  title={result.title}
                  enabled={showPreview}
                  previewDelay={500}
                  width={320}
                  height={200}
                >
                  <div className="search-result-content">
                    <h4 style={{ 
                      margin: '0 0 8px', 
                      fontSize: '16px',
                      color: '#1a73e8'
                    }}>
                      {highlightMatches(result.title, query)}
                    </h4>
                    
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#006621',
                      marginBottom: '5px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {result.url}
                    </div>
                    
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#545454',
                      lineHeight: '1.4'
                    }}>
                      {highlightMatches(result.snippet, query)}
                    </div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#999',
                      marginTop: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Icon type="search" size={12} color="#999" />
                      Проиндексировано: {formatLastIndexed(result.lastIndexed)}
                    </div>
                  </div>
                </PagePreviewWrapper>
              ) : (
                <div className="search-result-content">
                  <h4 style={{ 
                    margin: '0 0 8px', 
                    fontSize: '16px',
                    color: '#1a73e8'
                  }}>
                    {highlightMatches(result.title, query)}
                  </h4>
                  
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#006621',
                    marginBottom: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {result.url}
                  </div>
                  
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#545454',
                    lineHeight: '1.4'
                  }}>
                    {highlightMatches(result.snippet, query)}
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999',
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Icon type="search" size={12} color="#999" />
                    Проиндексировано: {formatLastIndexed(result.lastIndexed)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Сообщение, если ничего не найдено */}
      {!loading && results.length === 0 && query && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          <Icon type="search" size={32} color="#999" />
          <p>По запросу <strong>{query}</strong> ничего не найдено.</p>
          <p style={{ fontSize: '14px' }}>
            Попробуйте изменить поисковый запрос или проиндексировать больше страниц.
          </p>
        </div>
      )}
      
      {/* Пустое состояние */}
      {!loading && results.length === 0 && !query && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          <Icon type="search" size={32} color="#999" />
          <p>Введите поисковый запрос для поиска по содержимому страниц.</p>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SearchResults;