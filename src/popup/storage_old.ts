import { AppStateV2, TreeDocument, TreeNode, AnyStored, DEBUG } from '../models';
const KEY = 'vb_state'; const THEME_KEY = 'vb_theme';
function g<T=any>(k?:any){return new Promise<T>(r=>chrome.storage.local.get(k??null,res=>r(res as any)))}
function s(obj:object){return new Promise<void>(r=>chrome.storage.local.set(obj,()=>r()))}
export async function loadState(): Promise<AppStateV2> {
  const raw = await g<{ [KEY]?: AnyStored }>(KEY); const stored = (raw as any)[KEY];
  if (DEBUG) console.log('[VB] loadState', stored);
  if (!stored) { const empty: AppStateV2 = { schemaVersion: 2, trees: [] }; await s({ [KEY]: empty }); return empty; }
  const migrated = migrate(stored); if (migrated !== stored) await s({ [KEY]: migrated }); return migrated;
}
export async function saveState(state: AppStateV2): Promise<void> { state.schemaVersion = 2; await s({ [KEY]: state }); }
const now = () => new Date().toISOString();
export async function createTree(title: string): Promise<TreeDocument> {
  const st = await loadState(); const tree: TreeDocument = { id: crypto.randomUUID(), title, nodes: [], createdAt: now(), updatedAt: now() };
  const next: AppStateV2 = { schemaVersion: 2, trees: [tree, ...st.trees] }; await saveState(next); return tree;
}
export async function renameTree(id: string, title: string): Promise<TreeDocument | null> {
  const st = await loadState(); let u: TreeDocument | null = null;
  const trees = st.trees.map(t => t.id === id ? (u = { ...t, title, updatedAt: now() })! : t);
  if (!u) return null; await saveState({ schemaVersion: 2, trees }); return u;
}
export async function deleteTree(id: string): Promise<void> {
  const st = await loadState(); await saveState({ schemaVersion: 2, trees: st.trees.filter(t => t.id !== id) });
}
export async function upsertNodes(treeId: string, nodes: TreeNode[]): Promise<TreeDocument | null> {
  const st = await loadState(); let u: TreeDocument | null = null;
  const trees = st.trees.map(t => t.id === treeId ? (u = { ...t, nodes, updatedAt: now() })! : t);
  if (!u) return null; await saveState({ schemaVersion: 2, trees }); return u;
}
export async function exportJSON(): Promise<string> { const st = await loadState(); return JSON.stringify(st, null, 2) }
export async function importJSON(json: string): Promise<AppStateV2> {
  let p: AnyStored; try { p = JSON.parse(json) } catch { throw new Error('Некорректный JSON') }
  const m = migrate(p); if (!m || m.schemaVersion !== 2 || !Array.isArray(m.trees)) throw new Error('Неверная схема данных'); await saveState(m); return m;
}
function migrate(any: AnyStored): AppStateV2 {
  if (any && typeof any === 'object' && any.schemaVersion === 2 && Array.isArray(any.trees)) return any as AppStateV2;
  if (any && Array.isArray((any as any).trees)) {
    const trees = (any as any).trees.map((t: any) => ({
      id: t.id ?? crypto.randomUUID(), title: t.title ?? 'Без названия',
      nodes: Array.isArray(t.nodes) ? t.nodes : [], createdAt: t.createdAt ?? new Date().toISOString(),
      updatedAt: t.updatedAt ?? new Date().toISOString(),
    }));
    return { schemaVersion: 2, trees };
  }
  return { schemaVersion: 2, trees: [] };
}
export type ThemeMode = 'system' | 'light' | 'dark';
export async function getTheme(){ const r = await g<{[THEME_KEY]?: ThemeMode}>(THEME_KEY); return (r as any)[THEME_KEY] || 'system' }
export async function setTheme(mode: ThemeMode){ await s({ [THEME_KEY]: mode }) }
