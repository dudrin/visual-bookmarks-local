// background.ts — буфер выделенных вкладок + аккуратное открытие панели + офлайн MHTML

/* ---------- Promisify ---------- */
function pTabsQuery(q: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((res) => chrome.tabs.query(q, res));
}
function pTabsCreate(c: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
  return new Promise((res) => chrome.tabs.create(c, res));
}
function pTabsUpdate(tabId: number, props: chrome.tabs.UpdateProperties) {
  return new Promise<chrome.tabs.Tab>((res, rej) => {
    chrome.tabs.update(tabId, props, (tab) => {
      if (chrome.runtime.lastError || !tab) return rej(chrome.runtime.lastError ?? new Error("No tab"));
      res(tab);
    });
  });
}
function pTabsRemove(tabId: number): Promise<void> {
  return new Promise((res) => chrome.tabs.remove(tabId, res));
}
function pWindowsUpdate(windowId: number, props: chrome.windows.UpdateInfo): Promise<chrome.windows.Window | undefined> {
  return new Promise((res) => chrome.windows.update(windowId, props, res));
}
function pDownloadsDownload(opts: chrome.downloads.DownloadOptions): Promise<number> {
  return new Promise((res) => chrome.downloads.download(opts, (id) => res(id as number)));
}
function pDownloadsSearch(q: chrome.downloads.DownloadQuery): Promise<chrome.downloads.DownloadItem[]> {
  return new Promise((res) => chrome.downloads.search(q, res));
}
function pDownloadsOpen(id: number): Promise<void> {
  return new Promise((res) => chrome.downloads.open(id));
}
function pDownloadsRemoveFile(id: number): Promise<void> {
  return new Promise((res) => chrome.downloads.removeFile(id, res));
}
function pDownloadsErase(q: { id?: number }): Promise<number[]> {
  return new Promise((res) => chrome.downloads.erase(q, res));
}
function pPageCapture(details: chrome.pageCapture.SaveDetails): Promise<Blob> {
  return new Promise((res, rej) => {
    chrome.pageCapture.saveAsMHTML(details, (mhtmlData?: Blob) => {
      if (mhtmlData) res(mhtmlData);
      else rej(new Error("Failed to capture MHTML"));
    });
  });
}

