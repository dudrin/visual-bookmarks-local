# Contributing to Visual Bookmarks Tree (Local)

Thank you for your interest in contributing to Visual Bookmarks Tree! This document provides guidelines and instructions for contributing to this project.

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Chrome/Chromium browser

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dudrin/visual-bookmarks-local.git
   cd visual-bookmarks-local
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## Code Structure

- `src/background.ts`: Service worker for Chrome extension
- `src/models.ts`: TypeScript interfaces and types
- `src/universalAdd.ts`: Universal transfer and move/copy operations
- `src/popup/`: Main popup interface
- `src/panel/`: Large panel interface
- `src/shims/`: Browser compatibility shims

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Coding Standards

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Keep commits focused and atomic
- Use descriptive commit messages

## Feature Requests and Bug Reports

Please use the GitHub Issues page to submit feature requests and bug reports.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.