import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface PagePreviewProps {
  url: string;
  title: string;
  width?: number;
  height?: number;
  onClose?: () => void;
}

/**
 * Компонент для предпросмотра страницы по URL
 * Показывает превью страницы при наведении на закладку
 */
const PagePreview: React.FC<PagePreviewProps> = ({
  url,
  title,
  width = 320,
  height = 200,
  onClose
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Генерация URL для предпросмотра через сервис скриншотов
  useEffect(() => {
    if (!url) return;
    
    // Очищаем предыдущие состояния
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    
    // Используем Google Page Speed API для получения скриншота
    // Альтернативно можно использовать другие сервисы скриншотов
    const encodedUrl = encodeURIComponent(url);
    const previewApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&screenshot=true`;
    
    fetch(previewApiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Не удалось загрузить превью');
        }
        return response.json();
      })
      .then(data => {
        if (data.lighthouseResult?.audits?.['final-screenshot']?.details?.data) {
          const screenshotData = data.lighthouseResult.audits['final-screenshot'].details.data;
          setPreviewUrl(screenshotData);
          setLoading(false);
        } else {
          throw new Error('Скриншот не найден в ответе');
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки превью:', err);
        setError(err.message || 'Не удалось загрузить превью');
        setLoading(false);
      });
      
    // Альтернативный вариант - использовать сервис превью
    // setPreviewUrl(`https://api.thumbnail.ws/api/thumbnail/get?url=${encodedUrl}&width=${width}`);
    // setLoading(false);
    
    // Функция очистки при размонтировании компонента
    return () => {
      // Отменить запросы, если они в процессе
    };
  }, [url, width]);

  // Обработчик клика вне компонента для закрытия
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(event.target as Node) && onClose) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      className="page-preview" 
      ref={previewRef}
      style={{ 
        width: `${width}px`, 
        maxWidth: '100%',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'absolute',
        zIndex: 1000
      }}
    >
      <div className="page-preview-header" style={{ 
        padding: '8px 12px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f8f8'
      }}>
        <div className="page-preview-title" style={{ 
          fontWeight: 'bold',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '14px'
        }}>
          {title || url}
        </div>
        {onClose && (
          <button 
            className="page-preview-close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <Icon type="close" size={16} />
          </button>
        )}
      </div>
      
      <div className="page-preview-content" style={{ 
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        {loading && (
          <div className="page-preview-loading" style={{ textAlign: 'center' }}>
            <div className="spinner" style={{
              width: '30px',
              height: '30px',
              margin: '0 auto',
              border: '3px solid rgba(0,0,0,0.1)',
              borderRadius: '50%',
              borderTop: '3px solid #3498db',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              Загрузка превью...
            </div>
          </div>
        )}
        
        {error && (
          <div className="page-preview-error" style={{ 
            textAlign: 'center',
            padding: '20px',
            color: '#e74c3c'
          }}>
            <Icon type="preview" size={32} color="#e74c3c" />
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              {error}
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3498db', textDecoration: 'none' }}
              >
                Открыть страницу
              </a>
            </div>
          </div>
        )}
        
        {previewUrl && !loading && !error && (
          <img 
            src={previewUrl} 
            alt={`Превью страницы ${title || url}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PagePreview;