import React from 'react';
import Icon from './Icon';

interface TagProps {
  id: string;
  name: string;
  color?: string;
  selected?: boolean;
  onClick?: (id: string) => void;
  onRemove?: (id: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Компонент для отображения тега
 */
const Tag: React.FC<TagProps> = ({
  id,
  name,
  color = '#3498db',
  selected = false,
  onClick,
  onRemove,
  size = 'medium',
  className = ''
}) => {
  // Определяем размеры в зависимости от параметра size
  const sizeStyles = {
    small: {
      padding: '2px 6px',
      fontSize: '10px',
      height: '18px',
      borderRadius: '9px',
      iconSize: 10
    },
    medium: {
      padding: '3px 8px',
      fontSize: '12px',
      height: '24px',
      borderRadius: '12px',
      iconSize: 12
    },
    large: {
      padding: '4px 10px',
      fontSize: '14px',
      height: '30px',
      borderRadius: '15px',
      iconSize: 14
    }
  };

  const currentSize = sizeStyles[size];
  
  // Обработчики событий
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(id);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove(id);
  };

  // Вычисляем контрастный цвет текста для фона
  const getContrastColor = (hexColor: string): string => {
    // Преобразуем HEX в RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Вычисляем яркость (формула из WCAG)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Возвращаем черный или белый в зависимости от яркости
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const textColor = getContrastColor(color);

  return (
    <div 
      className={`tag ${selected ? 'tag-selected' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: selected ? `${color}` : `${color}40`, // Если выбран, то полная непрозрачность, иначе 25%
        color: selected ? textColor : '#333',
        padding: currentSize.padding,
        borderRadius: currentSize.borderRadius,
        margin: '0 4px 4px 0',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: `1px solid ${color}`,
        fontSize: currentSize.fontSize,
        height: currentSize.height,
        maxWidth: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}
      onClick={handleClick}
      title={name}
    >
      <Icon 
        type="tag" 
        size={currentSize.iconSize} 
        color={selected ? textColor : color}
        style={{ marginRight: '4px' }}
      />
      <span style={{ 
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {name}
      </span>
      
      {onRemove && (
        <span 
          className="tag-remove"
          onClick={handleRemove}
          style={{
            marginLeft: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={`Удалить тег "${name}"`}
        >
          <Icon 
            type="close" 
            size={currentSize.iconSize} 
            color={selected ? textColor : '#666'}
          />
        </span>
      )}
    </div>
  );
};

export default Tag;