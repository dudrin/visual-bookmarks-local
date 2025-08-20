import type { TreeNode } from './models'
export function highlight(text: string, q: string):(string|{mark:string})[] {
  if (!q) return [text]
  const out:any[] = []; const L = text.toLowerCase(); const qq = q.toLowerCase()
  let i = 0
  while (i < text.length) {
    const k = L.indexOf(qq, i)
    if (k < 0) { out.push(text.slice(i)); break }
    if (k > i) out.push(text.slice(i, k))
    out.push({ mark: text.slice(k, k + q.length) })
    i = k + q.length
  }
  return out
}
export function filterTree(nodes: TreeNode[], q: string) {
  if (!q) return nodes
  const rec = (arr: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = []
    for (const n of arr) {
      const kids = n.children ? rec(n.children) : []
      const hit = n.title.toLowerCase().includes(q.toLowerCase()) || (n.url?.toLowerCase().includes(q.toLowerCase()) ?? false)
      if (hit || kids.length) out.push({ ...n, children: kids })
    }
    return out
  }
  return rec(nodes)
}
