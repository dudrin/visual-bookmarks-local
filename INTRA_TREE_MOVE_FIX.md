# Intra-tree Move Fix - "Nodes Disappearing" Issue

## 🐛 Problem Description

User reported: **"К сожалению внутри дерева перемещение не работает - узлы исчезают при попытке перемещения"**

When attempting to move bookmarks within the same tree (intra-tree moves), the selected nodes were disappearing instead of being moved to the target location.

## 🔍 Root Cause Analysis

The issue was in the `copySelectedNodes` function in `universalAdd.ts`. The function had logic to skip immediate source deletion for intra-tree moves, but the calling code wasn't providing the necessary `targetTreeId` parameter to identify when a move was happening within the same tree.

### Key Problems:
1. **Missing `targetTreeId` parameter**: The `copySelectedNodes` function calls in `Tree.tsx` and `App.tsx` were not passing the `targetTreeId` parameter
2. **Immediate source deletion**: Without knowing it was an intra-tree move, the function was deleting source nodes immediately after copying, causing them to disappear
3. **Wrong callback function**: The cleanup callback was calling the wrong function name

## 🔧 Solution Implemented

### 1. Added `targetTreeId` Parameter to All Calls

**Tree.tsx - addSelectedTabHere function:**
```typescript
const copiedNodes = await copySelectedNodes({
  selectedNodes,
  sourceTreeData: allTrees.map(t => ({ treeId: t.id, nodes: t.nodes })),
  moveMode,
  onUpdateTree: onUpdateTreeNodes,
  targetTreeId: docId // ✅ Added for intra-tree move detection
})
```

**Tree.tsx - handleAddSelectedToRoot function:**
```typescript
const copiedNodes = await copySelectedNodes({
  selectedNodes,
  sourceTreeData: allTrees.map(t => ({ treeId: t.id, nodes: t.nodes })),
  moveMode,
  onUpdateTree: onUpdateTreeNodes,
  targetTreeId: doc.id // ✅ Added for intra-tree move detection
})
```

**App.tsx - Both button handlers:**
```typescript
const copiedNodes = await copySelectedNodes({
  selectedNodes,
  sourceTreeData: trees.map(t => ({ treeId: t.id, nodes: t.nodes })),
  moveMode: selectionState.moveMode,
  onUpdateTree: updateNodesFor,
  targetTreeId: active.id // ✅ Added for intra-tree move detection
})
```

### 2. Fixed Callback Function Names

**Before:**
```typescript
onUpdateTree: (treeId, newNodes) => {
  setAllNodesDirty(newNodes) // ❌ Wrong function name
  return Promise.resolve()
}
```

**After:**
```typescript
onUpdateTree: (treeId, newNodes) => {
  setAllNodes(newNodes) // ✅ Correct function name
  return Promise.resolve()
}
```

### 3. Cleaned Up Unused Code

- Removed the old `handleUniversalTransfer` function that used problematic extraction logic
- Updated imports to remove the unused function

## 🧪 How the Fix Works

### For Inter-tree Moves (between different trees):
1. `copySelectedNodes` copies nodes with new IDs
2. Immediately deletes source nodes from source trees
3. Nodes appear in target tree, disappear from source trees ✅

### For Intra-tree Moves (within same tree):
1. `copySelectedNodes` copies nodes with new IDs
2. **Skips** immediate source deletion (because `targetTreeId` matches source tree ID)
3. Nodes are inserted into target location
4. `deleteSourceNodesForIntraTreeMove` is called **after** insertion
5. Original source nodes are deleted from their original locations
6. Result: Nodes moved from source to target within same tree ✅

## 🔍 Technical Details

### Logic Flow for Intra-tree Moves:

```typescript
// 1. Copy phase - always creates copies with new IDs
for (const selectedNode of selectedNodes) {
  const copiedNode = copyNodeRecursively(fullNode) // New IDs
  copiedNodes.push(copiedNode)
}

// 2. Conditional deletion phase
if (moveMode && onUpdateTree) {
  for (const [treeId, nodeIds] of nodesByTree) {
    // ✅ Skip deletion for target tree (intra-tree move)
    if (targetTreeId && treeId === targetTreeId) {
      console.log('Skipping source deletion for intra-tree move')
      continue
    }
    // Delete from other trees only
    await onUpdateTree(treeId, updatedNodes)
  }
}

// 3. After insertion (in calling code)
if (moveMode && onUpdateTreeNodes) {
  await deleteSourceNodesForIntraTreeMove({
    selectedNodes,
    treeId: docId,
    currentTreeNodes: updatedNodes,
    onUpdateTree: setAllNodes
  })
}
```

## ✅ Result

- **✅ Intra-tree moves**: Nodes are properly moved from source to target location within the same tree
- **✅ Inter-tree moves**: Nodes are moved between different trees  
- **✅ Copy mode**: Creates duplicates without affecting originals
- **✅ No more disappearing nodes**: Proper order of operations ensures nodes don't vanish

## 🚀 Testing

To test the fix:
1. Reload the extension in `chrome://extensions`
2. Enable selection mode (☑️)
3. Switch to move mode (✂️)
4. Select some bookmarks within a tree
5. Click 🔗⇧ on a different folder in the same tree
6. **Expected**: Bookmarks should move to the target folder, not disappear ✅

The fix ensures that intra-tree moves work correctly by providing the necessary context to the move function and maintaining proper order of operations.