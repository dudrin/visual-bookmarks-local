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
import "./popup.css";
import Tree from "./Tree";
import { useTreeStates } from "./useTreeStates";

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

  // Хук для управления состояниями деревьев
  const { getState, updateState, removeState } = useTreeStates();

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

    chrome.storage.session.get(["vb_lastActiveTabId"], (res) => {
      const prefer = (res && (res as any).vb_lastActiveTabId) || null;
      if (prefer) chrome.storage.session.remove("vb_lastActiveTabId");
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

    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated as any);
      chrome.windows.onFocusChanged.removeListener(onFocusChanged);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isPanel]);

  function applyThemeToDOM(mode: ThemeMode) {
    const el = document.body;
    el.removeAttribute("data-theme");
    if (mode === "light" || mode === "dark")
      el.setAttribute("data-theme", mode);
  }
  async function changeTheme(next: ThemeMode) {
    setThemeState(next);
    await setTheme(next);
    applyThemeToDOM(next);
  }

  const active = useMemo(
    () => trees.find((t) => t.id === activeId) || null,
    [trees, activeId]
  );

  /** Коммит узлов для конкретного дерева: пишем в БД и синхронизируем локальное состояние */
  const updateNodesFor = async (docId: string, nodes: TreeNode[]) => {
    const saved = await upsertNodes(docId, nodes);
    if (!saved) return;
    setTrees((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
  };

  // Пришёл список выделенных вкладок из background — добавляем пачкой в активное дерево
  useEffect(() => {
    function onMsg(msg: any) {
      if (msg?.type === 'VB_ADD_SELECTED_TABS' && active) {
        const nodes: TreeNode[] = (msg.tabs || []).map((t: { title: string; url: string }) => ({
          id: crypto.randomUUID(),
          title: t.title || t.url,
          url: t.url,
          children: []
        }));
        if (nodes.length) {
          updateNodesFor(active.id, [...nodes, ...active.nodes]);
        }
      }
    }
    chrome.runtime.onMessage.addListener(onMsg);
    return () => chrome.runtime.onMessage.removeListener(onMsg);
  }, [active]);

  const onCreate = async () => {
    const name = prompt("Название дерева")?.trim();
    if (!name) return;
    const doc = await createTree(name);
    setTrees([doc, ...trees]);
    setActiveId(doc.id);
  };

  const onRename = async () => {
    if (!activeId) return;
    const name = (title || prompt("Новое название")?.trim() || "").trim();
    if (!name) return;
    const updated = await renameTree(activeId, name);
    if (!updated) return;
    setTrees(trees.map((t) => (t.id === activeId ? updated! : t)));
    setTitle("");
  };

  const onDelete = async () => {
    if (!activeId) return;
    if (!confirm("Удалить активное дерево? Это действие нельзя отменить.")) return;
    await deleteTree(activeId);
    removeState(activeId); // Очищаем состояние UI
    const next = trees.filter((t) => t.id !== activeId);
    setTrees(next);
    setActiveId(next[0]?.id ?? null);
  };

  const onExport = async () => {
    const data = await exportJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const filename = `visual-bookmarks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    await chrome.downloads.download({ url, filename, saveAs: true });
    URL.revokeObjectURL(url);
  };

  const onImport = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const state = await importJSON(text);
      setTrees(state.trees);
      setActiveId(state.trees[0]?.id ?? null);
      alert("Импорт успешно завершён");
    } catch (e: any) {
      alert("Ошибка импорта: " + e.message);
    } finally {
      ev.target.value = "";
    }
  };

  function faviconFor(tab: SimpleTab) {
    if (tab.favIconUrl && /^https?:/i.test(tab.favIconUrl)) return tab.favIconUrl;
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return "";
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(tab.url)}&sz=16`;
  }

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
    hoverTimer.current = null;
    setForceExpand(false);
  };

  const fmtTime = (ms: number | null) =>
    ms ? new Date(ms).toLocaleTimeString() : "—";

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
                <button className="icon-btn" title="Переименовать" onClick={() => { lock(600); onRename(); }}>✏</button>
                <button className="icon-btn" title="Удалить дерево" onClick={() => { lock(600); onDelete(); }}>🗑</button>
              </span>
            )}
          </div>
        ))}
        <button className="add" onClick={() => { lock(400); onCreate(); }} title="Новое дерево">＋</button>
        <button
          onClick={() => {
            const url = chrome.runtime.getURL("panel.html");
            chrome.tabs.create({ url });
          }}
          title="Открыть большое окно"
        >
          ⛶
        </button>
        <select
          value={theme}
          onChange={(e) => changeTheme(e.target.value as ThemeMode)}
          title="Тема"
          style={{ marginLeft: "8px" }}
        >
          <option value="system">Системная</option>
          <option value="light">Светлая</option>
          <option value="dark">Тёмная</option>
        </select>
      </div>

      <div className="main" onMouseEnter={() => setAllowHover(false)}>
        <div className="card">
          {active ? (
            <Tree
              doc={active}
              selectedTab={selTab}
              // Tree просит App зафиксировать узлы (синхронизация состояния trees)
              onCommitNodes={async (docId, nodes) => {
                await updateNodesFor(docId, nodes);
              }}
              onAddRootCategory={async () => {
                if (!active) return;
                lock(600);
                const name = prompt("Название категории")?.trim();
                if (!name) return;
                const node: TreeNode = { id: crypto.randomUUID(), title: name, children: [] };
                await updateNodesFor(active.id, [node, ...active.nodes]);
              }}
              onAddCurrentTabToRoot={async () => {
                if (!active || !selTab) { alert("Выберите вкладку выше"); return; }
                lock(600);
                const node: TreeNode = {
                  id: crypto.randomUUID(),
                  title: selTab.title || selTab.url,
                  url: selTab.url,
                  children: [],
                };
                await updateNodesFor(active.id, [node, ...active.nodes]);
              }}
              forceExpand={forceExpand}
              uiState={getState(active.id)}
              onUpdateUIState={(updater) => updateState(active.id, updater)}
            />
          ) : (
            <div className="muted">Создайте первое дерево</div>
          )}
        </div>

        <div className="card">
          <strong>Какая вкладка будет добавлена?</strong>
          <div className="row" style={{ marginTop: 8 }}>
            <select value={selId ?? ""} onChange={(e) => setSelId(Number(e.target.value))}>
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>{t.title.slice(0, 80)}</option>
              ))}
            </select>
          </div>

          {selTab && (
            <>
              <div className="row" style={{ marginTop: 8 }}>
                {(() => {
                  const src = faviconFor(selTab);
                  return src ? (
                    <img className="favicon" src={src}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                      alt="" />
                  ) : <span style={{ width: 16, height: 16 }} />;
                })()}
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={selTab.url}>
                  {selTab.title}
                </div>
              </div>

              <div className="row" style={{ marginTop: 8, gap: 8 }}>
                <button onClick={() => chrome.tabs.update(selTab.id, { active: true })}>Перейти к вкладке</button>
                <button onClick={async () => {
                  if (!active || !selTab) return;
                  lock(600);
                  const node: TreeNode = { id: crypto.randomUUID(), title: selTab.title || selTab.url, url: selTab.url, children: [] };
                  await updateNodesFor(active.id, [node, ...active.nodes]);
                }}>+ В корень</button>
                <button onClick={async () => {
                  if (!selTab || !active) return;
                  lock(1000);
                  const res = await chrome.runtime.sendMessage({ type: "SAVE_OFFLINE_FOR_URL", url: selTab.url, title: selTab.title });
                  if (!res?.ok) { alert("Ошибка сохранения: " + (res?.error || "")); return; }
                  const node: TreeNode = {
                    id: crypto.randomUUID(),
                    title: selTab.title || selTab.url,
                    url: selTab.url,
                    offlineId: res.id,
                    offlinePath: res.filename,
                    children: [],
                  };
                  await updateNodesFor(active.id, [node, ...active.nodes]);
                }}>+ В корень (офлайн)</button>
              </div>
            </>
          )}

          {!selTab && <div className="muted" style={{ marginTop: 8 }}>Не найдено вкладок текущего окна.</div>}

          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={() => { lock(400); onExport(); }}>Экспорт JSON</button>
            <button onClick={() => fileRef.current?.click()}>Импорт JSON</button>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
                   onChange={(e) => { lock(600); onImport(e); }} />
          </div>
        </div>
      </div>

      {/* ---- НИЖНЯЯ ПАНЕЛЬ СТАТУСОМ БД ---- */}
      <div className="footer" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',borderTop:'1px solid var(--border)'}}>
        <div className="footer-status">
          SQLite: {dbStatus.backend} / {dbStatus.persisted ? "persisted" : "volatile"}
          {" · "}last save: {fmtTime(dbStatus.lastSaveAt)}
        </div>
        <button onClick={() => saveNow()}>Сохранить сейчас</button>
      </div>
    </div>
  );
}
