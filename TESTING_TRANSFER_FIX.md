# Testing Instructions for Universal Transfer Fix

## Issue Fixed
Fixed the error "Ошибка при перемещении: Не найдены узлы для перемещения" (Error during move: Nodes for moving not found) that occurred when trying to move items using the 🔗⇧ buttons.

## Root Cause
The issue was in the selection collection logic. The Tree components were using a locally-scoped `isNodeSelected` function that only knew about the current tree's selections, but we needed to collect selections from ALL trees for cross-tree transfers.

## Fix Applied
1. **Added globalIsNodeSelected prop**: Tree components now receive a global selection function that can check selections across all trees
2. **Fixed selection collection**: Updated the logic to use `globalIsNodeSelected(tree.id, node.id)` instead of the local `isNodeSelected(node.id)`
3. **Enhanced debugging**: Added comprehensive debug logging to track selection and transfer operations

## How to Test

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder
4. The extension should load without errors

### 2. Test Within-Tree Movement
1. Create some bookmarks in the extension
2. Enable selection mode (toggle button)
3. Select 2-3 bookmarks by clicking the checkboxes
4. Click the 🔗⇧ button on a different folder
5. **Expected**: Items should move to the target folder and selection should clear

### 3. Test Cross-Tree Movement
1. Create a second tree with some bookmarks
2. Enable selection mode
3. Select bookmarks from both trees
4. Click 🔗⇧ button in any tree/folder
5. **Expected**: All selected items should move to the target location

### 4. Test Root Movement
1. Select various bookmarks/folders
2. Click the "🔗⇧ + Выделенное (в корень)" button
3. **Expected**: Items move to the current tree's root

### 5. Debug Information
Open browser DevTools (F12) to see debug output:
- `[DEBUG] addSelectedTabHere:` shows selection collection
- `[DEBUG] handleUniversalTransfer called:` shows transfer parameters
- `[DEBUG] Processing source tree:` shows tree processing
- `[DEBUG] Extraction result:` shows which nodes were found/extracted

## Expected Behavior After Fix

✅ **No more "Не найдены узлы для перемещения" errors**  
✅ **Cross-tree selections work correctly**  
✅ **Selections are properly detected and transferred**  
✅ **Debug logs show proper node collection and processing**  
✅ **Selection state is cleared after successful moves**  

## If Issues Persist

1. Check the browser console for debug output
2. Verify that selection mode is enabled
3. Confirm that items are actually selected (checkboxes checked)
4. Look for any error messages in the debug logs
5. Try reloading the extension and retesting

## Cleanup After Testing

Once confirmed working, the debug logging can be removed from:
- `universalAdd.ts` (handleUniversalTransfer function)
- `Tree.tsx` (addSelectedTabHere function)