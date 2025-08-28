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

// Group operations
export function removeMultipleNodes(list: TreeNode[], nodeIds: string[]): TreeNode[] {
  let result = list
  for (const id of nodeIds) {
    result = removeNode(result, id)
  }
  return result
}

export function extractMultipleNodes(list: TreeNode[], nodeIds: string[]): { nodes: TreeNode[], rest: TreeNode[] } {
  let result = list
  const extractedNodes: TreeNode[] = []
  
  for (const id of nodeIds) {
    const { node, rest } = extractNode(result, id)
    if (node) {
      extractedNodes.push(node)
      result = rest
    }
  }
  
  return { nodes: extractedNodes, rest: result }
}

export function moveMultipleNodes(list: TreeNode[], nodeIds: string[], newParent: string|null): TreeNode[] {
  const { nodes, rest } = extractMultipleNodes(list, nodeIds)
  if (nodes.length === 0) return list
  
  // If moving to root
  if (newParent === null) {
    return [...nodes, ...rest]
  }
  
  // Check for circular dependencies
  const allForbiddenIds = new Set<string>()
  nodes.forEach(node => {
    collectDescendantIds(node).forEach(id => allForbiddenIds.add(id))
  })
  
  if (allForbiddenIds.has(newParent)) {
    // Fallback to root if circular dependency detected
    return [...nodes, ...rest]
  }
  
  // Check if target parent exists
  const exists = (function find(arr: TreeNode[]): boolean {
    for (const n of arr) {
      if (n.id === newParent) return true
      if (n.children && find(n.children)) return true
    }
    return false
  })(rest)
  
  if (!exists) {
    // Fallback to root if parent doesn't exist
    return [...nodes, ...rest]
  }
  
  // Insert all nodes into the target parent
  let result = rest
  for (const node of nodes) {
    result = insertChild(result, newParent, node)
  }
  
  return result
}

/**
 * Update the comment for a specific node
 * @param list The tree node list
 * @param id The ID of the node to update
 * @param comment The new comment text
 * @returns Updated tree node list
 */
export function updateNodeComment(list: TreeNode[], id: string, comment: string): TreeNode[] {
  return updateNode(list, id, node => ({ ...node, comment }));
}
