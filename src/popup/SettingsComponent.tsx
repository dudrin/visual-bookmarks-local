import React, { useEffect, useState } from "react";

const SettingsComponent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [saveFolder, setSaveFolder] = useState<string>("SavedPages");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.local.get(["saveFolder"], (result) => {
      if (result.saveFolder) {
        setSaveFolder(result.saveFolder);
      }
      setIsLoading(false);
    });
  }, []);

  const handleSaveFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveFolder(e.target.value);
  };

  const saveSettings = () => {
    chrome.storage.local.set({ saveFolder });
    alert("Настройки сохранены!");
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="settings-modal">
      <div className="settings-content">
        <h2>Настройки расширения</h2>
        
        <div className="setting-group">
          <label htmlFor="saveFolder">
            <strong>Папка для сохранения офлайн-копий:</strong>
          </label>
          <input
            type="text"
            id="saveFolder"
            value={saveFolder}
            onChange={handleSaveFolderChange}
            placeholder="Например: SavedPages"
          />
          <div className="setting-description">
            Название папки в директории Загрузки, куда будут сохраняться офлайн-копии страниц.
            Если папка не существует, Chrome создаст её автоматически.
          </div>
          <div className="setting-description" style={{ marginTop: '8px', padding: '8px', backgroundColor: 'color-mix(in oklab, var(--accent) 10%, transparent)', borderRadius: '4px' }}>
            <strong>Важно:</strong> Файлы сохраняются в подпапку с этим именем внутри папки Загрузки вашего браузера. 
            Из-за ограничений безопасности Chrome расширения не могут напрямую сохранять файлы в произвольные директории.
          </div>
        </div>
        
        <div className="setting-group">
          <label>
            <strong>Формат файлов:</strong>
          </label>
          <div>MHTML (.mhtml) - стандартный формат сохранения веб-страниц Chrome</div>
        </div>
        
        <div className="setting-group">
          <label>
            <strong>Расположение:</strong>
          </label>
          <div>Файлы сохраняются в папку Загрузки вашего браузера</div>
        </div>
        
        <div className="settings-actions">
          <button onClick={saveSettings}>Сохранить настройки</button>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: '10px' }}>Закрыть</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;