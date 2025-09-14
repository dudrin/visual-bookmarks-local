import React, { useEffect, useState } from "react";
import SettingsComponent from "./SettingsComponent"; // Adjust the path as needed

const OptionsPage: React.FC = () => {
  const [saveFolder, setSaveFolder] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["saveFolder"], (result) => {
      if (result.saveFolder) setSaveFolder(result.saveFolder);
    });
  }, []);

  const chooseSaveFolder = async () => {
    try {
      // Check if the File System Access API is supported
      // @ts-ignore
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read',
          startIn: 'downloads'
        });
        
        // Get the directory name (note: we only get the name, not the full path due to security restrictions)
        const folderName = dirHandle.name;
        
        // Save to chrome storage
        chrome.storage.local.set({ saveFolder: folderName });
        setSaveFolder(folderName);
        
        alert(`Папка "${folderName}" успешно выбрана для сохранения офлайн-копий.\n\nВажно: Из-за ограничений безопасности Chrome, файлы будут сохраняться в подпапку с этим именем внутри папки Загрузки.`);
      } else {
        // Fallback to prompt for older browsers
        const folder = prompt(
          "Введите название папки в папке Загрузки для сохранения офлайн-копий (например, SavedPages):",
          saveFolder || "SavedPages"
        );
        if (folder !== null) { // Allow empty string but not cancel
          chrome.storage.local.set({ saveFolder: folder || "SavedPages" });
          setSaveFolder(folder || "SavedPages");
          alert(`Папка "${folder || "SavedPages"}" установлена для сохранения офлайн-копий.\n\nВажно: Файлы будут сохраняться в подпапку с этим именем внутри папки Загрузки.`);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled the folder selection, do nothing
        return;
      }
      
      console.error("Error selecting folder:", error);
      
      // Fallback to prompt in case of error
      const folder = prompt(
        "Введите название папки в папке Загрузки для сохранения офлайн-копий (например, SavedPages):",
        saveFolder || "SavedPages"
      );
      if (folder !== null) { // Allow empty string but not cancel
        chrome.storage.local.set({ saveFolder: folder || "SavedPages" });
        setSaveFolder(folder || "SavedPages");
        alert(`Папка "${folder || "SavedPages"}" установлена для сохранения офлайн-копий.\n\nВажно: Файлы будут сохраняться в подпапку с этим именем внутри папки Загрузки.`);
      }
    }
  };

  return (
    <div className="options-page">
      <h1>Настройки расширения</h1>
      <div className="option">
        <button onClick={chooseSaveFolder}>Выбрать папку для сохранения офлайн-копий</button>
        <span style={{ marginLeft: 8, color: "#888" }}>
          {saveFolder ? `Текущая папка: ${saveFolder}` : "Папка не выбрана (по умолчанию: SavedPages)"}
        </span>
        <div className="path-info">
          <strong>Примечание:</strong> Файлы сохраняются в подпапку с этим именем внутри папки Загрузки вашего браузера. 
          Из-за ограничений безопасности Chrome расширения не могут напрямую сохранять файлы в произвольные директории.
        </div>
      </div>
      <div className="option">
        <button onClick={() => setShowSettings(true)}>⚙️ Настройки</button>
        {showSettings && <SettingsComponent onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
};

export default OptionsPage;