/* ---------- Utils ---------- */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return `data:application/octet-stream;base64,${btoa(bin)}`;
}
function waitTabComplete(tabId: number): Promise<void> {
  // тип у info — any из-за расхождений в @types/chrome между браузерами
  return new Promise((res, rej) => {
    const to = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      rej(new Error("Timeout loading tab"));
    }, 30000);
    const listener = (id: number, info: any) => {
      if (id === tabId && info?.status === "complete") {
        clearTimeout(to);
        chrome.tabs.onUpdated.removeListener(listener);
        res();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
}
function isNormalTab(t?: chrome.tabs.Tab | null) {
  return !!(t && t.id && t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("chrome-extension://"));
}

/* ---------- “откуда открыли” ---------- */
async function rememberCurrentAsLastActive() {
  const [active] = await pTabsQuery({ active: true, currentWindow: true });
  if (isNormalTab(active)) {
    const sessionData: any = { vb_lastActiveTabId: active!.id };
    // Сохраняем также группу вкладки для правильного размещения новых вкладок
    if (chrome.tabGroups && typeof active!.groupId === 'number' && active!.groupId >= 0) {
      sessionData.vb_lastActiveGroupId = active!.groupId;
    }
    await chrome.storage.session.set(sessionData);
  }
}

/* ---------- Открыть/фокусировать панель (без дублей) ---------- */
async function openPanelTab() {
  const url = chrome.runtime.getURL("panel.html");
  const tabs = await pTabsQuery({});
  const existing = tabs.find((t) => t.url === url);
  if (existing?.id) {
    await pTabsUpdate(existing.id, { active: true });
    if (typeof existing.windowId === "number") {
      await pWindowsUpdate(existing.windowId, { focused: true });
    }
    return existing;
  }
  return await pTabsCreate({ url, active: true });
}

/* ---------- Буфер выделенных вкладок ---------- */
type StagedTab = { title: string; url: string };
let stagedTabs: StagedTab[] = [];
let stagedExpiresAt = 0;

function clearStage() {
  stagedTabs = [];
  stagedExpiresAt = 0;
  chrome.storage.session.remove(["vb_stagedTabs", "vb_stagedExpiresAt"]);
}
async function stageFromHighlighted(): Promise<StagedTab[]> {
  // собираем только нормальные вкладки
  const all = await pTabsQuery({ currentWindow: true, highlighted: true });
  const tabs = all
    .filter((t) => !!(t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("chrome-extension://")))
    .map((t) => ({ title: (t.title || t.url || "").trim(), url: t.url! }));

  stagedTabs = tabs;
  stagedExpiresAt = Date.now() + 5 * 60_000; // 5 минут
  await chrome.storage.session.set({ vb_stagedTabs: tabs, vb_stagedExpiresAt: stagedExpiresAt });
  return tabs;
}
async function popStage(): Promise<StagedTab[]> {
  // сначала пробуем из памяти
  if (stagedTabs.length && Date.now() < stagedExpiresAt) {
    const out = stagedTabs.slice();
    clearStage();
    return out;
  }
  // иначе — из session storage (на случай перезапуска service worker’а)
  const ss = await chrome.storage.session.get(["vb_stagedTabs", "vb_stagedExpiresAt"]);
  const exp = Number(ss.vb_stagedExpiresAt || 0);
  const list: StagedTab[] = Array.isArray(ss.vb_stagedTabs) ? ss.vb_stagedTabs : [];
  if (list.length && Date.now() < exp) {
    await chrome.storage.session.remove(["vb_stagedTabs", "vb_stagedExpiresAt"]);
    return list;
  }
  return [];
}

/* ---------- Контекстное меню ---------- */
function ensureSelectedTabsMenu() {
  try {
    chrome.contextMenus.create({
      id: "vb-add-selected-tabs",
      title: "Добавить выделенные вкладки в Visual Bookmarks",
      contexts: ["all"], // максимально совместимо (в т.ч. Яндекс.Браузер)
    });
  } catch {
    /* ignore dups */
  }
}

function ensureCurrentTabMenu() {
  try {
    chrome.contextMenus.create({
      id: "vb-add-current-tab",
      title: "Добавить текущую вкладку в Visual Bookmarks",
      contexts: ["page"],
    });
  } catch {
    /* ignore dups */
  }
}

function setupContextMenus() {
  // Очищаем все существующие элементы меню перед созданием новых
  chrome.contextMenus.removeAll(() => {
    ensureSelectedTabsMenu();
    ensureCurrentTabMenu();
  });
}
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === "vb-add-selected-tabs") {
      await stageFromHighlighted();     // положили в буфер
      const p = await openPanelTab();   // показали панель
      if (p?.id) await waitTabComplete(p.id).catch(() => {}); // best-effort
      return;
    }
    if (info.menuItemId === "vb-add-current-tab") {
      // совместимость со старым пунктом — сложим одну текущую вкладку в буфер
      const t = tab && isNormalTab(tab) ? tab : (await pTabsQuery({ active: true, currentWindow: true }))[0];
      if (isNormalTab(t)) {
        stagedTabs = [{ title: (t!.title || t!.url || "").trim(), url: t!.url! }];
        stagedExpiresAt = Date.now() + 5 * 60_000;
        await chrome.storage.session.set({ vb_stagedTabs: stagedTabs, vb_stagedExpiresAt: stagedExpiresAt });
        const p = await openPanelTab();
        if (p?.id) await waitTabComplete(p.id).catch(() => {});
      }
      return;
    }
  } catch (e) {
    console.error(e);
  }
});

/* ---------- Жизненный цикл ---------- */
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setPopup({ popup: "" });
  setupContextMenus();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.action.setPopup({ popup: "" });
  setupContextMenus();
});

if (chrome.action.onClicked) {
  chrome.action.onClicked.addListener(async () => {
    await rememberCurrentAsLastActive();
    await openPanelTab().catch(() => {});
  });
}

