import { TreeNode } from './models'
export function updateNode(list: TreeNode[], id: string, up: (n: TreeNode) => TreeNode) {
  const rec = (arr: TreeNode[]): TreeNode[] => arr.map(n => {
    if (n.id === id) return up({ ...n, children: n.children ? [...n.children] : [] })
    return n.children ? { ...n, children: rec(n.children) } : n
  })
  return rec(list)
}
export function removeNode(list: TreeNode[], id: string) {
  const rec = (arr: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = []
    for (const n of arr) {
      if (n.id === id) continue
      out.push(n.children ? { ...n, children: rec(n.children) } : n)
    }
    return out
  }
  return rec(list)
}
export function insertChild(list: TreeNode[], parentId: string|null, child: TreeNode) {
  if (parentId === null) return [child, ...list]
  return updateNode(list, parentId, p => ({ ...p, children: p.children ? [child, ...p.children] : [child] }))
}
export function collectDescendantIds(n: TreeNode) {
  const s = new Set<string>()
  ;(function r(x: TreeNode){ s.add(x.id); if (x.children) x.children.forEach(r) })(n)
  return s
}
export function extractNode(list: TreeNode[], id: string) {
  let found: TreeNode|null = null
  const rec = (arr: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = []
    for (const n of arr) {
      if (n.id === id) { found = n; continue }
      out.push(n.children ? { ...n, children: rec(n.children) } : n)
    }
    return out
  }
  return { node: found, rest: rec(list) }
}
export function moveNode(list: TreeNode[], id: string, newParent: string|null) {
  const { node, rest } = extractNode(list, id)
  if (!node) return list
  if (newParent === null) return [node, ...rest]
  const forbid = collectDescendantIds(node)
  if (forbid.has(newParent)) return [node, ...rest]
  const exists = (function find(arr: TreeNode[]): boolean {
    for (const n of arr) {
      if (n.id === newParent) return true
      if (n.children && find(n.children)) return true
    }
    return false
  })(rest)
  if (!exists) return [node, ...rest]
  return insertChild(rest, newParent, node)
}
