/* eslint-disable @typescript-eslint/no-explicit-any */
import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import type { TreeDocument, TreeNode } from "../models";

/**
 * SQLite в браузере через sql.js (WASM).
 * Бинарный дамп БД хранится в IndexedDB как ArrayBuffer под ключом DBKEY.
 */

const DBKEY = "vb_sqlite_db";
const IDB_NAME = "vb-sqlite";
const IDB_STORE = "kv";

// ---------- IndexedDB helpers ----------

function openIDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onerror = () => rej(req.error);
    req.onsuccess = () => res(req.result);
  });
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const g = store.get(key);
    g.onerror = () => rej(g.error);
    g.onsuccess = () => {
      const val = g.result as ArrayBuffer | Uint8Array | undefined;
      if (!val) return res(null);
      if (val instanceof Uint8Array) return res(val);
      return res(new Uint8Array(val));
    };
  });
}

async function idbSet(key: string, val: Uint8Array): Promise<void> {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const buf = val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength);
    const p = store.put(buf, key);
    p.onerror = () => rej(p.error);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ---------- sql.js + состояние БД ----------

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let saveTimer: number | null = null;

type DbStatus = {
  backend: "indexeddb";
  persisted: boolean;
  lastSaveAt: number | null;
};

const status: DbStatus = {
  backend: "indexeddb",
  persisted: false,
  lastSaveAt: null,
};

type Listener = (s: DbStatus) => void;
const listeners = new Set<Listener>();
function emit() { for (const l of listeners) l({ ...status }); }
export function onDbStatus(fn: Listener): () => void { listeners.add(fn); fn({ ...status }); return () => listeners.delete(fn); }
export function getDbStatus(): DbStatus { return { ...status }; }

async function maybePersistStorage() {
  try {
    if (navigator.storage && "persist" in navigator.storage) {
      const ok = await navigator.storage.persist();
      status.persisted = ok;
      emit();
    }
  } catch {}
}

async function ensureSQL(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (f: string) => chrome.runtime.getURL(`assets/${f}`),
  });
  return SQL!;
}

export async function ensureDB(): Promise<Database> {
  if (db) return db;
  await ensureSQL();
  await maybePersistStorage();
  const existing = await idbGet(DBKEY);
  db = existing ? new SQL!.Database(existing) : new SQL!.Database();
  bootstrap(db);
  return db!;
}