/* ---------- Сообщения от UI ---------- */
chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  (async () => {
    // Панель просит отдать и очистить буфер выделенных вкладок
    if (msg?.type === "VB_POP_STAGED_TABS") {
      const out = await popStage();
      sendResponse({ ok: true, tabs: out });
      return;
    }

    // Установить staged tabs (для проверки без потребления)
    if (msg?.type === "VB_STAGE_TABS") {
      const tabs: StagedTab[] = Array.isArray(msg.tabs) ? msg.tabs : [];
      stagedTabs = tabs;
      stagedExpiresAt = Date.now() + 5 * 60_000; // 5 минут
      await chrome.storage.session.set({ vb_stagedTabs: tabs, vb_stagedExpiresAt: stagedExpiresAt });
      sendResponse({ ok: true });
      return;
    }


    // ====== офлайн MHTML ======
    if (msg?.type === "SAVE_OFFLINE_FOR_URL") {
      const url: string | undefined = msg.url;
      const title: string | undefined = msg.title;
      if (!url) throw new Error("URL is empty");

      const [active] = await pTabsQuery({ active: true, currentWindow: true });
      const norm = (u: string) => u.split("#")[0];

      if (active?.id && active.url && norm(active.url) === norm(url)) {
        const r = await captureTabToMHTML(active.id, title || "page");
        sendResponse({ ok: true, ...r });
        return;
      }
      const tmp = await pTabsCreate({ url, active: false });
      try {
        if (typeof tmp.id === "number") {
          await waitTabComplete(tmp.id);
          const r = await captureTabToMHTML(tmp.id, title || "page");
          sendResponse({ ok: true, ...r });
        } else {
          sendResponse({ ok: false, error: "Failed to create tab" });
        }
      } finally {
        if (typeof tmp.id === "number") await pTabsRemove(tmp.id);
      }
      return;
    }

    if (msg?.type === "OPEN_OFFLINE") {
      const downloadId: number | undefined = msg.downloadId;
      const filename: string | undefined = msg.filename;
      if (typeof downloadId === "number") {
        await pDownloadsOpen(downloadId);
        sendResponse({ ok: true });
        return;
      }
      if (filename) {
        const items = await pDownloadsSearch({ filename });
        if (items[0]?.id) {
          await pDownloadsOpen(items[0].id);
          sendResponse({ ok: true, resolvedId: items[0].id });
          return;
        }
      }
      sendResponse({ ok: false, error: "Файл не найден" });
      return;
    }

    if (msg?.type === "DELETE_OFFLINE") {
      const downloadId: number | undefined = msg.downloadId;
      const filename: string | undefined = msg.filename;
      let id = downloadId;
      if (!id && filename) {
        const items = await pDownloadsSearch({ filename });
        id = items[0]?.id;
      }
      if (typeof id === "number") {
        try {
          await pDownloadsRemoveFile(id);
          await pDownloadsErase({ id });
          sendResponse({ ok: true });
        } catch (e: any) {
          sendResponse({ ok: false, error: String(e?.message || e) });
        }
      } else {
        sendResponse({ ok: false, error: "Не найден downloadId" });
      }
      return;
    }
  })().catch((e: any) => {
    console.error(e);
    sendResponse({ ok: false, error: String(e?.message || e) });
  });
  return true;
});

/* ---------- Захват в MHTML ---------- */
async function captureTabToMHTML(tabId: number, suggested: string) {
  const blob = await pPageCapture({ tabId });
  const url = await blobToDataUrl(blob);
  const filename = sanitize(`${suggested}.mhtml`);
  const id = await pDownloadsDownload({ url, filename, saveAs: true });
  const items = await pDownloadsSearch({ id });
  const item = items[0];
  return { id, filename: item?.filename || filename };
}

// Периодическая проверка сохраненных файлов
async function checkSavedFilesPeriodically() {
  try {
    // Получаем кэш сохраненных страниц
    const result = await chrome.storage.local.get(['savedPages']);
    const savedPages = result.savedPages || {};
    
    // Проверяем каждый сохраненный файл
    for (const [url, exists] of Object.entries(savedPages)) {
      if (exists === true) {
        // Извлекаем домен из URL для формирования имени файла
        let fileName = 'page';
        try {
          const urlObj = new URL(url);
          fileName = urlObj.hostname.replace('www.', '');
        } catch (e) {
          // Используем стандартное имя, если не удалось извлечь домен
        }
        
        // Формируем имя файла
        fileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        if (fileName.length > 100) {
          fileName = fileName.substring(0, 100);
        }
        if (!fileName.toLowerCase().endsWith('.mhtml')) {
          fileName = `${fileName}.mhtml`;
        }
        
        // Получаем папку сохранения
        const folderResult = await chrome.storage.local.get(['saveFolder']);
        const folder = folderResult.saveFolder || "SavedPages";
        
        // Экранируем специальные символы
        const escapeRegExp = (string: string) => {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };
        
        // Ищем файл в загрузках
        const results = await pDownloadsSearch({
          filenameRegex: escapeRegExp(folder) + '[/\\\\]' + escapeRegExp(fileName)
        });
        
        // Фильтруем результаты
        const validDownloads = results.filter(download => 
          download.state === 'complete' && 
          (download.exists === true || 
           (download.exists !== false && download.byExtensionId === chrome.runtime.id))
        );
        
        // Если файл не найден, обновляем кэш
        if (validDownloads.length === 0) {
          // Обновляем кэш в storage
          savedPages[url] = false;
          await chrome.storage.local.set({ savedPages });
        }
      }
    }
  } catch (error) {
    console.error('Error checking saved files periodically:', error);
  }
}

// Запускаем периодическую проверку каждые 5 минут
setInterval(checkSavedFilesPeriodically, 5 * 60 * 1000);

// Запускаем проверку при запуске
chrome.runtime.onStartup.addListener(() => {
  setTimeout(checkSavedFilesPeriodically, 10000); // Начинаем проверку через 10 секунд после запуска
});
