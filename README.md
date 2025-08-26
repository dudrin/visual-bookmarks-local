# Visual Bookmarks Tree (Local)

[![Version](https://img.shields.io/badge/version-0.1.5.1-blue.svg)](https://github.com/your-username/visual-bookmarks-local)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-brightgreen.svg)](https://developer.chrome.com/extensions)

A powerful Chrome extension for managing bookmarks in a visual tree structure with local SQLite storage and offline page saving capabilities.

## 🌟 Features

- **Tree Structure**: Organize bookmarks in hierarchical trees instead of flat lists
- **Multiple Trees**: Create and manage multiple bookmark trees for different projects
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

### Advanced Features

- **Context Menus**: Right-click on tabs to add selected tabs to your trees
- **Panel View**: Click the "⛶" button to open a larger management window
- **Export/Import**: Backup your data using JSON export/import
- **Theme Switching**: Choose between light, dark, or system theme

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
├── popup/               # Main popup interface
│   ├── App.tsx          # Main React component
│   ├── Tree.tsx         # Tree visualization component
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
4. **SQL Storage** (`sqlStorage.ts`): Database operations and state management
5. **State Management** (`useTreeStates.ts`): Persistent UI state across sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 Changelog

### v0.1.5.1 (Latest)
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

