import React, { useState, useRef, useEffect } from 'react';
import Icon from '../icons';

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

/**
 * Компонент редактора форматированного текста
 * Позволяет создавать и редактировать форматированный текст с поддержкой
 * жирного, курсивного, подчеркнутого текста, списков, ссылок и т.д.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Введите текст...',
  minHeight = 150,
  maxHeight = 500,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  
  // Инициализация редактора
  useEffect(() => {
    if (editorRef.current) {
      // Устанавливаем начальное значение
      editorRef.current.innerHTML = initialValue;
      
      // Делаем редактор редактируемым
      editorRef.current.contentEditable = 'true';
    }
  }, [initialValue]);
  
  // Обработчик изменений в редакторе
  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Обработчики фокуса
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // Команды форматирования
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
    
    // Возвращаем фокус в редактор
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Форматирование текста
  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');
  
  // Списки
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberedList = () => execCommand('insertOrderedList');
  
  // Выравнивание
  const handleAlignLeft = () => execCommand('justifyLeft');
  const handleAlignCenter = () => execCommand('justifyCenter');
  const handleAlignRight = () => execCommand('justifyRight');
  
  // Отступы
  const handleIndent = () => execCommand('indent');
  const handleOutdent = () => execCommand('outdent');
  
  // Вставка ссылки
  const handleLink = () => {
    const url = prompt('Введите URL:', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  };
  
  // Удаление форматирования
  const handleRemoveFormat = () => execCommand('removeFormat');
  
  // Проверка активности форматирования
  const isFormatActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };
  
  // Стили для кнопок панели инструментов
  const toolbarButtonStyle = (active: boolean = false) => ({
    padding: '6px',
    backgroundColor: active ? '#e1e1e1' : 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  return (
    <div className={`rich-text-editor ${className}`} style={{
      border: `1px solid ${isFocused ? '#3498db' : '#ddd'}`,
      borderRadius: '4px',
      overflow: 'hidden',
      transition: 'border-color 0.2s'
    }}>
      {/* Панель инструментов */}
      <div className="editor-toolbar" style={{
        display: 'flex',
        padding: '5px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f9f9f9',
        flexWrap: 'wrap',
        gap: '5px'
      }}>
        {/* Группа форматирования текста */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={handleBold}
            style={toolbarButtonStyle(isFormatActive('bold'))}
            title="Жирный (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          
          <button
            type="button"
            onClick={handleItalic}
            style={toolbarButtonStyle(isFormatActive('italic'))}
            title="Курсив (Ctrl+I)"
          >
            <em>I</em>
          </button>
          
          <button
            type="button"
            onClick={handleUnderline}
            style={toolbarButtonStyle(isFormatActive('underline'))}
            title="Подчеркнутый (Ctrl+U)"
          >
            <u>U</u>
          </button>
          
          <button
            type="button"
            onClick={handleStrikethrough}
            style={toolbarButtonStyle(isFormatActive('strikeThrough'))}
            title="Зачеркнутый"
          >
            <s>S</s>
          </button>
        </div>
        
        {/* Разделитель */}
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }}></div>
        
        {/* Группа списков */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={handleBulletList}
            style={toolbarButtonStyle(isFormatActive('insertUnorderedList'))}
            title="Маркированный список"
          >
            <Icon type="tag" size={16} />
          </button>
          
          <button
            type="button"
            onClick={handleNumberedList}
            style={toolbarButtonStyle(isFormatActive('insertOrderedList'))}
            title="Нумерованный список"
          >
            <span style={{ fontWeight: 'bold' }}>1.</span>
          </button>
        </div>
        
        {/* Разделитель */}
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }}></div>
        
        {/* Группа выравнивания */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={handleAlignLeft}
            style={toolbarButtonStyle(isFormatActive('justifyLeft'))}
            title="Выравнивание по левому краю"
          >
            <Icon type="tag" size={16} />
          </button>
          
          <button
            type="button"
            onClick={handleAlignCenter}
            style={toolbarButtonStyle(isFormatActive('justifyCenter'))}
            title="Выравнивание по центру"
          >
            <Icon type="tag" size={16} />
          </button>
          
          <button
            type="button"
            onClick={handleAlignRight}
            style={toolbarButtonStyle(isFormatActive('justifyRight'))}
            title="Выравнивание по правому краю"
          >
            <Icon type="tag" size={16} />
          </button>
        </div>
        
        {/* Разделитель */}
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }}></div>
        
        {/* Группа отступов */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={handleIndent}
            style={toolbarButtonStyle()}
            title="Увеличить отступ"
          >
            <Icon type="tag" size={16} />
          </button>
          
          <button
            type="button"
            onClick={handleOutdent}
            style={toolbarButtonStyle()}
            title="Уменьшить отступ"
          >
            <Icon type="tag" size={16} />
          </button>
        </div>
        
        {/* Разделитель */}
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }}></div>
        
        {/* Группа ссылок */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={handleLink}
            style={toolbarButtonStyle()}
            title="Вставить ссылку"
          >
            <Icon type="tag" size={16} />
          </button>
        </div>
        
        {/* Разделитель */}
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }}></div>
        
        {/* Группа очистки форматирования */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={handleRemoveFormat}
            style={toolbarButtonStyle()}
            title="Удалить форматирование"
          >
            <Icon type="clear" size={16} />
          </button>
        </div>
      </div>
      
      {/* Область редактирования */}
      <div
        ref={editorRef}
        className="editor-content"
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          padding: '10px',
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflow: 'auto',
          outline: 'none',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        data-placeholder={placeholder}
      />
      
      {/* Стили для плейсхолдера */}
      <style jsx>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #999;
        }
        
        .editor-content a {
          color: #3498db;
          text-decoration: underline;
        }
        
        .editor-content ul, .editor-content ol {
          margin-left: 20px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;