function bootstrap(d: Database) {
  d.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS trees (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      parent_id TEXT NULL,
      title TEXT NOT NULL,
      url TEXT NULL,
      order_index INTEGER NOT NULL,
      offline_id INTEGER NULL,
      offline_path TEXT NULL,
      mime TEXT NULL,
      comment TEXT NULL,
      FOREIGN KEY(doc_id) REFERENCES trees(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_nodes_doc ON nodes(doc_id, parent_id, order_index);
    CREATE TABLE IF NOT EXISTS settings ( key TEXT PRIMARY KEY, value TEXT NOT NULL );
  `);
}

// ---------- сохранение ----------

export async function saveNow(): Promise<void> {
  if (!db) return;
  const bin = db.export();
  await idbSet(DBKEY, bin);
  status.lastSaveAt = Date.now();
  emit();
}

function scheduleSave() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { void saveNow(); }, 250);
}

// ---------- преобразование дерева ----------

function buildTreeForDoc(rows: any[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  const children = new Map<string | null, TreeNode[]>();
  for (const r of rows) {
    const node: TreeNode = {
      id: r.id, title: r.title, url: r.url || undefined,
      offlineId: r.offline_id ?? undefined, offlinePath: r.offline_path ?? undefined,
      mime: r.mime ?? null, comment: r.comment || undefined, children: [],
    };
    byId.set(node.id, node);
    const pid = (r.parent_id as string | null) ?? null;
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid)!.push(node);
  }
  for (const [pid, list] of children) if (pid) { const p = byId.get(pid); if (p) p.children = list; }
  return children.get(null) || [];
}

function flattenNodes(docId: string, roots: TreeNode[]) {
  const out: Array<any> = [];
  const walk = (arr: TreeNode[], parent: string | null) => {
    arr.forEach((n, idx) => {
      out.push({
        id: n.id, parent_id: parent, title: n.title, url: n.url ?? null,
        order_index: idx, offline_id: n.offlineId ?? null, offline_path: n.offlinePath ?? null,
        mime: n.mime ?? null, comment: n.comment ?? null, doc_id: docId,
      });
      if (n.children?.length) walk(n.children, n.id);
    });
  };
  walk(roots, null);
  return out;
}

// ---------- Публичный API ----------

export type ThemeMode = "system" | "light" | "dark";

export async function getTheme(): Promise<ThemeMode> {
  const d = await ensureDB();
  const r = d.exec(`SELECT value FROM settings WHERE key='theme' LIMIT 1`);
  const val = r[0]?.values?.[0]?.[0] as string | undefined;
  return (val as ThemeMode) || "system";
}

export async function setTheme(v: ThemeMode): Promise<void> {
  const d = await ensureDB();
  d.run(
    `INSERT INTO settings(key,value) VALUES('theme',?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [v]
  );
  scheduleSave();
}

export async function loadState(): Promise<{ trees: TreeDocument[] }> {
  const d = await ensureDB();
  const trees: TreeDocument[] = [];
  const t = d.exec(`SELECT id, title, created_at FROM trees ORDER BY created_at DESC`);
  const rows = t[0]?.values || [];
  for (const [id, title, created_at] of rows) {
    const n = d.exec(
      `SELECT id, parent_id, title, url, order_index, offline_id, offline_path, mime, comment
       FROM nodes WHERE doc_id=?
       ORDER BY parent_id IS NOT NULL, parent_id, order_index`,
      [id as string]
    );
    const nodesRows =
      n[0]?.values?.map((v: any[]) => ({
        id: v[0], parent_id: v[1], title: v[2], url: v[3],
        order_index: v[4], offline_id: v[5], offline_path: v[6], mime: v[7], comment: v[8]
      })) || [];
    trees.push({ id: id as string, title: title as string, createdAt: created_at as string, nodes: buildTreeForDoc(nodesRows) });
  }
  return { trees };
}

export async function createTree(title: string): Promise<TreeDocument> {
  const d = await ensureDB();
  const id = crypto.randomUUID();
  const created = new Date().toISOString();
  d.run(`INSERT INTO trees(id,title,created_at) VALUES(?,?,?)`, [id, title, created]);
  scheduleSave();
  await saveNow();
  return { id, title, nodes: [], createdAt: created };
}

export async function renameTree(id: string, title: string): Promise<TreeDocument | null> {
  const d = await ensureDB();
  d.run(`UPDATE trees SET title=? WHERE id=?`, [title, id]);
  scheduleSave(); await saveNow();
  const st = await loadState();
  return st.trees.find(t => t.id === id) || null;
}

export async function deleteTree(id: string): Promise<void> {
  const d = await ensureDB();
  d.run(`DELETE FROM nodes WHERE doc_id=?`, [id]);
  d.run(`DELETE FROM trees WHERE id=?`, [id]);
  scheduleSave(); await saveNow();
}

export async function upsertNodes(docId: string, nodes: TreeNode[]): Promise<TreeDocument | null> {
  const d = await ensureDB();
  d.run(`DELETE FROM nodes WHERE doc_id=?`, [docId]);
  const flat = flattenNodes(docId, nodes);

  console.debug('[VB] upsertNodes', { docId, total: flat.length,
    withParent: flat.filter(r => r.parent_id !== null).length });
    
  const stmt = d.prepare(
    `INSERT INTO nodes(id,doc_id,parent_id,title,url,order_index,offline_id,offline_path,mime,comment)
     VALUES(?,?,?,?,?,?,?,?,?,?)`
  );
  try {
    flat.forEach(r => stmt.run([r.id, docId, r.parent_id, r.title, r.url, r.order_index, r.offline_id, r.offline_path, r.mime, r.comment]));
  } finally { stmt.free(); }
  scheduleSave(); await saveNow();
  const st = await loadState();
  return st.trees.find(t => t.id === docId) || null;
}

export async function exportJSON(): Promise<string> {
  const d = await ensureDB();
  const bin = d.export();
  const b64 = btoa(String.fromCharCode(...bin));
  return JSON.stringify({ type: "vb-sqlite-backup", version: 1, db_base64: b64 });
}

export async function importJSON(text: string): Promise<{ trees: TreeDocument[] }> {
  const data = JSON.parse(text);
  if (data?.type !== "vb-sqlite-backup" || !data?.db_base64) throw new Error("Неверный формат резервной копии");
  const bin = Uint8Array.from(atob(data.db_base64), (c) => c.charCodeAt(0));
  await idbSet(DBKEY, bin);
  db?.close(); db = null;
  status.lastSaveAt = Date.now(); emit();
  return await loadState();
}
