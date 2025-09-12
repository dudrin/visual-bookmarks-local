import React, { useState, useEffect, useRef } from 'react';
import Icon from '../icons';
import NoteEditor from './NoteEditor';

interface NoteModalProps {
  nodeId: string;
  title: string;
  note?: string;
  onSave: (nodeId: string, note: string) => void;
  onClose: () => void;
  className?: string;
}

/**
 * Компонент модального окна для просмотра и редактирования заметок
 */
const NoteModal: React.FC<NoteModalProps> = ({
  nodeId,
  title,
  note = '',
  onSave,
  onClose,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Обработчик клика вне модального окна для закрытия
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Обработчик нажатия клавиши Escape для закрытия
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Обработчик сохранения заметки
  const handleSave = (nodeId: string, updatedNote: string) => {
    onSave(nodeId, updatedNote);
    setIsEditing(false);
  };
  
  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="note-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div 
        ref={modalRef}
        className={`note-modal ${className}`} 
        style={{
          backgroundColor: '#fff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          width: '80%',
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {isEditing ? (
          <NoteEditor
            nodeId={nodeId}
            initialNote={note}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            {/* Заголовок */}
            <div className="note-modal-header" style={{
              padding: '15px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '70%'
              }}>
                <Icon type="note" size={18} style={{ marginRight: '8px' }} />
                {title}
              </h2>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Icon type="edit" size={14} color="#fff" />
                  Редактировать
                </button>
                
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon type="close" size={18} />
                </button>
              </div>
            </div>
            
            {/* Содержимое заметки */}
            <div className="note-modal-content" style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto'
            }}>
              {note ? (
                <div 
                  className="note-content"
                  dangerouslySetInnerHTML={{ __html: note }}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                />
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  color: '#999'
                }}>
                  <Icon type="note" size={48} color="#ddd" />
                  <p style={{ marginTop: '15px' }}>
                    Заметка пуста. Нажмите "Редактировать", чтобы добавить содержимое.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteModal;