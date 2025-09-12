import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TreeDocument, TreeNode } from "../models";
import { DEBUG } from "../models";
import {
  loadState,
  createTree,
  renameTree,
  deleteTree,
  exportJSON,
  importJSON,
  upsertNodes,
  getTheme,
  setTheme,
  type ThemeMode,
  onDbStatus,
  getDbStatus,
  saveNow,
} from "./sqlStorage"; // <— sqlStorage
import { removeMultipleNodes, moveMultipleNodes } from "../treeOps"; // Для групповых операций
import { getUniversalItemsToAdd, universalItemToTreeNode, getSourceDescription, copySelectedNodes } from '../universalAdd';
import "./popup.css";
import Tree from "./Tree";
import { useTreeStates } from "./useTreeStates";
import { useSelection } from "./useSelection";
import SelectionIndicator from "./SelectionIndicator";
import LinkPreview from "./LinkPreview";

type SimpleTab = {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
};

export default function App() {
  const [trees, setTrees] = useState<TreeDocument[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [forceExpand, setForceExpand] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Link preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);

  // Хук для управления состояниями деревьев
  const { getState, updateState, removeState } = useTreeStates();

  // Хук для управления глобальным состоянием выделения
  const {
    selectionState,
    toggleSelectionMode,
    toggleMoveMode,
    toggleNodeSelection,
    isNodeSelected,
    clearSelection,
    getSelectionCount,
    getSelectedNodeIds,
    getAllSelectedNodes,
    removeNodesFromSelection,
  } = useSelection();

  // ---- вкладки для правого блока
  const [tabs, setTabs] = useState<SimpleTab[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const selTab = useMemo(() => tabs.find((t) => t.id === selId) || null, [tabs, selId]);

  // ---- анти-склейка деревьев
  const [allowHover, setAllowHover] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const now = () => Date.now();
  const lock = (ms = 800) => setLockUntil(Date.now() + ms);
  const canHover = allowHover && now() >= lockUntil;
  const hoverTimer = useRef<number | null>(null);

  // ---- статус БД
  const [dbStatus, setDbStatus] = useState(() => getDbStatus());
  useEffect(() => onDbStatus(setDbStatus), []);

  // гарантируем сохранение при закрытии панели
  useEffect(() => {
    const onUnload = () => { void saveNow(); };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  useEffect(() => {
    (async () => {
      const st = await loadState();
      setTrees(st.trees);
      setActiveId(st.trees[0]?.id ?? null);
      const t = await getTheme();
      setThemeState(t);
      applyThemeToDOM(t);
      if (DEBUG) console.log("[VB] init", st);
    })();
  }, []);

  // (исторический слушатель — не мешает)
  useEffect(() => {
    function onChanged(
      changes: { [k: string]: chrome.storage.StorageChange },
      area: string
    ) {
      if (area !== "local" || !changes["vb_state"]) return;
      (async () => {
        const st = await loadState();
        setTrees(st.trees);
      })();
    }
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const isPanel =
    location.pathname.endsWith("/panel.html") ||
    location.pathname.includes("/panel/");

  // --- выбор актуальной вкладки справа
  const lastNonExtActiveId = React.useRef<number | null>(null);

  function isNormalTab(t: chrome.tabs.Tab) {
    return !!(
      t.id &&
      t.url &&
      !t.url.startsWith("chrome-extension://") &&
      !t.url.startsWith("chrome://")
    );
  }

  function applyFrom(tlist: chrome.tabs.Tab[], preferId?: number | null) {
    const list: SimpleTab[] = tlist
      .filter(isNormalTab as any)
      .map((t) => ({
        id: t.id!,
        windowId: t.windowId!,
        title: t.title || (t.url || ""),
        url: t.url || "",
        favIconUrl: t.favIconUrl,
      }));
    setTabs(list);

    let candidate =
      preferId ??
      lastNonExtActiveId.current ??
      tlist.find((x) => x.active && isNormalTab(x))?.id ??
      null;

    if (candidate && list.some((x) => x.id === candidate)) {
      setSelId(candidate);
    } else {
      setSelId(list[0]?.id ?? null);
    }
  }

  function refreshTabsAndSelect(activePreferId?: number | null) {
    chrome.tabs.query({ currentWindow: true }, (ts) => {
      const hasNormals = ts.some(isNormalTab as any);
      if (hasNormals) {
        applyFrom(ts, activePreferId);
      } else {
        chrome.tabs.query({}, (all) => {
          const focusedNormal = all.find((t) => t.active && isNormalTab(t));
          lastNonExtActiveId.current =
            focusedNormal?.id ?? lastNonExtActiveId.current ?? null;
          applyFrom(all, activePreferId ?? focusedNormal?.id ?? null);
        });
      }
    });
  }

  useEffect(() => {
    if (!isPanel) return;

    chrome.storage.session.get(["vb_lastActiveTabId", "vb_lastActiveGroupId"], (res) => {
      const prefer = (res && (res as any).vb_lastActiveTabId) || null;
      if (prefer) chrome.storage.session.remove(["vb_lastActiveTabId", "vb_lastActiveGroupId"]);
      refreshTabsAndSelect(prefer);
    });

    // Типы могут отличаться — используем any, чтобы не зависеть от версии @types/chrome
    const onActivated = (info: any) => {
      chrome.tabs.get(info.tabId, (t) => {
        if (t && isNormalTab(t)) lastNonExtActiveId.current = t.id!;
      });
    };
    chrome.tabs.onActivated.addListener(onActivated);

    const onUpdated = (
      tabId: number,
      changeInfo: any,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === "complete" && tab.active && isNormalTab(tab)) {
        lastNonExtActiveId.current = tabId;
        refreshTabsAndSelect(tabId);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated as any);

    const onFocusChanged = () => refreshTabsAndSelect();
    chrome.windows.onFocusChanged.addListener(onFocusChanged);
    const onVis = () => { if (!document.hidden) refreshTabsAndSelect(); };
    document.addEventListener("visibilitychange", onVis);

    refreshTabsAndSelect();

    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated as any);
      chrome.windows.onFocusChanged.removeListener(onFocusChanged);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isPanel]);

  // Применение темы к DOM
  function applyThemeToDOM(theme: ThemeMode) {
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  // Обработчик изменения темы
  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as ThemeMode;
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    await setTheme(newTheme);
  };

  // Обработчик создания нового дерева
  const handleCreateTree = async () => {
    const name = prompt("Название дерева:");
    if (!name) return;
    const newTree = await createTree(name);
    setTrees((prev) => [...prev, newTree]);
    setActiveId(newTree.id);
  };

  // Обработчик переименования дерева
  const handleRenameTree = async () => {
    if (!activeId) return;
    const tree = trees.find((t) => t.id === activeId);
    if (!tree) return;

    const name = prompt("Новое название дерева:", tree.title);
    if (!name || name === tree.title) return;

    await renameTree(activeId, name);
    setTrees((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, title: name } : t))
    );
  };

  // Обработчик удаления дерева
  const handleDeleteTree = async () => {
    if (!activeId) return;
    const tree = trees.find((t) => t.id === activeId);
    if (!tree) return;

    if (!confirm(`Удалить дерево "${tree.title}"?`)) return;

    await deleteTree(activeId);
    removeState(activeId);
    setTrees((prev) => prev.filter((t) => t.id !== activeId));
    setActiveId(trees.find((t) => t.id !== activeId)?.id ?? null);
  };

  // Обработчик экспорта в JSON
  const handleExport = async () => {
    if (!activeId) return;
    const tree = trees.find((t) => t.id === activeId);
    if (!tree) return;

    const json = await exportJSON(activeId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tree.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Обработчик импорта из JSON
  const handleImport = () => {
    if (!fileRef.current) return;
    fileRef.current.click();
  };

  // Обработчик выбора файла для импорта
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newTree = await importJSON(text);
      setTrees((prev) => [...prev, newTree]);
      setActiveId(newTree.id);
    } catch (error) {
      console.error("Import error:", error);
      alert("Ошибка импорта: " + (error as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Обработчик открытия панели
  const handleOpenPanel = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("panel.html") });
  };

  // Активное дерево
  const active = trees.find((t) => t.id === activeId);

  // Обработчик добавления категории в корень
  const handleAddRootCategory = async () => {
    if (!activeId) return;
    const title = prompt("Название категории:");
    if (!title) return;

    const tree = trees.find((t) => t.id === activeId);
    if (!tree) return;

    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      title,
      children: [],
    };

    const newNodes = [...tree.nodes, newNode];
    await updateNodesFor(activeId, newNodes);
  };

  // Обработчик добавления текущей вкладки в корень
  const handleAddCurrentTabToRoot = async () => {
    if (!activeId || !selTab) return;
    const tree = trees.find((t) => t.id === activeId);
    if (!tree) return;

    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      title: selTab.title || selTab.url || "Без названия",
      url: selTab.url,
      children: [],
    };

    const newNodes = [...tree.nodes, newNode];
    await updateNodesFor(activeId, newNodes);
  };

  // Обновление узлов дерева
  const updateNodesFor = async (treeId: string, nodes: TreeNode[]) => {
    await upsertNodes(treeId, nodes);
    setTrees((prev) =>
      prev.map((t) => (t.id === treeId ? { ...t, nodes } : t))
    );
  };

  // Обработчик удаления выделенных элементов
  const handleDeleteSelected = async () => {
    if (!activeId) return;
    
    // Получаем все выделенные элементы
    const selectedNodes = getAllSelectedNodes();
    if (selectedNodes.length === 0) return;
    
    // Группируем по деревьям
    const nodesByTree: Record<string, string[]> = {};
    selectedNodes.forEach(node => {
      if (!nodesByTree[node.treeId]) {
        nodesByTree[node.treeId] = [];
      }
      nodesByTree[node.treeId].push(node.nodeId);
    });
    
    // Подтверждение удаления
    const totalCount = selectedNodes.length;
    const confirmMessage = `Удалить ${totalCount} выделенных элементов?`;
    if (!confirm(confirmMessage)) return;
    
    // Удаляем из каждого дерева
    for (const [treeId, nodeIds] of Object.entries(nodesByTree)) {
      const tree = trees.find(t => t.id === treeId);
      if (!tree) continue;
      
      const updatedNodes = removeMultipleNodes(tree.nodes, nodeIds);
      await updateNodesFor(treeId, updatedNodes);
      
      // Удаляем из выделения
      removeNodesFromSelection(treeId, nodeIds);
    }
  };

  // Обработчик для активации дерева при наведении
  const scheduleActivate = (id: string) => {
    if (!canHover) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      if (!canHover) return;
      setActiveId(id);
      setForceExpand(true);
    }, 250);
  };
  const cancelHover = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
  };

  // Handle link preview
  const handleLinkHover = (url: string | null, x: number, y: number) => {
    if (url) {
      setPreviewUrl(url);
      setPreviewPosition({ x, y });
    } else {
      setPreviewUrl(null);
      setPreviewPosition(null);
    }
  };

  return (
    <div className="app">
      <div
        className="topbar"
        onMouseEnter={() => setAllowHover(true)}
        onMouseLeave={() => { setAllowHover(false); cancelHover(); }}
      >
        {trees.map((t) => (
          <div
            key={t.id}
            className={"topitem" + (t.id === activeId ? " active" : "")}
            onMouseEnter={() => scheduleActivate(t.id)}
            onMouseLeave={cancelHover}
            onClick={() => { setActiveId(t.id); setForceExpand(true); }}
            title={t.title}
          >
            {t.title}
            {t.id === activeId && (
              <span className="top-actions">
                <button className="icon-btn" title="Переименовать" onClick={() => { lock(600); handleRenameTree(); }}>✏</button>
                <button className="icon-btn" title="Удалить дерево" onClick={() => { lock(600); handleDeleteTree(); }}>🗑</button>
              </span>
            )}
          </div>
        ))}
        <button
          className="topitem add"
          onClick={() => { lock(600); handleCreateTree(); }}
          title="Создать новое дерево"
        >
          +
        </button>
        <button
          className="topitem panel"
          onClick={() => { lock(600); handleOpenPanel(); }}
          title="Открыть в панели"
        >
          ⛶
        </button>
        <select
          className="theme-select"
          value={theme}
          onChange={handleThemeChange}
          title="Выбор темы"
        >
          <option value="system">Системная</option>
          <option value="light">Светлая</option>
          <option value="dark">Тёмная</option>
        </select>
      </div>

      <div className="main" onMouseEnter={() => setAllowHover(false)}>
        <div className="card">
          {active ? (
            <>
              <SelectionIndicator
                selectionCount={getSelectionCount()}
                selectionMode={selectionState.selectionMode}
                moveMode={selectionState.moveMode}
                onToggleSelectionMode={toggleSelectionMode}
                onToggleMoveMode={toggleMoveMode}
                onClearSelection={clearSelection}
                onDeleteSelected={handleDeleteSelected}
              />
              <Tree
                doc={active}
                onAddRootCategory={handleAddRootCategory}
                onAddCurrentTabToRoot={handleAddCurrentTabToRoot}
                forceExpand={forceExpand}
                selectedTab={selTab}
                onCommitNodes={updateNodesFor}
                uiState={getState(active.id)}
                onUpdateUIState={(updater) => updateState(active.id, updater)}
                selectionMode={selectionState.selectionMode}
                moveMode={selectionState.moveMode}
                isNodeSelected={(nodeId) => isNodeSelected(active.id, nodeId)}
                onToggleNodeSelection={(node) => toggleNodeSelection(active.id, node)}
                onDeleteSelected={handleDeleteSelected}
                removeNodesFromSelection={removeNodesFromSelection}
                allTrees={trees}
                onUpdateTreeNodes={updateNodesFor}
                globalIsNodeSelected={isNodeSelected}
                onLinkHover={handleLinkHover}
              />
            </>
          ) : (
            <div className="empty-state">
              <p>Нет деревьев. Создайте новое дерево.</p>
              <button onClick={handleCreateTree}>Создать дерево</button>
            </div>
          )}
        </div>

        {isPanel && (
          <div className="right-panel">
            <div className="tabs-list">
              <div className="tabs-header">Вкладки</div>
              {tabs.map((t) => (
                <div
                  key={t.id}
                  className={"tab-item" + (t.id === selId ? " selected" : "")}
                  onClick={() => setSelId(t.id)}
                  title={t.title}
                >
                  <img
                    className="tab-favicon"
                    src={
                      t.favIconUrl && /^https?:/i.test(t.favIconUrl)
                        ? t.favIconUrl
                        : `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(
                            t.url
                          )}&sz=16`
                    }
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                  <span className="tab-title">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <div className="footer-left">
          <span className="db-status">
            {dbStatus === "ready"
              ? "БД готова"
              : dbStatus === "loading"
              ? "Загрузка БД..."
              : "Ошибка БД"}
          </span>
        </div>
        <div className="footer-right">
          <button
            className="footer-btn"
            onClick={handleExport}
            title="Экспорт в JSON"
            disabled={!activeId}
          >
            Экспорт
          </button>
          <button
            className="footer-btn"
            onClick={handleImport}
            title="Импорт из JSON"
          >
            Импорт
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Link Preview Component */}
      <LinkPreview url={previewUrl} position={previewPosition} />
    </div>
  );
}