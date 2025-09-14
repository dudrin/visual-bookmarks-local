# Visual Bookmarks Tree (Local)

[![Version](https://img.shields.io/badge/version-0.1.7-blue.svg)](https://github.com/your-username/visual-bookmarks-local)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-brightgreen.svg)](https://developer.chrome.com/extensions)

A powerful Chrome extension for managing bookmarks in a visual tree structure with local SQLite storage and offline page saving capabilities.

## 🆕 New in Version 0.1.7

### 🛠️ Bug Fixes and Improvements
- **Fixed saved page icon persistence**: Resolved issue where open icon remained visible after deleting saved files
- **Improved file existence checking**: Enhanced cache validation to properly detect deleted files
- **Stable UI layout**: Fixed row height changes when saved page icons appear/disappear
- **Enhanced error handling**: Better handling of "Download file already deleted" errors

### 🔄 Technical Improvements
- **Periodic file validation**: Added background service to periodically check saved file integrity
- **Improved cache management**: More robust cache update and invalidation mechanisms
- **Consistent icon sizing**: Fixed CSS to ensure stable row heights regardless of icon visibility


## 🌟 Features

- **Tree Structure**: Organize bookmarks in hierarchical trees instead of flat lists
- **Multiple Trees**: Create and manage multiple bookmark trees for different projects
- **Selection & Move/Copy System**: Advanced bookmark management with visual selection and dual-mode operations
  - **Selection Mode**: Toggle selection mode (☑) to select multiple bookmarks across trees
  - **Move/Copy Toggle**: Switch between move (✂️) and copy (📋) modes with session persistence
  - **Cross-tree Operations**: Move or copy bookmarks between different trees seamlessly
  - **Intra-tree Moves**: Reliable within-tree bookmark reorganization
- **Link Parent Feature**: Links can now contain child nodes, acting as both bookmarks and folders
  - **Visual Differentiation**: Links with children display as hollow circles with blue borders
  - **Dual Functionality**: Click to expand/collapse if has children, click to open URL if no children
  - **Full Actions**: All operations (add category, add tabs) available for link parents
- **Local Storage**: SQLite database with WebAssembly for reliable local storage
- **Offline Saving**: Save web pages as MHTML files for offline access
- **Search & Filter**: Advanced search and level-based filtering
- **Tab Management**: Add single tabs or multiple selected tabs at once via context menu
- **Smart Tab Grouping**: Automatically places new tabs in appropriate tab groups with fallback priority
- **Level-Based Filtering**: Use level buttons (0, 1, 2, "All") to control tree display depth
- **Persistent UI State**: Remembers expanded nodes and view state across sessions
- **Modern UI**: Clean React-based interface with light/dark theme support
- **Data Export/Import**: Backup and restore your bookmark trees

## 🚀 Installation

### From Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/visual-bookmarks-local.git
   cd visual-bookmarks-local/extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Mode

```bash
npm run dev
```

This starts development mode with hot reload and automatic rebuilding.

## 📖 Usage

### Basic Operations

1. **Create a Tree**: Click the "+" button in the top bar
2. **Add Single Bookmark**: Use the right panel to add current tab
3. **Add Multiple Bookmarks**: 
   - Select multiple tabs in browser (Ctrl+click)
   - Right-click and choose "Add selected tabs to Visual Bookmarks"
   - Click the tree addition button in the extension
4. **Organize**: Drag and drop nodes to reorganize your tree
5. **Search**: Use the search bar to find specific bookmarks
6. **Filter by Level**: Use level buttons (0, 1, 2, "All") to control tree depth display
7. **Offline Save**: Save web pages locally with the "+ В корень (офлайн)" button
8. **Link Parent Feature**: 
   - Add child nodes to any link using the "📁＋" or "🔗⇧" buttons
   - Links with children can be expanded/collapsed like folders
   - Links without children open the URL directly when clicked
9. **Settings Management**:
   - Access settings through the gear icon (⚙️) in the extension
   - Configure offline page save folder
   - Close settings without saving using the "Close" button

### Selection & Move/Copy Operations

1. **Enable Selection Mode**: Click the selection button (☑) to enter selection mode
2. **Select Bookmarks**: 
   - Click on bookmarks to select them (checkboxes appear)
   - Select across multiple trees for cross-tree operations
3. **Choose Operation Mode**:
   - **Copy Mode** (📋): Creates duplicates with new IDs (default)
   - **Move Mode** (✂️): Transfers bookmarks, removing them from source
4. **Execute Operations**:
   - Use 🔗⇧ buttons on folders to move/copy selected items into that folder
   - Use "🔗⇧ + Выделенное (в корень)" to move/copy to tree root
5. **Clear Selection**: Click "✕ Убрать выделение" when done

### Advanced Features

- **Context Menus**: Right-click on tabs to add selected tabs to your trees
- **Panel View**: Click the "⛶" button to open a larger management window
- **Export/Import**: Backup your data using JSON export/import
- **Theme Switching**: Choose between light, dark, or system theme
- **Link Parent Nodes**: Create complex hierarchies where links can contain other bookmarks

## 🛠 Technical Stack

- **Frontend**: React 18.3.1 + TypeScript 5.5.4
- **Build Tool**: Vite 5.4.2
- **Database**: sql.js (SQLite + WebAssembly)
- **Chrome APIs**: Manifest V3
- **Styling**: CSS with CSS custom properties for theming

## 📁 Project Structure

```
src/
├── background.ts          # Service worker for Chrome extension
├── models.ts             # TypeScript interfaces and types
├── universalAdd.ts       # Universal transfer and move/copy operations
├── popup/               # Main popup interface
│   ├── App.tsx          # Main React component
│   ├── Tree.tsx         # Tree visualization component
│   ├── SelectionIndicator.tsx # Selection mode UI controls
│   ├── useSelection.ts  # Selection state management hook
│   ├── useTreeStates.ts # State management hook
│   ├── popup.html       # Popup HTML template
│   └── popup.css        # Styling
├── panel/               # Large panel interface
└── shims/               # Browser compatibility shims
```

## 🔧 Development

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Chrome/Chromium browser

### Available Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build production version
- `npm run pack` - Create distributable ZIP file
- `npm run copy-wasm` - Copy WebAssembly files

### Key Components

1. **Background Script** (`background.ts`): Handles Chrome API interactions
2. **Main App** (`App.tsx`): Core React application with tree management
3. **Tree Component** (`Tree.tsx`): Visual tree representation with drag-and-drop
4. **Selection System**:
   - **SelectionIndicator** (`SelectionIndicator.tsx`): UI controls for selection mode
   - **useSelection** (`useSelection.ts`): Selection state management with persistence
   - **universalAdd** (`universalAdd.ts`): Universal transfer operations and move/copy logic
5. **SQL Storage** (`sqlStorage.ts`): Database operations and state management
6. **State Management** (`useTreeStates.ts`): Persistent UI state across sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 Changelog

### v0.1.7 (Latest)
- **FIXED: Saved page icon persistence**: Resolved issue where open icon remained visible after deleting saved files
- **IMPROVED: File existence checking**: Enhanced cache validation to properly detect deleted files
- **FIXED: UI layout stability**: Fixed row height changes when saved page icons appear/disappear
- **IMPROVED: Error handling**: Better handling of "Download file already deleted" errors
- **NEW: Periodic file validation**: Added background service to periodically check saved file integrity
- **IMPROVED: Cache management**: More robust cache update and invalidation mechanisms
- **FIXED: Icon sizing**: Consistent CSS to ensure stable row heights regardless of icon visibility
- **NEW: Settings management**: Added ability to close settings without saving changes

### v0.1.5.5
- **NEW: Complete Node Comment System**: Implemented full comment functionality for all tree nodes (bookmarks and folders)
  - Dedicated comment button (💬) for adding/editing comments on any node
  - Visual indication of nodes with comments (subtle background highlight)
  - Comments are persisted in the local SQLite database
  - Comment text displayed in tooltip when hovering over the comment button
  - Visual styling for nodes with comments and active comment buttons
- **IMPROVED: UI Alignment**: Fixed visual alignment issues with action buttons in the tree view
  - Consistent fixed-width styling for all action buttons
  - Proper spacing and alignment of icon buttons regardless of content
- **FIXED: Comment System UI**: Resolved visual artifacts and alignment issues with comment indicators

### v0.1.5.4
- **NEW: Node Comment System**: Added ability to add comments to any tree node (bookmark or folder)
  - Visual indication of nodes with comments (left border highlight)
  - Dedicated comment button (💬) for adding/editing comments
  - Comments are persisted in the local SQLite database
  - Comment text displayed in tooltip when hovering over the comment button
  - Visual styling for nodes with comments and active comment buttons

### v0.1.5.3
- **NEW: Link Parent Feature**: Links can now contain child nodes, acting as both bookmarks and folders
  - Visual differentiation with hollow blue circles for links with children
  - Dual functionality: expand/collapse if has children, open URL if no children
  - All actions (add category, add tabs) now available for link parents
- **IMPROVED: UI/UX**: Enhanced visual feedback for different node types
- **ADDED: Technical Documentation**: Comprehensive documentation for link parent functionality

### v0.1.5.2
- **NEW: Move/Copy Mode Toggle**: Added dual-mode transfer system with visual toggle between move (✂️) and copy (📋) operations
- **NEW: Universal Selection System**: Implemented advanced bookmark selection with visual checkboxes and multi-tree support
- **NEW: Cross-tree Operations**: Enable moving and copying bookmarks between different trees seamlessly
- **FIXED: Intra-tree Move Bug**: Resolved issue where bookmarks disappeared when moving within the same tree
- **IMPROVED: Session Persistence**: Move/copy mode and selection state now persist across browser sessions
- **IMPROVED: Build Optimization**: Eliminated Vite static/dynamic import conflicts for better performance
- **ADDED: Selection UI Controls**: New SelectionIndicator component with clear visual feedback
- **ADDED: Universal Transfer Logic**: Simplified copy+delete pattern for reliable move operations
- **ADDED: Comprehensive Documentation**: Added detailed guides for move functionality and troubleshooting

### v0.1.5.1
- **Fixed level filtering functionality**: Restored tree level buttons (0, 1, 2, "All") with proper state management
- **Improved tab group context awareness**: New tabs now open in correct tab groups using priority-based resolution
- **Fixed context menu duplicate errors**: Resolved "Cannot create item with duplicate id" crashes during extension reloads
- **Enhanced multi-tab selection**: Improved reliability using context menu staging over direct Chrome APIs
- **Better user experience**: Added detailed instructions for multi-tab workflows and clearer UI feedback
- **Technical improvements**: Enhanced error handling, code organization, and session storage management

### v0.1.5.0
- Fixed tree node expansion conflicts with level filters
- Improved topbar layout with proper flexbox positioning
- Added persistent UI state management across tree switching
- Enhanced state persistence for expanded nodes and scroll position

### v0.1.4.x
- Initial implementation with React + TypeScript
- SQLite local storage integration
- Basic tree management functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [sql.js](https://sql.js.org/) for local SQLite storage
- Uses [Vite](https://vitejs.dev/) for fast development and building
- Icons and design inspired by modern browser UX patterns

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/visual-bookmarks-local/issues) page
2. Create a new issue with detailed description
3. Include browser version and extension version in bug reports

---

**Made with ❤️ for better bookmark management**

---

## Техническая документация (Russian Technical Guide)

Подробное техническое руководство доступно в файле [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md).

