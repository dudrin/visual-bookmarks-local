import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import Icon from '../icons';

interface NoteEditorProps {
  nodeId: string;
  initialNote?: string;
  onSave: (nodeId: string, note: string) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Компонент для редактирования заметок к закладкам
 */
const NoteEditor: React.FC<NoteEditorProps> = ({
  nodeId,
  initialNote = '',
  onSave,
  onCancel,
  className = ''
}) => {
  const [note, setNote] = useState<string>(initialNote);
  const [isModified, setIsModified] = useState<boolean>(false);
  
  // Отслеживаем изменения в заметке
  useEffect(() => {
    setIsModified(note !== initialNote);
  }, [note, initialNote]);
  
  // Обработчик изменения заметки
  const handleNoteChange = (html: string) => {
    setNote(html);
  };
  
  // Обработчик сохранения заметки
  const handleSave = () => {
    onSave(nodeId, note);
  };
  
  // Обработчик отмены редактирования
  const handleCancel = () => {
    if (isModified) {
      if (window.confirm('Вы уверены, что хотите отменить изменения?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className={`note-editor ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Заголовок */}
      <div className="note-editor-header" style={{
        padding: '15px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>
          <Icon type="note" size={18} style={{ marginRight: '8px' }} />
          Редактирование заметки
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={!isModified}
            style={{
              padding: '8px 15px',
              backgroundColor: isModified ? '#3498db' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isModified ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Icon type="edit" size={14} color="#fff" />
            Сохранить
          </button>
          
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 15px',
              backgroundColor: '#f1f1f1',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Icon type="close" size={14} />
            Отмена
          </button>
        </div>
      </div>
      
      {/* Редактор заметок */}
      <div className="note-editor-content" style={{
        flex: 1,
        padding: '15px',
        overflow: 'auto'
      }}>
        <RichTextEditor
          initialValue={initialNote}
          onChange={handleNoteChange}
          placeholder="Введите текст заметки..."
          minHeight={200}
          maxHeight={500}
        />
      </div>
      
      {/* Подсказка */}
      <div className="note-editor-footer" style={{
        padding: '10px 15px',
        borderTop: '1px solid #eee',
        backgroundColor: '#f9f9f9',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '0 0 5px' }}>
          <strong>Совет:</strong> Используйте панель инструментов для форматирования текста.
        </p>
        <p style={{ margin: 0 }}>
          Вы можете добавлять списки, ссылки и форматирование текста.
        </p>
      </div>
    </div>
  );
};

export default NoteEditor;