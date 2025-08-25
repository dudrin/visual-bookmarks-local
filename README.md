# Visual Bookmarks Tree (Local)

[![Version](https://img.shields.io/badge/version-0.1.5.0-blue.svg)](https://github.com/your-username/visual-bookmarks-local)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-brightgreen.svg)](https://developer.chrome.com/extensions)

A powerful Chrome extension for managing bookmarks in a visual tree structure with local SQLite storage and offline page saving capabilities.

## 🌟 Features

- **Tree Structure**: Organize bookmarks in hierarchical trees instead of flat lists
- **Multiple Trees**: Create and manage multiple bookmark trees for different projects
- **Local Storage**: SQLite database with WebAssembly for reliable local storage
- **Offline Saving**: Save web pages as MHTML files for offline access
- **Search & Filter**: Advanced search and level-based filtering
- **Tab Management**: Add single tabs or multiple selected tabs at once
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
2. **Add Bookmarks**: Use the right panel to add current tab or selected tabs
3. **Organize**: Drag and drop nodes to reorganize your tree
4. **Search**: Use the search bar to find specific bookmarks
5. **Filter by Level**: Use level buttons to show/hide tree depths
6. **Offline Save**: Save web pages locally with the "+ В корень (офлайн)" button

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

Подробное техническое руководство доступно в файле [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md).

Мы разобрались:
•	что такое расширение,
•	как устроен движок Chrome,
•	зачем нужен именно наш проект.
 
Часть II. Стек технологий
________________________________________
Глава 4. Node.js — зачем нужен и как работает изнутри
4.1. Что такое Node.js?
Если упрощать: Node.js — это способ запускать JavaScript вне браузера.
В браузере JavaScript работает внутри движка V8 (тот самый, что в Chrome). Node.js берёт этот движок и «упаковывает» его в отдельную платформу, добавив системные модули (файлы, сеть, процессы).
То есть Node.js превращает JavaScript в язык для серверов, утилит и инструментов, а не только для кнопочек на сайтах.
________________________________________
4.2. Зачем Node.js в нашем проекте?
Мы же пишем расширение для Chrome, а не сервер, верно?
Так зачем нам Node.js?
Ответ: Node.js нужен для разработки, сборки и менеджмента зависимостей.
1.	📦 Менеджер пакетов (npm)
Node.js идёт вместе с npm (Node Package Manager).
Именно через него мы ставим зависимости проекта (React, Vite, TypeScript и др.).
Например:
npm install react
npm install typescript
npm install vite
Все они скачиваются в папку node_modules и описываются в package.json.
2.	🛠 Сборка проекта
Браузер не понимает TypeScript (.ts, .tsx) и не любит «сырой» современный JavaScript (с модулями, JSX и прочими новшествами).
Поэтому Node.js используется для запуска Vite — сборщика, который:
o	компилирует TypeScript → JavaScript
o	собирает React JSX в чистый JS
o	оптимизирует код
o	кладёт готовые файлы в папку dist (которая уже подсовывается Chrome как расширение)
3.	⚙️ Скрипты разработки
Через Node.js запускаются команды из package.json:
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "tsc --noEmit"
}
Это маленькие ярлыки:
o	npm run dev → стартует локальный сервер для отладки
o	npm run build → собирает готовую версию расширения
o	npm run lint → проверяет типы
________________________________________
4.3. Как Node.js устроен внутри
Чтобы понять, почему Node.js так удобен, нужно взглянуть на его «внутренности»:
1.	V8
В сердце Node.js лежит движок V8 (из Chrome). Он компилирует JS прямо в машинный код и работает очень быстро.
2.	libuv
Это «второй моторчик». libuv отвечает за асинхронность:
o	сетевые запросы
o	файловую систему
o	таймеры
o	многопоточность внутри
Node.js «кажется» однопоточным, но внутри libuv крутит «пул потоков» и возвращает результат в главный цикл событий.
3.	Event Loop (цикл событий)
Это сердце Node.js. Всё работает так:
o	ты вызываешь асинхронную функцию (например, читаешь файл)
o	Node.js отдаёт задачу в libuv
o	цикл событий ждёт, пока задача завершится
o	когда она готова, callback попадает обратно в очередь
В итоге Node.js может обслуживать сотни задач параллельно, не блокируя выполнение.
________________________________________
4.4. Node.js и расширение: связка
Важно понимать: Node.js не работает внутри расширения Chrome.
Когда расширение уже запущено в браузере, оно общается только с Chrome APIs.
Node.js нужен на этапе:
•	разработки
•	сборки
•	проверки типов
•	оптимизации
Пример:
•	ты пишешь код в App.tsx (React+TypeScript)
•	Node.js через Vite преобразует это в «голый JS»
•	результат кладётся в dist/
•	расширение в Chrome использует уже этот собранный JS
________________________________________
4.5. Почему без Node.js было бы хуже?
Если бы мы не использовали Node.js и его инструменты, пришлось бы:
•	писать всё на чистом JavaScript
•	вручную следить за типами
•	самому собирать и минифицировать код
•	подключать библиотеки через <script src=...>
Это как чинить машину без инструментов: возможно, но долго и мучительно.
Node.js дал нам «мощный ящик с инструментами», чтобы разрабатывать современное расширение удобнее и быстрее.
________________________________________
4.6. Краткий итог
•	Node.js — это «среда исполнения JS вне браузера» на базе V8.
•	В проекте расширения он используется не внутри браузера, а для сборки и управления зависимостями.
•	Главные роли Node.js в проекте:
o	запуск Vite
o	установка библиотек (React, TypeScript и пр.)
o	проверка типов и сборка
•	Внутри Chrome работает только собранный JavaScript, а не Node.js.
________________________________________
Этой главой мы закрыли вопрос: «Зачем Node.js в нашем проекте и как он устроен».
Дальше логично будет перейти к следующей главе — TypeScript (зачем .ts и .tsx, как он помогает, что даёт типизация).
 
Глава 5. TypeScript — строгий JavaScript
________________________________________
5.1. Что такое TypeScript?
Если кратко: TypeScript (TS) — это JavaScript с типами.
Обычный JS — динамический язык:
let x = 10;
x = "строка"; // и это не ошибка!
TypeScript добавляет строгую систему типов:
let x: number = 10;
x = "строка"; // ❌ Ошибка при компиляции
Но главное: TypeScript компилируется в обычный JavaScript.
Браузер не умеет выполнять .ts и .tsx, поэтому всё это преобразуется (через Node.js + Vite) в «чистый JS».
________________________________________
5.2. Зачем TypeScript нужен в проекте расширения?
В нашем расширении куча взаимодействия с API браузера: вкладки, группы вкладок, сообщения между процессами. Ошибки здесь часто «всплывают» только в рантайме. TypeScript помогает:
1.	Предотвращать ошибки ещё на этапе написания
chrome.tabs.query({ active: true }, (tabs) => {
  console.log(tabs[0].title.toUpperCase()); 
  // TS подскажет: title может быть undefined!
});
2.	Автодополнение и документация прямо в редакторе
Когда мы пишем chrome.contextMenus.create(...), VS Code сразу показывает все параметры и их типы.
3.	Единый контракт между частями кода
Например, мы шлём сообщение из background.ts в App.tsx:
type MsgAddTabs = {
  type: "VB_BUFFER_SELECTED_TABS";
  batchId: string;
  tabs: SimpleTab[];
};
Теперь IDE проверяет, что мы реально передали именно массив SimpleTab, а не «что-то похожее».
4.	Большой проект → легко рефакторить
Без TS любое переименование или перестановка может всё сломать.
С TS редактор сразу подсветит, где что-то несовместимо.
________________________________________
5.3. .ts и .tsx — что за расширения?
•	.ts — обычный TypeScript (например, background.ts)
•	.tsx — TypeScript + JSX (то есть файлы с React-компонентами)
JSX — это синтаксис вроде HTML прямо в коде:
function Hello() {
  return <h1>Привет!</h1>;
}
TypeScript понимает этот синтаксис, но требует расширение .tsx.
________________________________________
5.4. Настройка TypeScript в проекте
В корне папки extension у нас есть файл tsconfig.json. Это конфигурация компилятора TS.
Пример:
{
  "compilerOptions": {
    "target": "ESNext",          // во что компилировать JS
    "module": "ESNext",          // модули в стиле ES
    "jsx": "react-jsx",          // поддержка JSX
    "strict": true,              // строгая типизация
    "esModuleInterop": true,     // дружба с commonJS
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["./src/**/*"]
}
Разберём ключевые:
•	"strict": true — строгий режим, проверяет всё.
•	"jsx": "react-jsx" — чтобы файлы .tsx собирались как React.
•	"esModuleInterop": true — упрощает импорт старых библиотек.
________________________________________
5.5. Пример в нашем проекте
У нас есть интерфейс для вкладки:
export interface SimpleTab {
  id?: number;
  windowId?: number;
  title: string;
  url: string;
}
Теперь где угодно в коде мы можем использовать этот тип:
function addToInbox(tabs: SimpleTab[]) {
  for (const tab of tabs) {
    console.log(tab.url); // TS знает, что url точно есть
  }
}
Если случайно попытаемся сделать:
addToInbox([{ foo: "bar" }]); // ❌ Ошибка
Компилятор остановит нас ещё до запуска.
________________________________________
5.6. В связке с React
React-компоненты тоже типизируются.
Пример из tree.tsx:
interface TreeNodeProps {
  id: string;
  title: string;
  children?: TreeNodeProps[];
}

const TreeNode: React.FC<TreeNodeProps> = ({ id, title, children }) => {
  return (
    <div>
      <span>{title}</span>
      {children && children.map((c) => <TreeNode key={c.id} {...c} />)}
    </div>
  );
};
TypeScript гарантирует:
•	у каждого узла есть id и title
•	children может быть пустым, но если есть — это массив TreeNodeProps
Это спасает от кучи багов, когда структура данных становится сложной.
________________________________________
5.7. Итог
•	TypeScript = JavaScript + строгая типизация
•	В проекте расширения он нужен, чтобы:
o	ловить ошибки на этапе разработки
o	автодополнять код в VS Code
o	описывать контракты (типы сообщений, структуру вкладок, дерево узлов)
•	.ts — обычный код, .tsx — React-компоненты с JSX
•	Всё это собирается в обычный JS, который понимает Chrome
________________________________________
Теперь у нас есть понимание, зачем TypeScript и как он работает в связке с расширением.
Глава 6. React — сердце интерфейса Visual Bookmarks
________________________________________
6.1. Что такое React?
React — это библиотека для построения интерфейсов. Её фишка в том, что она работает не напрямую с DOM (как в «чистом JS»), а с виртуальным DOM.
👉 Алгоритм примерно такой:
1.	Мы описываем интерфейс в виде компонентов (.tsx).
2.	React строит виртуальную модель (виртуальный DOM).
3.	При изменении данных React сравнивает виртуальный DOM со старым состоянием и обновляет только изменившиеся куски реального DOM.
Это делает интерфейсы быстрыми и удобными в поддержке.
________________________________________
6.2. Почему React в расширении?
Можно было бы написать всё на «чистом JS» и document.createElement, но:
•	У нас сложная древовидная структура закладок. Рисовать дерево руками → боль.
•	Вкладки добавляются, удаляются, перемещаются. Нужно много обновлений интерфейса.
•	Хочется декларативный подход: «что показывать», а не «как руками вставлять div-ы».
React идеально подходит под эти задачи.
________________________________________
6.3. Где React используется в нашем проекте
📁 Внутри extension/src/ есть файлы .tsx:
•	App.tsx — корневой компонент приложения (точка входа).
•	tree.tsx — компонент дерева закладок.
•	Возможно, есть вспомогательные компоненты для поиска, настроек и т.д.
________________________________________
6.4. App.tsx — точка входа
Файл App.tsx отвечает за:
•	инициализацию состояния (входящие вкладки, дерево узлов)
•	приём сообщений от background.ts через chrome.runtime.onMessage
•	отображение главной панели (дерево, кнопки, поиск)
Пример (упрощённо):
import React, { useEffect, useState } from "react";
import Tree from "./tree";
import { SimpleTab } from "./models";

export default function App() {
  const [inbox, setInbox] = useState<SimpleTab[]>([]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "VB_BUFFER_SELECTED_TABS") {
        setInbox(msg.tabs);
      }
    });
  }, []);

  return (
    <div className="app">
      <h1>Visual Bookmarks</h1>
      <Tree nodes={inbox} />
    </div>
  );
}
________________________________________
6.5. tree.tsx — дерево узлов
Это главный интерфейс пользователя. Здесь реализовано:
•	отображение узлов (папок/вкладок)
•	добавление новых ссылок в выбранный узел
•	перемещение узлов (drag & drop или через меню)
•	удаление
Пример (очень упрощённый):
interface NodeProps {
  id: string;
  title: string;
  url?: string;
  children?: NodeProps[];
}

const TreeNode: React.FC<NodeProps> = ({ id, title, url, children }) => {
  return (
    <div className="node">
      {url ? (
        <a href={url} target="_blank">{title}</a>
      ) : (
        <span>{title}</span>
      )}
      {children && (
        <div className="children">
          {children.map((c) => (
            <TreeNode key={c.id} {...c} />
          ))}
        </div>
      )}
    </div>
  );
};
________________________________________
6.6. Связь React и background.ts
React-компоненты не могут напрямую общаться с Chrome API (например, chrome.tabs.query) — это делает background.ts.
Схема взаимодействия:
1.	Пользователь жмёт кнопку в UI (React).
2.	React вызывает chrome.runtime.sendMessage(...).
3.	background.ts обрабатывает запрос (например, получает список выделенных вкладок).
4.	background.ts шлёт ответ обратно через chrome.runtime.sendMessage(...).
5.	App.tsx (через useEffect) ловит сообщение и обновляет useState.
6.	React перерисовывает интерфейс.
Таким образом, React управляет интерфейсом, а background.ts — связью с браузером.
________________________________________
6.7. Особенности React в расширении
•	Нет полноценного сервера: всё крутится в браузере, но UI всё равно нужен гибкий.
•	Сборка через Vite: .tsx → JavaScript → dist/.
•	Ограничения Manifest V3: нельзя держать «постоянный фоновый скрипт», поэтому UI должен быть максимально автономным.
________________________________________
6.8. Итог
•	React в проекте нужен для управления интерфейсом панели расширения.
•	Он рендерит дерево закладок (tree.tsx) и управляет состоянием (через useState, useEffect).
•	Связь с Chrome API идёт через background.ts и систему сообщений.
•	В связке TypeScript + React интерфейс становится безопасным и удобным в разработке.
________________________________________
Теперь у нас есть целостная картина: Node.js собирает проект, TypeScript следит за типами, а React управляет интерфейсом.
Логично в Глава 7 перейти к Chrome API: какие есть API у браузера, как расширение ими пользуется, и какие из них применяются именно в Visual Bookmarks (например, chrome.tabs, chrome.contextMenus, chrome.tabGroups).
 
Глава 7. Chrome API в расширении Visual Bookmarks
________________________________________
7.1. Что такое Chrome API?
Chrome API — это набор функций, которые предоставляет браузер расширениям.
Без них расширение было бы просто сайтом внутри Chrome.
Через эти API можно:
•	управлять вкладками и окнами,
•	добавлять кнопки в контекстное меню,
•	хранить данные,
•	общаться между разными частями расширения.
👉 Фишка: обычный сайт не может этого делать, только расширения.
________________________________________
7.2. Где Chrome API используется в проекте?
Наше расширение работает с несколькими ключевыми API:
1.	chrome.tabs — управление вкладками.
2.	chrome.tabGroups — работа с группами вкладок.
3.	chrome.contextMenus — контекстное меню («Добавить выделенные вкладки»).
4.	chrome.runtime — обмен сообщениями между background, popup и content.
5.	chrome.storage — хранение данных (офлайн сохранение дерева закладок).
________________________________________
7.3. chrome.tabs — работа с вкладками
Через этот API мы получаем список выделенных вкладок, их заголовки, URL и состояние.
Пример:
chrome.tabs.query({ highlighted: true, currentWindow: true }, (tabs) => {
  console.log("Выделенные вкладки:", tabs);
});
•	query — получить вкладки (по фильтру).
•	create — открыть новую вкладку.
•	remove — закрыть вкладку.
В Visual Bookmarks:
•	когда пользователь выбирает «Добавить выделенные вкладки», именно через chrome.tabs.query получаем список.
•	дальше этот список отправляется в React-панель.
________________________________________
7.4. chrome.tabGroups — группы вкладок
Chrome позволяет объединять вкладки в группы с цветами и названиями.
Наше расширение умеет учитывать эту структуру.
Пример:
chrome.tabGroups.update(groupId, { title: "Работа", color: "blue" });
В проекте:
•	если вкладки были в группе, в дерево можно добавить их «группой».
•	это делает организацию закладок более гибкой.
________________________________________
7.5. chrome.contextMenus — контекстное меню
Чтобы удобно вызывать команды, расширение добавляет пункты в контекстное меню:
chrome.contextMenus.create({
  id: "addSelectedTabs",
  title: "Добавить выделенные вкладки",
  contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addSelectedTabs") {
    // Логика добавления вкладок
  }
});
В проекте:
•	при клике пользователь может сразу отправить выделенные вкладки в Visual Bookmarks.
•	этот API связан напрямую с background.ts.
________________________________________
7.6. chrome.runtime — обмен сообщениями
В расширении есть несколько частей:
•	background.ts (фоновый скрипт),
•	App.tsx (панель),
•	возможно content.ts (если внедряется в страницы).
Они обмениваются сообщениями через chrome.runtime.
Пример:
// background.ts
chrome.runtime.sendMessage({ type: "VB_BUFFER_SELECTED_TABS", tabs });

// App.tsx
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "VB_BUFFER_SELECTED_TABS") {
    console.log("Получены вкладки:", msg.tabs);
  }
});
В проекте:
•	так React-панель узнаёт о новых выделенных вкладках, добавляемых из меню.
________________________________________
7.7. chrome.storage — хранение данных
Закладки и дерево узлов нужно где-то хранить.
В расширениях есть chrome.storage.local (аналог локальной БД).
Пример:
chrome.storage.local.set({ tree: myTree });

chrome.storage.local.get("tree", (result) => {
  console.log("Восстановленное дерево:", result.tree);
});
В нашем проекте:
•	используется модуль sqlStorage.ts, который хранит структуру дерева.
•	при перезапуске браузера данные восстанавливаются автоматически.
________________________________________
7.8. Ограничения Manifest V3
Важно: с переходом на Manifest V3 в Chrome API есть ограничения:
•	больше нет «вечного background», вместо него service worker.
•	код работает по событиям, а не «вечно висит в памяти».
•	поэтому архитектура Visual Bookmarks учитывает это: background поднимается только при событии (например, при клике на меню).
________________________________________
7.9. Итог
•	chrome.tabs — управление вкладками (получение выделенных).
•	chrome.tabGroups — поддержка групп вкладок.
•	chrome.contextMenus — пункт «Добавить выделенные вкладки».
•	chrome.runtime — обмен сообщениями между модулями.
•	chrome.storage — сохранение дерева закладок.
👉 Chrome API — это «руки» расширения: React отвечает за интерфейс, а API даёт доступ к самому браузеру.
________________________________________
Теперь у нас есть три кита: Node.js (сборка), TypeScript (типы), React (UI) и Chrome API (доступ к браузеру).
Логично следующую главу посвятить архитектуре самого расширения: как устроены части (background, App, tree, storage), как они взаимодействуют, и что куда шлёт.

Глава 8. Архитектура Visual Bookmarks
________________________________________
8.1. Зачем нужна архитектура?
Любое расширение для Chrome состоит из множества частей:
•	фоновый скрипт (background),
•	панель интерфейса (popup/panel),
•	контекстное меню,
•	хранилище данных,
•	и, возможно, контентные скрипты.
Если всё смешать в кучу — получится хаос.
Поэтому мы разделяем проект на модули с чёткой ответственностью.
________________________________________
8.2. Общая схема работы Visual Bookmarks
┌──────────────┐       ┌──────────────┐
│  Пользователь │──────▶│  React UI    │ (App.tsx + tree.tsx)
└──────┬───────┘       └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────┐       ┌──────────────┐
│ ContextMenus │──────▶│ Background.ts│
└──────────────┘       └──────┬───────┘
                              │
                 ┌────────────┴─────────────┐
                 ▼                          ▼
        ┌──────────────┐            ┌──-────────────┐
        │ Chrome Tabs  │            │ Chrome Storage│
        │ TabGroups    │            │ (sqlStorage)  │
        └──────────────┘            └───-───────────┘
👉 Пользователь кликает в UI → React отправляет сообщение → background общается с Chrome API → результат сохраняется в storage и возвращается в UI.
________________________________________
8.3. Основные модули
1. background.ts — связующее звено
•	слушает клики по контекстному меню;
•	получает список выделенных вкладок через chrome.tabs.query;
•	при необходимости группирует вкладки;
•	отправляет данные в панель (App.tsx) через chrome.runtime.sendMessage;
•	сохраняет структуру дерева в chrome.storage.
Можно сказать: background = «мозг», который знает, как общаться с браузером.
________________________________________
2. App.tsx — интерфейс пользователя
•	точка входа React-приложения;
•	подписывается на сообщения от background;
•	хранит состояние (inbox вкладок, дерево узлов) в useState;
•	отображает UI: дерево закладок (tree.tsx), поиск (search.ts), кнопки.
👉 React ничего не знает о браузере напрямую, он только показывает данные.
________________________________________
3. tree.tsx — дерево закладок
•	визуализирует структуру узлов (вложенные папки/ссылки);
•	позволяет добавлять/удалять/перемещать узлы;
•	работает с внутренними моделями (models.ts, treeOps.ts).
________________________________________
4. sqlStorage.ts — хранилище
•	обёртка над chrome.storage.local;
•	сохраняет дерево закладок;
•	при старте восстанавливает его.
________________________________________
5. models.ts и treeOps.ts
•	models.ts — описывает типы данных (SimpleTab, TreeNode).
•	treeOps.ts — операции над деревом: вставка, удаление, поиск.
Это «логика без интерфейса».
________________________________________
6. search.ts
•	отвечает за поиск по дереву закладок.
•	упрощает пользователю жизнь при большом количестве узлов.
________________________________________
8.4. Взаимодействие компонентов
Пример сценария:
1.	Пользователь выделил несколько вкладок в Chrome.
2.	В контекстном меню выбрал «Добавить выделенные вкладки».
3.	background.ts получает список через chrome.tabs.query.
4.	background отправляет сообщение в панель (App.tsx).
5.	App.tsx ловит событие в useEffect и добавляет вкладки во временный inbox.
6.	Пользователь видит новые вкладки в React-UI (tree.tsx).
7.	При сохранении узлов sqlStorage.ts кладёт структуру в chrome.storage.
8.	При следующем открытии панели дерево восстанавливается.
________________________________________
8.5. Почему такая архитектура удобна?
•	Разделение ответственности:
o	background = API браузера
o	React = UI
o	storage = данные
•	Гибкость: можно менять дерево или storage, не трогая UI.
•	Прозрачность: каждый модуль отвечает только за свою часть.
•	Масштабируемость: легко добавить, например, экспорт закладок в JSON.
________________________________________
8.6. Итог
•	Visual Bookmarks построено на трёх уровнях:
1.	Chrome API (tabs, contextMenus, storage)
2.	Background (связь API ↔ UI)
3.	React-панель (интерфейс и дерево)
•	Такая архитектура позволяет расширению быть:
o	быстрым,
o	надёжным,
o	расширяемым.
________________________________________
👉 Следующая глава логично посвятить потоку данных (data flow): как именно данные проходят путь «вкладка → background → React → storage → React».
 
Глава 9. Поток данных и событий в Visual Bookmarks
________________________________________
9.1. Почему это важно?
Если архитектура — это «скелет» расширения, то поток данных — это кровь и нервные импульсы.
Он определяет, как именно вкладка из браузера превращается в элемент дерева в панели Visual Bookmarks.
________________________________________
9.2. Общая схема
Вкладки в Chrome
    │
    ▼
 Контекстное меню ──▶ background.ts ──▶ React App (App.tsx + tree.tsx)
                                         │
                                         ▼
                                   sqlStorage.ts
•	Пользователь → браузер: выделяет вкладки.
•	Контекстное меню: запускает событие.
•	background.ts: получает вкладки, группирует, формирует payload.
•	chrome.runtime.sendMessage: доставка данных в React.
•	App.tsx: ловит сообщение, обновляет состояние.
•	tree.tsx: рендерит изменения.
•	sqlStorage.ts: сохраняет дерево для будущих сессий.
________________________________________
9.3. Пошаговый разбор событий
🔹 Шаг 1. Пользователь выделяет вкладки
Chrome «знает», какие вкладки выделены. Для этого используется:
chrome.tabs.query({ highlighted: true, currentWindow: true }, (tabs) => {
  // tabs — список выделенных вкладок
});
👉 Эти данные пока существуют только в браузере, React о них ничего не знает.
________________________________________
🔹 Шаг 2. Клик по контекстному меню
Пункт меню создаётся в background.ts:
chrome.contextMenus.create({
  id: "addSelectedTabs",
  title: "Добавить выделенные вкладки",
  contexts: ["all"]
});
И слушатель:
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addSelectedTabs") {
    const tabs = await getHighlightedTabs(); // chrome.tabs.query
    sendToPanel(tabs); // сообщение в React
  }
});
________________________________________
🔹 Шаг 3. background формирует сообщение
function sendToPanel(tabs: chrome.tabs.Tab[]) {
  chrome.runtime.sendMessage({
    type: "VB_BUFFER_SELECTED_TABS",
    tabs: tabs.map(t => ({
      id: t.id,
      title: t.title || t.url,
      url: t.url,
      windowId: t.windowId
    }))
  });
}
👉 Тут данные «очищаются»: в React пойдут только нужные поля.
________________________________________
🔹 Шаг 4. React принимает сообщение
В App.tsx:
useEffect(() => {
  function onMsg(msg: any) {
    if (msg?.type === "VB_BUFFER_SELECTED_TABS" && Array.isArray(msg.tabs)) {
      setInbox(prev => [...prev, ...msg.tabs]); 
    }
  }
  chrome.runtime.onMessage.addListener(onMsg);
  return () => chrome.runtime.onMessage.removeListener(onMsg);
}, []);
•	Inbox — это временный «буфер».
•	Сюда попадают вкладки до того, как пользователь решит, куда их сохранить.
________________________________________
🔹 Шаг 5. Пользователь добавляет вкладки в дерево
Через UI (tree.tsx) пользователь выбирает, куда сохранить.
function addToTree(tabs: SimpleTab[]) {
  setTree(prev => insertTabsIntoTree(prev, tabs));
}
________________________________________
🔹 Шаг 6. Сохранение в хранилище
chrome.storage.local.set({ tree });
Восстановление при перезапуске:
chrome.storage.local.get("tree", (result) => {
  if (result.tree) setTree(result.tree);
});
________________________________________
9.4. Ключевые события
1.	chrome.contextMenus.onClicked → старт процесса.
2.	chrome.tabs.query → сбор вкладок.
3.	chrome.runtime.sendMessage → доставка в React.
4.	chrome.runtime.onMessage → получение в React.
5.	setState (React) → обновление UI.
6.	chrome.storage.local → долговременное сохранение.
________________________________________
9.5. Важные детали реализации
•	Чтобы не было дубликатов, вводится batchId (идентификатор партии вкладок).
•	React проверяет: «Эта пачка уже была? Если да — пропустить».
•	Поток данных асинхронный → могут быть задержки (особенно при больших списках вкладок).
________________________________________
9.6. Итог
•	Поток данных в Visual Bookmarks — это «сервисная шина» между браузером и интерфейсом.
•	Главный маршрут: вкладки → background → React → storage → React.
•	Важна защита от дублей и потерянных сообщений.
•	React сам по себе не может спросить браузер о вкладках — для этого нужен background.
________________________________________
👉 Следующая логическая глава — Глава 10: Хранение данных и офлайн-устойчивость, где разберём подробно sqlStorage.ts, chrome.storage, сериализацию дерева и восстановление после перезапуска.
 
Глава 10. Хранение данных и офлайн-устойчивость
________________________________________
10.1. Зачем это нужно?
Представьте: вы собрали дерево из сотни вкладок, закрыли Chrome — и всё пропало. Это было бы катастрофой.
Поэтому у Visual Bookmarks есть система персистентного хранения, основанная на Chrome Storage API.
________________________________________
10.2. Варианты хранения в Chrome
Chrome предоставляет три основных механизма:
1.	chrome.storage.local
o	хранит данные на диске компьютера;
o	объём до 5–10 МБ;
o	быстрый доступ.
2.	chrome.storage.sync
o	синхронизируется через Google-аккаунт;
o	лимит меньше (~100 КБ на объект);
o	удобно, если нужно переносить закладки между устройствами.
3.	IndexedDB
o	полноценная база данных в браузере;
o	можно хранить гигабайты, но сложнее в работе.
👉 В Visual Bookmarks используется chrome.storage.local, так как дерево может быть большим, и важна скорость.
________________________________________
10.3. Модуль sqlStorage.ts
Это «прослойка» между приложением и chrome.storage.
Он решает несколько задач:
•	сериализация (преобразует дерево в JSON для хранения);
•	десериализация (восстанавливает дерево при старте);
•	операции CRUD (добавить, удалить, изменить узел);
•	офлайн-устойчивость (React всегда работает с локальной копией).
________________________________________
Пример: сохранение дерева
export async function saveTree(tree: TreeNode[]) {
  await chrome.storage.local.set({ tree });
}
________________________________________
Пример: загрузка дерева
export async function loadTree(): Promise<TreeNode[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get("tree", (result) => {
      resolve(result.tree || []);
    });
  });
}
________________________________________
10.4. Связь с React
Когда пользователь меняет структуру (например, добавляет узел):
1.	UI (tree.tsx) вызывает функцию insertNode.
2.	treeOps.ts модифицирует структуру дерева.
3.	App.tsx вызывает saveTree из sqlStorage.ts.
4.	sqlStorage.ts сохраняет данные через chrome.storage.local.
5.	При следующем старте расширения вызывается loadTree.
👉 Таким образом, React всегда работает с актуальной копией дерева.
________________________________________
10.5. Офлайн-устойчивость
•	React хранит состояние в памяти — мгновенная работа без задержек.
•	background хранит копию в storage — долговременное хранение.
•	Если что-то упало, то при перезапуске UI восстанавливает данные из chrome.storage.local.
________________________________________
10.6. Проблемы и решения
1.	Задержки при больших деревьях
o	Решение: сохранять не каждое действие, а батчами.
2.	Дублирование при копировании вкладок
o	Решение: использовать batchId и проверку «эта партия уже была?».
3.	Потеря данных при сбое Chrome
o	Решение: хранить snapshot в памяти и синхронизировать с chrome.storage.local.
________________________________________
10.7. Итог
•	Visual Bookmarks хранит данные через chrome.storage.local.
•	Модуль sqlStorage.ts обеспечивает удобный интерфейс для сохранения/загрузки.
•	Архитектура сделана так, что UI всегда работает с актуальными данными.
•	Даже если браузер упадёт, дерево восстановится при следующем запуске.
________________________________________
👉 Логичное продолжение — Глава 11: Работа с деревом закладок (tree.tsx и treeOps.ts), где мы подробно разберём, как именно устроено дерево, какие типы данных используются и как реализованы операции вставки/удаления.
Глава 11. Работа с деревом закладок (tree.tsx и treeOps.ts)
________________________________________
11.1. Что такое дерево в Visual Bookmarks?
В основе лежит структура данных, похожая на файловую систему:
•	Узел (Node) — это либо папка (категория), либо закладка (ссылка).
•	Папка может содержать другие папки и закладки.
•	Корень дерева — стартовая точка, где размещаются все категории.
Пример в JSON:
[
  {
    "id": "1",
    "title": "Работа",
    "children": [
      { "id": "2", "title": "Документация", "url": "https://developer.chrome.com" },
      { "id": "3", "title": "Задачи", "url": "https://jira.company.com" }
    ]
  },
  {
    "id": "4",
    "title": "Личное",
    "children": []
  }
]
________________________________________
11.2. Типы данных
Обычно определяются в models.ts:
export interface TreeNode {
  id: string;
  title: string;
  url?: string;         // есть только у ссылок
  children?: TreeNode[]; // есть только у папок
}
👉 Таким образом, папка = TreeNode без url, а закладка = TreeNode без children.
________________________________________
11.3. Компонент tree.tsx
Это React-компонент, который:
1.	Отображает дерево (с вложенностью).
2.	Позволяет раскрывать/сворачивать папки.
3.	Реализует drag & drop (перемещение узлов).
4.	Поддерживает добавление/удаление.
Упрощённый пример
function Tree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul>
      {nodes.map(node => (
        <li key={node.id}>
          {node.url 
            ? <a href={node.url}>{node.title}</a> 
            : <span>{node.title}</span>
          }
          {node.children && <Tree nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}
👉 На практике компонент более сложный:
•	добавлены кнопки «+Закладка», «+Категория»;
•	есть обработка кликов правой кнопкой;
•	интеграция с treeOps.ts.
________________________________________
11.4. Модуль treeOps.ts
Это набор чистых функций, которые управляют деревом:
•	insertNode(tree, parentId, newNode) — добавить узел.
•	removeNode(tree, nodeId) — удалить узел.
•	moveNode(tree, nodeId, newParentId) — переместить.
•	updateNode(tree, nodeId, props) — изменить название, URL и т.п.
Пример: вставка узла
export function insertNode(
  tree: TreeNode[], 
  parentId: string | null, 
  newNode: TreeNode
): TreeNode[] {
  if (parentId === null) {
    return [...tree, newNode]; // вставляем в корень
  }
  return tree.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode]
      };
    }
    if (node.children) {
      return { ...node, children: insertNode(node.children, parentId, newNode) };
    }
    return node;
  });
}
________________________________________
11.5. Взаимодействие tree.tsx ↔ treeOps.ts
1.	Пользователь нажимает «Добавить ссылку».
2.	tree.tsx вызывает функцию из treeOps.ts.
3.	Функция возвращает новую версию дерева (иммутабельность).
4.	React обновляет state, ререндерит дерево.
5.	sqlStorage.ts сохраняет изменения в chrome.storage.local.
________________________________________
11.6. Особенности реализации
•	Идентификаторы узлов генерируются через Date.now() + случайный суффикс.
•	Все операции — иммутабельные: возвращают новое дерево, а не меняют старое.
•	Drag & Drop работает поверх moveNode.
•	Проверки на уникальность (например, нельзя добавить папку без названия).
________________________________________
11.7. Проблемы и решения
1.	Слишком глубокое дерево
o	Решение: поддержка раскрытия только нужных ветвей.
2.	Дублирование ссылок
o	Решение: проверка на уровне treeOps.ts или перед вставкой.
3.	Перемещение узлов между ветками
o	Реализовано через removeNode + insertNode.
________________________________________
11.8. Итог
•	tree.tsx = «лицо» дерева (UI).
•	treeOps.ts = «мозг» дерева (операции).
•	Взаимодействие построено на иммутабельности и React state.
•	Такая схема позволяет расширению оставаться быстрым и устойчивым, даже при больших деревьях.
________________________________________
👉 Следующая глава логично будет про поиск и фильтрацию: как устроен search.ts, как быстро найти ссылку в большом дереве и как это связано с React.
 
Глава 12. Поиск и фильтрация закладок
________________________________________
12.1. Зачем нужен поиск?
Когда дерево маленькое (10–20 ссылок), легко кликать по папкам.
Но если узлов сотни, то:
•	найти нужный сайт вручную становится проблемой;
•	пользователю важно быстро отфильтровать результаты;
•	закладки могут повторяться в разных категориях.
Поэтому был создан модуль search.ts.
________________________________________
12.2. Как устроен поиск в Visual Bookmarks
Поиск работает локально в памяти (не через Chrome bookmarks API).
Алгоритм:
1.	Пользователь вводит текст в строку поиска.
2.	React-компонент получает событие onChange.
3.	Вызвается функция из search.ts, которая ищет по дереву.
4.	Возвращается список совпадений (узлы).
5.	UI подсвечивает найденные узлы или отображает список.
________________________________________
12.3. Интерфейс поиска
Обычно строка поиска находится в верхней части панели:
<input 
  type="text"
  placeholder="Поиск..."
  value={query}
  onChange={e => setQuery(e.target.value)}
/>
________________________________________
12.4. Реализация в search.ts
Пример функции поиска:
import { TreeNode } from "./models";

export function searchTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.toLowerCase();
  const results: TreeNode[] = [];

  function dfs(node: TreeNode) {
    if (node.title.toLowerCase().includes(q) || (node.url?.toLowerCase().includes(q))) {
      results.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        dfs(child);
      }
    }
  }

  for (const n of nodes) dfs(n);

  return results;
}
👉 Здесь используется DFS (обход в глубину) для поиска по всему дереву.
________________________________________
12.5. Типы поиска
Visual Bookmarks поддерживает несколько режимов:
•	По названию (title).
•	По URL (в том числе частичное совпадение).
•	(потенциально) По тегам — можно добавить расширение модели TreeNode.
________________________________________
12.6. Фильтрация
Вместо того чтобы просто выдавать список совпадений, можно «фильтровать» дерево:
•	оставить только ветви, где есть совпадения;
•	подсветить совпавшие узлы;
•	скрыть нерелевантные узлы.
Пример подхода:
export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.toLowerCase();

  return nodes
    .map(node => {
      if (node.title.toLowerCase().includes(q) || node.url?.toLowerCase().includes(q)) {
        return node;
      }
      if (node.children) {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}
👉 Таким образом, пользователь видит только релевантные ветви дерева.
________________________________________
12.7. Взаимодействие с React
1.	Пользователь вводит текст.
2.	Состояние query меняется.
3.	Компонент Tree получает либо:
o	полный список (nodes),
o	либо отфильтрованный (filterTree(nodes, query)).
4.	Отображение мгновенно обновляется.
________________________________________
12.8. Производительность
•	Для деревьев до ~10 000 узлов поиск работает мгновенно.
•	Чтобы избежать лишних пересчётов, используют useMemo:
const results = useMemo(
  () => filterTree(nodes, query),
  [nodes, query]
);
________________________________________
12.9. Возможные улучшения
•	Поддержка регулярных выражений.
•	Fuzzy search (нечёткий поиск, например, через fuse.js).
•	Индексация (например, построение списка всех узлов заранее для быстрого поиска).
________________________________________
12.10. Итог
•	Поиск реализован в модуле search.ts.
•	Основная идея: рекурсивный обход дерева и фильтрация по title и url.
•	В UI поиск интегрирован в tree.tsx через query и useMemo.
•	Возможности расширяются — можно добавить fuzzy search и теги.
________________________________________
👉 Следующая глава логично будет про контекстное меню и команды, т.е. как расширение встраивается в меню Chrome и какие действия доступны пользователю.
 
Глава 13. Контекстное меню и команды
________________________________________
13.1. Зачем нужно контекстное меню?
Visual Bookmarks интегрируется не только как панель, но и через правый клик в Chrome:
•	Добавить выделенные вкладки в дерево.
•	Скопировать ссылку.
•	Переместить в категорию.
•	Открыть закладки из выбранной группы.
Это делает расширение «под рукой», без необходимости открывать его UI.
________________________________________
13.2. Chrome API для меню
Работает через chrome.contextMenus.
Манифест (manifest.json) обязательно должен содержать:
"permissions": ["contextMenus", "tabs"]
________________________________________
13.3. Создание меню в background.ts
При инициализации расширения background.ts регистрирует пункты меню:
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-selected-tabs",
    title: "Добавить выделенные вкладки",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "add-current-tab",
    title: "Добавить текущую вкладку",
    contexts: ["page"]
  });
});
👉 id нужен для того, чтобы понять, какой пункт был выбран.
________________________________________
13.4. Обработка клика по меню
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "add-selected-tabs":
      const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
      sendTabsToPanel(tabs);
      break;

    case "add-current-tab":
      if (tab) sendTabsToPanel([tab]);
      break;
  }
});
Здесь sendTabsToPanel — вспомогательная функция, которая упаковывает вкладки в сообщение и передаёт их в панель.
________________________________________
13.5. Команды (горячие клавиши)
Chrome позволяет назначать шорткаты (например, Ctrl+Shift+Y).
В manifest.json:
"commands": {
  "open-visual-bookmarks": {
    "suggested_key": {
      "default": "Ctrl+Shift+Y"
    },
    "description": "Открыть панель Visual Bookmarks"
  }
}
В background.ts:
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-visual-bookmarks") {
    openPanel();
  }
});
________________________________________
13.6. Взаимодействие с деревом
Контекстное меню = точка входа:
1.	Пользователь кликает «Добавить выделенные вкладки».
2.	background.ts собирает вкладки.
3.	Отправляет их в панель (chrome.runtime.sendMessage).
4.	Панель (App.tsx → tree.tsx) добавляет их в выбранный узел дерева.
________________________________________
13.7. Проблемы и решения
1.	Дублирование пунктов
o	Если перезапускать расширение и снова создавать меню, пункты могут накопиться.
o	Решение: перед create всегда делать chrome.contextMenus.removeAll().
2.	Неправильные контексты
o	Например, меню «Добавить вкладку» показывается на пустой странице.
o	Решение: задавать contexts: ["page", "link"] вместо ["all"].
3.	Разрыв связи с панелью
o	Если панель закрыта, сообщения теряются.
o	Решение: реализовать буфер сообщений в background.ts, чтобы панель получала их при следующем открытии.
________________________________________
13.8. Итог
•	Контекстное меню создаётся через chrome.contextMenus.
•	Обработчики кликов реализованы в background.ts.
•	Горячие клавиши добавляются через chrome.commands.
•	Меню и команды связаны с деревом через систему сообщений.
•	Для стабильности важно использовать removeAll, буфер сообщений и проверку контекстов.
________________________________________
👉 Логично продолжить Главой 14: Хранение данных и офлайн-режим (sqlStorage.ts) — там мы разберём, как всё это сохраняется, чтобы закладки не потерялись после перезапуска браузера.
Глава 14. Хранение данных и офлайн-режим (sqlStorage.ts)
________________________________________
14.1. Зачем нужно хранение данных?
Visual Bookmarks оперирует деревом закладок, которое:
•	пользователь вручную формирует и изменяет;
•	должно сохраняться между сессиями;
•	не должно теряться при закрытии браузера;
•	должно быть доступно офлайн.
👉 Хранение — это фундамент, без него панель была бы одноразовым списком.
________________________________________
14.2. Какие есть варианты хранения в Chrome Extensions
Chrome даёт несколько API:
1.	chrome.storage.local — встроенное key-value хранилище.
o	Плюс: синхронизация с браузером.
o	Минус: ограниченные возможности поиска и фильтрации.
2.	IndexedDB — полноценная база внутри браузера.
o	Асинхронная, работает по транзакциям.
o	Плюс: подходит для сложных структур (например, дерево).
3.	localStorage — синхронное, но простое key-value.
o	Не подходит для больших данных.
В нашем случае выбран IndexedDB, обёрнутый в модуль sqlStorage.ts.
________________________________________
14.3. Роль sqlStorage.ts
Файл sqlStorage.ts — это прослойка между кодом расширения и IndexedDB.
Задачи:
•	создать БД при первом запуске;
•	хранить дерево узлов (TreeNode);
•	уметь сохранять/читать отдельные ветви;
•	обновлять данные без потери структуры.
________________________________________
14.4. Структура данных
Модель из models.ts:
export interface TreeNode {
  id: string;
  title: string;
  url?: string;
  children?: TreeNode[];
}
👉 В IndexedDB дерево хранится сериализованным (JSON).
________________________________________
14.5. Пример кода в sqlStorage.ts
Упрощённый вариант:
const DB_NAME = "visualBookmarks";
const STORE_NAME = "trees";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTree(tree: TreeNode) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(tree);
  return tx.complete;
}

export async function loadTree(id: string): Promise<TreeNode | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
________________________________________
14.6. Взаимодействие с UI
1.	При старте панели (App.tsx):
o	вызывается loadTree("root");
o	дерево восстанавливается.
2.	При изменении дерева (treeOps.ts):
o	после каждой операции (add, move, delete) → saveTree(updatedTree).
Таким образом, UI ↔ sqlStorage.ts ↔ IndexedDB работает как цикл.
________________________________________
14.7. Работа офлайн
Особенность IndexedDB — данные живут в профиле браузера.
Даже без интернета:
•	пользователь может открывать и редактировать дерево;
•	все изменения сохраняются локально;
•	при следующем запуске панель продолжает с того же места.
Это и есть офлайн-режим Visual Bookmarks.
________________________________________
14.8. Возможные расширения
•	Синхронизация через chrome.storage.sync → доступ на разных устройствах.
•	Экспорт/импорт дерева в JSON (резервное копирование).
•	Версионирование дерева (undo/redo).
________________________________________
14.9. Итог
•	Хранение реализовано через IndexedDB, обёрнутую в sqlStorage.ts.
•	Дерево сериализуется и хранится как объект.
•	Панель всегда работает офлайн.
•	Любое действие с деревом отражается в БД.
________________________________________
👉 Логично, что дальше пойдёт Глава 15: Открытие ссылок и работа с группами вкладок (chrome.tabGroups) — ведь хранить закладки мало, нужно уметь их правильно открывать в браузере.
Глава 15. Открытие ссылок и работа с группами вкладок (chrome.tabGroups)
________________________________________
15.1. Задача
Visual Bookmarks хранит дерево ссылок. Но пользователь ждёт, что:
•	клик по узлу откроет ссылку;
•	при массовом открытии несколько вкладок сгруппируются;
•	открытые закладки не потеряются в хаосе вкладок.
👉 Для этого используется API chrome.tabs и chrome.tabGroups.
________________________________________
15.2. Основные API
1.	chrome.tabs.create — открывает новую вкладку.
2.	chrome.tabs.update — изменяет существующую вкладку.
3.	chrome.tabs.group — объединяет вкладки в группу.
4.	chrome.tabGroups.update — меняет заголовок и цвет группы.
________________________________________
15.3. Пример: открыть одну закладку
function openTab(url: string) {
  chrome.tabs.create({ url });
}
👉 Вызовется, если кликнуть по узлу с url.
________________________________________
15.4. Пример: открыть список закладок в группе
async function openTabsInGroup(urls: string[], groupTitle: string) {
  // 1. Создаём вкладки
  const tabIds: number[] = [];
  for (const url of urls) {
    const tab = await chrome.tabs.create({ url });
    tabIds.push(tab.id!);
  }

  // 2. Группируем их
  const groupId = await chrome.tabs.group({ tabIds });

  // 3. Декорируем группу
  await chrome.tabGroups.update(groupId, {
    title: groupTitle,
    color: "blue"
  });
}
________________________________________
15.5. Интеграция с деревом
В treeOps.ts или App.tsx есть вызовы вроде:
if (node.url) {
  openTab(node.url);
} else if (node.children) {
  const urls = node.children.map(c => c.url).filter(Boolean) as string[];
  openTabsInGroup(urls, node.title);
}
👉 Таким образом:
•	если узел = ссылка → открывается вкладка;
•	если узел = категория → открываются все дети в группе.
________________________________________
15.6. Особенности Chrome Tab Groups
•	Группа может быть свёрнутой или развёрнутой.
•	Цвета фиксированы: "blue" | "red" | "yellow" | "green" | "pink" | "purple" | "cyan" | "grey".
•	Заголовок лучше брать из имени узла дерева.
________________________________________
15.7. Возможные проблемы
1.	Слишком много вкладок
o	Chrome ограничивает открытие сотен вкладок за раз.
o	Решение: открывать пачками (например, по 10–20), с задержкой.
2.	Потеря порядка
o	Вкладки открываются асинхронно, могут перемешаться.
o	Решение: использовать последовательное создание await chrome.tabs.create().
3.	Группы исчезают при перезапуске Chrome
o	Это ограничение самого браузера.
o	Решение: хранить «виртуальные группы» в дереве (что уже делает Visual Bookmarks).
________________________________________
15.8. Как это работает у нас
1.	Пользователь кликает «Открыть узел».
2.	App.tsx или treeOps.ts проверяет, ссылка это или папка.
3.	Если ссылка → chrome.tabs.create.
4.	Если папка → chrome.tabs.group + chrome.tabGroups.update.
5.	Пользователь получает удобный результат: все ссылки вместе, под названием папки.
________________________________________
15.9. Итог
•	Открытие закладок реализовано через chrome.tabs.
•	Группировка — через chrome.tabGroups.
•	Логика: узел = ссылка → вкладка, узел = категория → группа вкладок.
•	Это превращает дерево Visual Bookmarks в настоящий инструмент навигации по множеству ссылок.
________________________________________
👉 Логично продолжить Главой 16: Темы и оформление панели — как меняется внешний вид (тёмная/светлая тема), и что для этого используется в коде.
Глава 16. Темы и оформление панели
________________________________________
16.1. Зачем нужны темы?
Visual Bookmarks — это не просто список ссылок, а инструмент для ежедневной работы. Пользователь может открыть его десятки раз в день.
Если интерфейс неудобный или режет глаза:
•	пользователь быстрее устанет;
•	снижается продуктивность;
•	появляются жалобы вида «всё слишком ярко» или «слишком блекло».
👉 Поэтому тема (тёмная/светлая, кастомная) — часть UX, а не «косметика».
________________________________________
16.2. Где управляется тема
В расширении тема применяется в панели закладок (React-компоненты).
•	Файл: App.tsx — там хранится состояние темы (например, light или dark).
•	Файл: tree.tsx — подстраивается под тему (цвет текста, фона, выделения).
•	CSS / Tailwind / styled-components — применяются классы оформления.
________________________________________
16.3. Как работает переключение
1.	В панели настроек или верхней панели есть кнопка «Тема».
2.	При клике вызывается setTheme("dark") или setTheme("light").
3.	Тема сохраняется в chrome.storage.local.
4.	При следующем открытии расширения состояние подтягивается и применяется.
________________________________________
16.4. Пример кода
В App.tsx:
const [theme, setTheme] = useState<"light" | "dark">("light");

useEffect(() => {
  chrome.storage.local.get("theme", (data) => {
    if (data.theme) setTheme(data.theme);
  });
}, []);

function toggleTheme() {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  chrome.storage.local.set({ theme: newTheme });
}
В JSX:
<div className={`app-container ${theme}`}>
  <button onClick={toggleTheme}>
    {theme === "light" ? "🌙 Тёмная" : "☀️ Светлая"}
  </button>
  <Tree />
</div>
В CSS:
.app-container.light {
  --bg-color: #ffffff;
  --text-color: #000000;
}

.app-container.dark {
  --bg-color: #1e1e1e;
  --text-color: #f0f0f0;
}

.app-container {
  background-color: var(--bg-color);
  color: var(--text-color);
}
________________________________________
16.5. Возможные расширения
•	Поддержка системной темы (браузер может отдавать prefers-color-scheme).
•	Возможность кастомизации: выбор цвета групп, фона, шрифта.
•	Темы для дерева отдельно (например, «ночная карта»).
________________________________________
16.6. Интеграция с деревом
Так как дерево (tree.tsx) рендерится рекурсивно, стиль применяется через корневой контейнер.
👉 То есть достаточно переключить класс на <div className="app-container dark">, и все вложенные узлы автоматически изменят оформление.
________________________________________
16.7. Итог
•	Тема управляется через App.tsx.
•	Данные темы хранятся в chrome.storage.local.
•	CSS переменные делают переключение простым и гибким.
•	Пользователь получает привычный выбор: светлый или тёмный интерфейс.
________________________________________
👉 Логично дальше перейти к Главе 17: Обработка ошибок и надёжность — ведь мы уже знаем про хранение, группы вкладок и темы, но не обсудили, как расширение защищается от сбоев (например, при падении API или повреждении дерева).
Глава 17. Обработка ошибок и надёжность
________________________________________
17.1. Зачем это нужно?
Visual Bookmarks опирается на:
•	Chrome API (tabs, storage, tabGroups);
•	React (рендеринг UI);
•	TypeScript (строгая типизация).
Но в реальном мире всегда случаются сбои:
•	вкладка может закрыться раньше, чем мы её обновим;
•	в хранилище может оказаться повреждённый JSON;
•	при копировании закладок — попасть пустой буфер;
•	пользователь может кликнуть 10 раз подряд.
👉 Если не ловить такие ошибки — расширение будет падать, терять данные, а пользователь злиться.
________________________________________
17.2. Общие подходы
1.	try/catch вокруг вызовов API
o	chrome.* часто выбрасывает lastError.
o	Надо проверять его после каждого вызова.
2.	chrome.tabs.create({ url }, tab => {
3.	  if (chrome.runtime.lastError) {
4.	    console.error("Ошибка открытия вкладки:", chrome.runtime.lastError.message);
5.	  }
6.	});
7.	Валидация данных перед использованием
o	При добавлении закладок проверять, что url строка, а не undefined.
o	При рендеринге — что title не пустой.
8.	Дефолты по умолчанию
o	Если тема не найдена → выставить "light".
o	Если дерево пустое → показать сообщение «Нет закладок».
________________________________________
17.3. Ошибки в React-компонентах
React позволяет использовать Error Boundaries.
Это компоненты-«ловушки», которые перехватывают ошибки в рендеринге.
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Ошибка в компоненте:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h3>Что-то пошло не так</h3>;
    }
    return this.props.children;
  }
}
Использование:
<ErrorBoundary>
  <Tree />
</ErrorBoundary>
________________________________________
17.4. Ошибки при работе с буфером вкладок
Ранее мы обсуждали, что при копировании могли сохраняться старые вкладки.
Чтобы это предотвратить:
•	каждый пакет маркируется batchId;
•	дубликаты отбрасываются;
•	если tabs пустой массив — буфер не обновляется.
👉 Это пример защиты «от странного поведения».
________________________________________
17.5. Обработка сетевых ошибок
Хотя расширение в основном офлайн, есть части, где может быть сеть:
•	синхронизация через Chrome Sync;
•	загрузка иконок сайтов (favicons).
Здесь важно:
•	повторять запросы (retry);
•	использовать таймауты;
•	иметь fallback (например, дефолтную иконку).
________________________________________
17.6. Надёжность хранения
Файл sqlStorage.ts реализует хранилище:
•	данные сериализуются в JSON;
•	сохраняются в chrome.storage.local;
•	при ошибках чтения возвращаются пустые структуры.
👉 Таким образом, даже если хранилище повредится — расширение стартует, просто без дерева (а не упадёт).
________________________________________
17.7. UX-защита
1.	Двойные клики → добавляют только одну копию закладки.
2.	Большие вставки → обрабатываются пачками, чтобы UI не завис.
3.	Ошибки API → показываются в console.error, но не ломают интерфейс.
________________________________________
17.8. Итог
•	Ошибки перехватываются на уровне API (lastError) и UI (Error Boundaries).
•	Буфер вкладок защищён от дубликатов с помощью batchId.
•	Дефолты и валидация данных предотвращают пустые или повреждённые структуры.
•	Пользователь получает стабильное расширение, которое не падает от любой мелочи.
________________________________________
👉 Следующая глава логична — Глава 18: Производительность и оптимизация.
В ней можно разобрать, как React-компоненты дерева оптимизируются при тысячах закладок, и как избежать «лагов» в браузере.
 
Глава 18. Производительность и оптимизация
________________________________________
18.1. Почему это важно?
Visual Bookmarks работает с:
•	десятками/сотнями узлов в дереве;
•	множеством сообщений между background.ts и App.tsx;
•	частыми действиями пользователя (добавить/переместить/удалить).
Без оптимизаций:
•	интерфейс начнёт лагать;
•	память будет утекать;
•	при копировании сотни вкладок React может «замёрзнуть».
________________________________________
18.2. Оптимизация в React
1.	Мемоизация компонентов
o	Использование React.memo для узлов дерева.
o	Если узел не изменился → он не перерисовывается.
2.	const TreeNode = React.memo(function TreeNode({ node }: { node: TreeItem }) {
3.	  return <div>{node.title}</div>;
4.	});
5.	useCallback / useMemo
o	Хендлеры событий (onClick, onDrop) не создаются заново при каждом рендере.
6.	const handleClick = useCallback(() => {
7.	  selectNode(node.id);
8.	}, [node.id]);
9.	Ленивая загрузка (lazy rendering)
o	Узлы дерева рендерятся только при развороте.
o	Это особенно важно при глубокой иерархии.
10.	{expanded && node.children?.map(child => <TreeNode key={child.id} node={child} />)}
________________________________________
18.3. Работа с большими данными
1.	Виртуализация списка
o	Если закладок тысячи, нужно отрисовывать только видимые.
o	Используется react-window или react-virtualized.
2.	import { FixedSizeList as List } from "react-window";
3.	
4.	<List
5.	  height={600}
6.	  itemCount={nodes.length}
7.	  itemSize={32}
8.	  width={400}
9.	>
10.	  {({ index, style }) => <TreeNode node={nodes[index]} style={style} />}
11.	</List>
12.	Чанкинг операций
o	Если вставить 500 вкладок сразу → UI замрёт.
o	Решение: использовать requestIdleCallback или setTimeout для пачек.
13.	function addTabsInChunks(tabs: SimpleTab[]) {
14.	  let i = 0;
15.	  function chunk() {
16.	    const part = tabs.slice(i, i + 50);
17.	    setInbox(prev => [...prev, ...part]);
18.	    i += 50;
19.	    if (i < tabs.length) setTimeout(chunk, 10);
20.	  }
21.	  chunk();
22.	}
________________________________________
18.4. Оптимизация хранилища
1.	Дебаунс сохранений
o	Не писать в chrome.storage на каждый клик.
o	Вместо этого — каждые 500 мс при изменениях.
2.	let saveTimer: any = null;
3.	function saveDataDebounced(data: any) {
4.	  clearTimeout(saveTimer);
5.	  saveTimer = setTimeout(() => {
6.	    chrome.storage.local.set({ tree: data });
7.	  }, 500);
8.	}
9.	Сжатие данных
o	Большие деревья можно хранить в сжатом виде (например, LZ-string).
________________________________________
18.5. Производительность сообщений
•	Сообщения из background.ts в App.tsx должны быть батчированными.
•	Вместо десятков chrome.runtime.sendMessage — одно сообщение с массивом.
👉 Мы уже обсуждали это при исправлении бага с буфером вкладок.
________________________________________
18.6. Проверка и профилирование
1.	Chrome Performance Tools
o	вкладка Performance → смотреть «узкие места».
2.	React Profiler
o	показывает, какие компоненты перерисовываются лишний раз.
3.	Логирование batchId
o	помогает понять, не повторяются ли пакеты вкладок.
________________________________________
18.7. Итог
•	Оптимизация в React = мемоизация + виртуализация.
•	Большие данные вставляются пачками.
•	Запись в хранилище — дебаунс.
•	Сообщения батчируются.
•	Профилирование помогает увидеть слабые места.
📌 Благодаря этому Visual Bookmarks не тормозит даже при тысячах закладок.
________________________________________
👉 Логичное продолжение: Глава 19. Безопасность и разрешения.
Там можно разобрать, как расширение работает с manifest.json, какие права оно запрашивает, и как избежать утечек данных.
Глава 19. Безопасность и разрешения
________________________________________
19.1. Почему это важно?
Браузерные расширения работают внутри пользовательской среды:
•	имеют доступ к вкладкам, истории, файлам;
•	могут взаимодействовать с сетью;
•	могут хранить приватные данные (закладки, пароли, заметки).
⚠️ Если не ограничить права — расширение станет потенциальной дырой в безопасности.
👉 Поэтому Chrome требует явно указывать permissions в manifest.json.
________________________________________
19.2. Manifest и права
В manifest.json расширения Visual Bookmarks указываются такие права:
{
  "permissions": [
    "tabs",
    "tabGroups",
    "storage",
    "contextMenus"
  ]
}
•	tabs — доступ к списку вкладок (чтобы их добавлять в дерево).
•	tabGroups — работа с группами вкладок Chrome.
•	storage — хранение данных локально и в синхронизации.
•	contextMenus — добавление пункта «Добавить выделенные вкладки».
❗ Заметь: тут нет избыточных прав вроде history, bookmarks или webRequest, потому что они не нужны.
________________________________________
19.3. Минимизация прав
Лучший принцип: минимально необходимые права.
Например:
•	вместо tabs можно иногда использовать activeTab (только текущая вкладка), но здесь нужно именно tabs, так как копируются несколько выделенных вкладок.
•	storage используется только для локального офлайн-хранилища → это безопаснее, чем писать в облако.
________________________________________
19.4. Контекстное меню и безопасность
При добавлении пункта меню:
chrome.contextMenus.create({
  id: "vb-add-selected-tabs",
  title: "Добавить выделенные вкладки",
  contexts: ["all"]
});
•	оно работает только в Chrome, а не на сторонних сайтах;
•	пункт не может «подменить» поведение сайтов (например, блокировать правый клик).
________________________________________
19.5. Изоляция кода
Visual Bookmarks имеет разделение:
•	background.ts — фоновая логика (невидима пользователю, доступ к API).
•	App.tsx — UI на React (рендерится в панели).
•	content scripts — в данном проекте отсутствуют (!), и это повышает безопасность, потому что код не внедряется в чужие сайты.
👉 Таким образом, расширение не имеет доступа к содержимому страниц — только к самим вкладкам.
________________________________________
19.6. Безопасность хранения
•	Данные закладок сохраняются через chrome.storage.local.
•	Всё хранится только на устройстве пользователя.
•	Если включена синхронизация Chrome → данные уходят в Google Sync, но это уже инфраструктура Google.
⚠️ Важно: расширение не делает сетевых запросов. Это значит:
•	нет утечки на сторонние сервера;
•	приватность выше, чем у «онлайн-букмаркеров».
________________________________________
19.7. Проверка и аудит
1.	Chrome Web Store при публикации проверяет:
o	manifest на избыточные права;
o	наличие вредоносных скриптов;
o	попытки трекинга.
2.	Разработчик может сам сделать аудит:
o	поиск по коду fetch, XMLHttpRequest (есть ли сеть?);
o	поиск по коду eval, Function (опасные вызовы).
________________________________________
19.8. Итог
•	Расширение работает только с вкладками и деревом → права минимальные.
•	Нет доступа к содержимому страниц → безопаснее.
•	Все данные хранятся локально → приватность выше.
•	Безопасность обеспечивается на уровне Chrome API и строгого manifest.json.
📌 В результате Visual Bookmarks можно использовать без страха, что оно «шпионит» за пользователем.
________________________________________
👉 Следующая глава логична — Глава 20. Сборка и публикация расширения.
Там можно расписать, как из папки extension собрать готовый .zip и загрузить в Chrome Web Store.
Глава 20. Сборка и публикация расширения
________________________________________
20.1. Подготовка
Наш проект живёт в папке extension, где находятся:
•	manifest.json — паспорт расширения;
•	vite.config.ts, tsconfig.json, package.json — настройки сборки;
•	src/ — исходники (background.ts, App.tsx, tree.tsx, и т. д.);
•	public/ — иконки, html-шаблоны, статические ресурсы.
Чтобы собрать расширение, нужно:
1.	Установить зависимости (npm install).
2.	Убедиться, что код компилируется (npm run build).
3.	Получить папку dist/ с собранным расширением.
________________________________________
20.2. Сборка через Vite
В package.json обычно есть скрипты:
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint . --ext .ts,.tsx"
}
Запуск сборки:
cd extension
npm run build
После этого появится папка dist/.
В ней будут:
•	manifest.json (перенесённый Vite);
•	скомпилированные JS/TS файлы;
•	html для панели расширения;
•	статические ресурсы.
________________________________________
20.3. Тестирование локально
Прежде чем публиковать, проверим:
1.	Открыть Chrome → chrome://extensions/.
2.	Включить Режим разработчика.
3.	Нажать «Загрузить распакованное расширение».
4.	Указать путь к папке dist/.
Теперь расширение появится в панели.
⚠️ Важно: проверяем все сценарии — копирование вкладок, работу дерева, контекстное меню.
________________________________________
20.4. Упаковка в .zip
Google Web Store требует архив:
1.	Переходим в dist/.
2.	Архивируем содержимое (а не папку целиком).
Пример для PowerShell (Windows 10):
cd dist
Compress-Archive * ../visual-bookmarks.zip
________________________________________
20.5. Публикация в Chrome Web Store
1.	Переходим на Chrome Web Store Developer Dashboard.
2.	Создаём проект.
3.	Загружаем visual-bookmarks.zip.
4.	Заполняем:
o	Название (например, Visual Bookmarks — древовидные закладки).
o	Описание (краткое и полное).
o	Скриншоты (панель, контекстное меню, настройки).
o	Иконки (128x128 и др.).
5.	Указываем permissions (Chrome сам покажет список из manifest.json).
6.	Оплачиваем разовую регистрацию (5$).
7.	Отправляем на модерацию.
________________________________________
20.6. Советы для успешной публикации
•	Минимальные права — не использовать лишних (history, bookmarks, webRequest).
•	Прозрачность — в описании честно указать, что расширение хранит всё локально.
•	Скриншоты — должны быть ясными: показать дерево, добавление вкладок, поиск.
•	Иконка — должна быть узнаваемой, иначе расширение потеряется.
•	Тесты — прогнать чек-лист (работа дерева, поиск, копирование, контекстное меню, офлайн).
________________________________________
20.7. Автоматизация (бонус)
Можно настроить CI/CD:
•	GitHub Actions → при пуше в main запускать npm run build;
•	автоматически собирать zip и заливать на Web Store через API (есть chrome-webstore-upload).
Пример фрагмента CI:
- name: Build
  run: npm run build

- name: Package
  run: zip -r visual-bookmarks.zip dist/*

- name: Upload to Chrome Web Store
  uses: Klemensas/chrome-extension-upload-action@v1
  with:
    client-id: ${{ secrets.CHROME_CLIENT_ID }}
    client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
    refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
    file: ./visual-bookmarks.zip
    extension-id: your-extension-id
________________________________________
20.8. Итог
•	Собираем через npm run build → получаем dist/.
•	Тестируем в chrome://extensions.
•	Упаковываем в .zip и загружаем в Web Store.
•	Для профи — настраиваем автоматическую публикацию через CI/CD.
📌 Теперь расширение готово к использованию не только у разработчика, но и у тысяч пользователей.
________________________________________
👉 Логичное продолжение: Глава 21. Поддержка и обновления — как выпускать новые версии, что делать при изменении Chrome API, и как обрабатывать обратную связь пользователей.
Глава 21. Поддержка и обновления
________________________________________
21.1. Почему поддержка так важна
Расширение — это не «сделал и забыл». После публикации начинаются:
•	отзывы пользователей;
•	баги, которые проявляются только «в бою»;
•	изменения в API Chrome;
•	новые версии Node.js, React, TypeScript.
⚠️ Без поддержки даже отличное расширение быстро устареет.
________________________________________
21.2. Версионирование
В manifest.json есть поле:
"version": "1.2.0"
Рекомендуется использовать семантическое версионирование (semver):
•	1.2.0
o	1 — major (большие изменения, несовместимость);
o	2 — minor (новые функции, совместимость сохраняется);
o	0 — patch (исправления багов).
Пример:
•	1.2.0 → 1.2.1 — исправили баг с копированием вкладок.
•	1.2.0 → 1.3.0 — добавили поиск по закладкам.
•	1.2.0 → 2.0.0 — полностью переписали логику хранения.
________________________________________
21.3. Обновления в Chrome Web Store
1.	Собираем новую версию (npm run build).
2.	Архивируем dist/ → visual-bookmarks-1.3.0.zip.
3.	Загружаем через Dev Console.
4.	Указываем новую версию в manifest.json.
5.	Пишем changelog (список изменений).
После публикации Chrome сам обновит расширение у пользователей.
________________________________________
21.4. Обратная связь от пользователей
•	Отзывы в Web Store — первое место, где появляются жалобы.
•	GitHub Issues (если проект открыт) — удобный способ собирать баги.
•	Email или Telegram-канал — для быстрой поддержки.
👉 Совет: делить обращения на категории:
•	баги;
•	новые функции;
•	вопросы по использованию.
________________________________________
21.5. Тестирование при обновлениях
Чтобы не «сломать» рабочее расширение, нужно:
1.	Запустить npm run dev и протестировать на локальной установке.
2.	Проверить чек-лист:
o	открытие панели;
o	добавление вкладок;
o	копирование;
o	поиск;
o	контекстное меню.
3.	Прогнать расширение в «чистой» сборке Chrome (без других расширений).
________________________________________
21.6. Совместимость с Chrome API
Google иногда меняет API. Примеры:
•	переход от Manifest v2 → v3 (фоновые страницы заменили на service workers);
•	ограничения по remote code (запрещён eval и загрузка скриптов с сети).
⚠️ Нужно следить за changelog Google Chrome и заранее адаптировать код.
________________________________________
21.7. Автоматизация релизов
Чтобы не делать всё руками:
•	GitHub Actions или GitLab CI/CD — собирают проект автоматически.
•	Сборка создаёт zip → выкладывает в релиз.
•	Можно подключить auto-upload в Chrome Web Store (через API).
Преимущества:
•	меньше ошибок вручную;
•	одинаковый процесс для каждой версии.
________________________________________
21.8. Поддержка кода
Для долгосрочной поддержки важно:
•	держать код в Git (ветки: main, dev, feature/*);
•	писать комментарии и документацию;
•	обновлять зависимости (npm outdated → npm update).
________________________________________
21.9. Планирование будущих функций
Хорошая практика — roadmap:
•	📌 «Ближайшие баги» (исправления).
•	📌 «Новые функции» (например, экспорт/импорт закладок, тёмная тема).
•	📌 «Долгосрочно» (переписка на Manifest V3).
________________________________________
21.10. Итог
Поддержка расширения включает:
•	обновления версии и публикацию в Web Store;
•	обратную связь и работу с пользователями;
•	тестирование каждой новой версии;
•	отслеживание изменений Chrome API;
•	организацию кода и автоматизацию релизов.
📌 Расширение Visual Bookmarks сможет развиваться годами, если подходить к поддержке как к живому проекту, а не как к «одноразовому коду».
 
Часть III. Практические кейсы:
•	добавление новых функций;
•	отладка ошибок;
•	адаптация под Manifest V3;
•	кастомизация под конкретного пользователя.
Глава 22. Добавление новой функции — экспорт/импорт закладок
________________________________________
22.1. Зачем нужен экспорт/импорт
Пользователи хотят:
•	📤 Сохранить дерево закладок в файл, чтобы сделать резервную копию.
•	📥 Перенести закладки на другой компьютер.
•	🔄 Поделиться деревом закладок с коллегой или другом.
Формат хранения обычно простой:
•	JSON (удобен для обмена и чтения);
•	CSV (менее гибкий, подходит для таблиц);
•	HTML (совместим со стандартными «закладками браузера»).
👉 В нашем случае выберем JSON как основной формат.
________________________________________
22.2. Что нужно реализовать
1.	В панели расширения (App.tsx или tree.tsx) добавить кнопки:
o	«Экспорт закладок»;
o	«Импорт закладок».
2.	Экспорт:
o	прочитать текущее дерево (treeOps.ts / хранилище sqlStorage);
o	превратить в JSON;
o	сохранить в файл через chrome.downloads.
3.	Импорт:
o	выбрать файл (<input type="file" />);
o	считать содержимое (FileReader API);
o	распарсить JSON;
o	добавить узлы в дерево (через treeOps.ts).
________________________________________
22.3. Экспорт
Пример функции экспорта:
import { getAllNodes } from './treeOps';

export async function exportBookmarks() {
  const data = await getAllNodes(); // возвращает всё дерево закладок
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename: 'visual-bookmarks.json',
    saveAs: true
  });
}
________________________________________
22.4. Импорт
Форма для выбора файла (в App.tsx):
<input
  type="file"
  accept="application/json"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await importBookmarks(data);
      alert("Закладки успешно импортированы!");
    } catch (err) {
      alert("Ошибка: файл повреждён или не является JSON");
    }
  }}
/>
Логика импорта (в treeOps.ts):
import { addNode } from './treeOps';
import { SimpleTab } from './models';

export async function importBookmarks(data: any) {
  if (!Array.isArray(data)) {
    throw new Error("Неверный формат файла");
  }

  for (const item of data) {
    if (item.title && item.url) {
      await addNode({
        title: item.title,
        url: item.url,
        children: item.children || []
      } as SimpleTab);
    }
  }
}
________________________________________
22.5. Встраивание в интерфейс
Добавим кнопки в панель (App.tsx):
<div className="toolbar">
  <button onClick={exportBookmarks}>Экспорт</button>
  <label>
    Импорт
    <input
      type="file"
      accept="application/json"
      style={{ display: "none" }}
      onChange={handleImport}
    />
  </label>
</div>
________________________________________
22.6. Что хранить в JSON
Пример файла visual-bookmarks.json:
[
  {
    "title": "Разработка",
    "url": null,
    "children": [
      {
        "title": "StackOverflow",
        "url": "https://stackoverflow.com"
      },
      {
        "title": "MDN Docs",
        "url": "https://developer.mozilla.org"
      }
    ]
  },
  {
    "title": "Новости",
    "url": null,
    "children": [
      {
        "title": "BBC",
        "url": "https://bbc.com"
      }
    ]
  }
]
•	title — название узла;
•	url — ссылка (если есть, null для папки);
•	children — вложенные элементы.
________________________________________
22.7. Подводные камни
1.	Дубликаты: при импорте могут появляться одинаковые закладки → нужно проверять по url.
2.	Глубокие деревья: важно поддерживать вложенность, а не плоский список.
3.	Версионность: можно добавить поле "version": 1 в JSON, чтобы потом расширять формат.
4.	Ограничения Chrome: большие JSON-файлы (>5 МБ) могут тормозить.
________________________________________
22.8. Улучшения
•	Экспорт/импорт части дерева (например, только одной папки).
•	Поддержка формата HTML (как у браузера) для совместимости.
•	Автоматическое резервное копирование (например, раз в неделю сохранять JSON в chrome.storage.local).
________________________________________
22.9. Итог
Мы добавили в Visual Bookmarks:
•	экспорт закладок в JSON;
•	импорт из JSON;
•	простые кнопки в интерфейсе.
Теперь пользователь может:
•	переносить дерево между устройствами;
•	восстанавливать его после сбоя;
•	делиться закладками.
Глава 23. Адаптация под Manifest V3
________________________________________
23.1. Что такое Manifest V3
Manifest.json — это «паспорт» расширения. Он описывает:
•	какие скрипты подключать;
•	какие права нужны;
•	какие страницы использовать;
•	какие API доступны.
🔑 Google ввёл Manifest V3 (MV3), чтобы:
•	повысить безопасность (нет динамического кода);
•	снизить нагрузку на браузер (service workers вместо фоновых страниц);
•	улучшить управление разрешениями.
👉 Для нас это значит, что придётся поменять часть архитектуры.
________________________________________
23.2. Основные отличия MV2 → MV3
Было (Manifest V2)	Стало (Manifest V3)
background page (постоянная фоновая страница)	service worker (ленивый запуск, нет DOM)
"background": { "scripts": [...] }	"background": { "service_worker": "background.js" }
chrome.browserAction	chrome.action
chrome.runtime.onInstalled — без изменений	работает, но только в service worker
content_security_policy: script-src 'self' 'unsafe-eval'	запрещён eval, inline-скрипты, только self
хранение данных — без изменений	chrome.storage.* остался
сетевые запросы	запрещены внешние eval и динамические импорты
________________________________________
23.3. Изменения в нашем расширении
1. manifest.json
{
  "manifest_version": 3,
  "name": "Visual Bookmarks",
  "version": "2.0.0",
  "description": "Древовидные закладки для Chrome",
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": [
    "tabs",
    "storage",
    "contextMenus",
    "downloads",
    "tabGroups"
  ],
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "host_permissions": [
    "<all_urls>"
  ]
}
2. background.ts → background.js
•	теперь он запускается как service worker;
•	нельзя использовать window, document;
•	живёт только пока выполняет задачи.
Пример инициализации:
chrome.runtime.onInstalled.addListener(() => {
  console.log("Visual Bookmarks установлен!");
});

chrome.contextMenus.create({
  id: "add-selected-tabs",
  title: "Добавить выделенные вкладки",
  contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add-selected-tabs") {
    chrome.tabs.query({ highlighted: true, currentWindow: true }, (tabs) => {
      chrome.runtime.sendMessage({
        type: "VB_BUFFER_SELECTED_TABS",
        tabs: tabs.map(t => ({ title: t.title, url: t.url }))
      });
    });
  }
});
________________________________________
23.4. Хранение данных
Хорошая новость:
•	chrome.storage.local и chrome.storage.sync работают как раньше.
•	Наш sqlStorage.ts тоже остаётся без изменений (IndexedDB).
________________________________________
23.5. Контент-скрипты
Если в будущем нужно будет внедрять код на страницы (например, для захвата контента), то в MV3 это указывается так:
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }
]
⚠️ Inline-скрипты (<script>...) запрещены. Всё должно быть в отдельных .js-файлах.
________________________________________
23.6. React + Vite под MV3
Vite генерирует сборку в dist/.
Для MV3 нужно убедиться:
•	background.ts компилируется как service worker;
•	popup (App.tsx) компилируется в index.html + bundle.js.
В vite.config.ts:
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
        background: "src/background.ts"
      },
      output: {
        entryFileNames: chunk => chunk.name === "background" ? "background.js" : "[name].js"
      }
    }
  }
});
________________________________________
23.7. Потенциальные проблемы при миграции
1.	Нет постоянного background — нужно переписать часть логики.
o	Раньше можно было хранить данные в переменных → теперь только в storage.
o	Каждое событие (например, клик в меню) должно работать независимо.
2.	Нельзя использовать eval / Function → если TypeScript генерирует динамику, нужно отключить.
3.	Сообщения между popup и background:
o	остаётся chrome.runtime.sendMessage и onMessage.
o	но теперь иногда сервис-воркер может быть «спящим» → тогда сообщение его «будит».
________________________________________
23.8. План миграции для Visual Bookmarks
1.	Обновить manifest.json на manifest_version: 3.
2.	Переписать background.ts под сервис-воркер.
3.	Убрать все обращения к window/document из background.
4.	Перенести временные данные (например, буфер копирования вкладок) в chrome.storage.local.
5.	Проверить работу сообщений (onMessage, sendMessage).
6.	Протестировать в Chrome Canary (где MV3 работает лучше всего).
________________________________________
23.9. Итог
Переход на Manifest V3 требует:
•	изменения в manifest.json;
•	переписывания background.ts под сервис-воркер;
•	более строгой работы с данными (через storage);
•	адаптации сборки Vite.
📌 Но после адаптации Visual Bookmarks будет совместим с будущими версиями Chrome и останется в Web Store.
Глава 24. Кастомизация интерфейса
________________________________________
24.1. Зачем нужна кастомизация?
Не все пользователи одинаковы:
•	кто-то любит светлую тему, кто-то — тёмную;
•	одним удобно видеть дерево только на 2 уровня, другим — полностью развернутое;
•	одни хотят «минимализм», другие — больше деталей (иконки, подписи).
📌 Поэтому в интерфейсе расширения предусмотрены темы, уровни дерева и пользовательские настройки.
________________________________________
24.2. Тема оформления
В расширении применяются CSS-переменные и классы, чтобы легко переключать оформление.
Пример:
:root {
  --bg-color: white;
  --text-color: black;
}

[data-theme="dark"] {
  --bg-color: #1e1e1e;
  --text-color: #f1f1f1;
}
А в React:
function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
👉 Таким образом, переключатель темы работает мгновенно, без перезагрузки панели.
________________________________________
24.3. Настройка уровней дерева
Иногда дерево получается очень глубоким. Чтобы не «утонуть» в ветках, удобно ограничить глубину отображения.
Пример:
•	уровень 0 → только корневые категории;
•	уровень 1 → корни + первый уровень подпапок;
•	уровень 2 → разворачиваются все до второго уровня.
В tree.tsx это реализуется примерно так:
function Tree({ nodes, maxDepth }: { nodes: TreeNode[], maxDepth: number }) {
  function renderNode(node: TreeNode, depth: number) {
    if (depth > maxDepth) return null;
    return (
      <div style={{ marginLeft: depth * 12 }}>
        {node.title}
        {node.children?.map(c => renderNode(c, depth + 1))}
      </div>
    );
  }

  return <div>{nodes.map(n => renderNode(n, 0))}</div>;
}
Параметр maxDepth берётся из настроек пользователя.
________________________________________
24.4. Страница настроек
Chrome позволяет делать отдельную options page.
В manifest.json:
"options_page": "options.html"
В ней пользователь может выбрать:
•	тему оформления (светлая / тёмная);
•	глубину дерева;
•	поведение копирования вкладок (автоочистка буфера или нет).
Пример React-компонента:
function OptionsPage() {
  const [settings, setSettings] = useState({ theme: "light", depth: 2 });

  useEffect(() => {
    chrome.storage.local.get(["settings"], data => {
      if (data.settings) setSettings(data.settings);
    });
  }, []);

  function saveSettings(newSettings: typeof settings) {
    setSettings(newSettings);
    chrome.storage.local.set({ settings: newSettings });
  }

  return (
    <div>
      <h2>Настройки Visual Bookmarks</h2>

      <label>Тема:</label>
      <select
        value={settings.theme}
        onChange={e => saveSettings({ ...settings, theme: e.target.value })}
      >
        <option value="light">Светлая</option>
        <option value="dark">Тёмная</option>
      </select>

      <label>Глубина дерева:</label>
      <input
        type="number"
        value={settings.depth}
        min={0}
        max={10}
        onChange={e => saveSettings({ ...settings, depth: Number(e.target.value) })}
      />
    </div>
  );
}
👉 Теперь настройки сохраняются в chrome.storage.local и автоматически применяются при загрузке панели.
________________________________________
24.5. Локализация
Ещё один шаг к кастомизации — поддержка разных языков.
Chrome поддерживает i18n через /_locales/.
Структура:
/_locales/en/messages.json
/_locales/ru/messages.json
Пример messages.json:
{
  "appName": { "message": "Visual Bookmarks" },
  "menuAddTabs": { "message": "Add selected tabs" }
}
А в коде:
chrome.i18n.getMessage("menuAddTabs");
Таким образом, интерфейс можно легко перевести.
________________________________________
24.6. Итог
•	Темы реализуются через CSS-переменные.
•	Глубина дерева настраивается пользователем.
•	Опции хранятся в chrome.storage.local.
•	Можно добавить локализацию для разных языков.
📌 Это превращает Visual Bookmarks в более дружелюбный инструмент: каждый настраивает его под себя.
Глава 25. Тестирование и отладка расширения
________________________________________
25.1. Зачем тестировать расширение?
Ошибки в браузерных расширениях часто приводят к:
•	📌 зависанию панели или всего браузера;
•	📌 потерянным данным (закладки, сохранения);
•	📌 конфликтам с другими расширениями;
•	📌 отрицательным отзывам в Web Store.
Поэтому тестирование — это не «бонус», а обязательный этап перед каждой публикацией.
________________________________________
25.2. Типы тестирования
1.	Ручное тестирование
o	пользователь открывает панель, кликает, проверяет все сценарии.
o	хорошо подходит для первых этапов.
2.	Автоматическое тестирование
o	юнит-тесты на TypeScript/React (jest, vitest).
o	интеграционные тесты — проверяют взаимодействие модулей (treeOps.ts, sqlStorage.ts).
o	e2e-тесты через Puppeteer или Playwright (имитация действий в браузере).
3.	Регрессионное тестирование
o	проверка, что старые функции работают после добавления новых.
________________________________________
25.3. Тест-чек-лист Visual Bookmarks
Каждое обновление нужно проверять:
UI (панель расширения)
•	открывается ли панель;
•	отображаются ли закладки в дереве;
•	работают ли уровни раскрытия;
•	меняется ли тема оформления.
Работа с вкладками
•	выделенные вкладки правильно копируются в дерево;
•	при повторном копировании буфер очищается;
•	можно добавлять вкладки через контекстное меню.
Chrome API
•	корректно ли создаются группы вкладок;
•	работает ли сохранение в chrome.storage.local;
•	обрабатываются ли сообщения chrome.runtime.onMessage.
Ошибки
•	консоль расширения не должна содержать Uncaught ошибок;
•	не должно быть циклических повторов сообщений;
•	расширение не должно крашить браузер.
________________________________________
25.4. Инструменты отладки
DevTools для расширений
1.	Открыть chrome://extensions.
2.	Включить Режим разработчика.
3.	У своего расширения нажать «Фоновые страницы (service worker)» → откроется отдельный DevTools.
Можно смотреть:
•	Console (ошибки, console.log);
•	Network (запросы к storage / API);
•	Sources (дебаг кода с breakpoints).
Debugging в VS Code
Можно настроить .vscode/launch.json:
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-chrome",
      "request": "launch",
      "name": "Launch Chrome with Extension",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/extension"
    }
  ]
}
Теперь можно запускать Chrome прямо из VS Code и ставить точки останова.
________________________________________
25.5. Автоматические тесты
Юнит-тест на treeOps.ts
import { addNode } from "./treeOps";

test("добавление узла", () => {
  const tree = [{ id: 1, title: "Root", children: [] }];
  const result = addNode(tree, { id: 2, title: "Child" }, 1);
  expect(result[0].children.length).toBe(1);
});
Запуск через:
npm run test
E2E тест с Playwright
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launchPersistentContext("./profile", {
    headless: false,
    args: ["--disable-extensions-except=./extension", "--load-extension=./extension"]
  });

  const page = await browser.newPage();
  await page.goto("chrome://extensions");
  // проверяем работу панели
})();
________________________________________
25.6. Типичные баги в Visual Bookmarks
•	❌ вкладки копируются несколько раз (из-за неочищенного буфера).
•	❌ добавляется только одна вкладка (ошибка в проверке массива).
•	❌ дерево обрезается не на нужном уровне.
•	❌ темы не переключаются (проблема с сохранением в storage).
________________________________________
25.7. Подход к исправлению
1.	Повторить баг → найти стабильный сценарий.
2.	Проверить Console в DevTools.
3.	Использовать console.log("step 1", variable) для отслеживания.
4.	Исправить код.
5.	Добавить тест, чтобы баг не вернулся.
________________________________________
25.8. Итог
•	Тестирование = стабильность расширения.
•	Нужно сочетать ручные и автоматические проверки.
•	DevTools и VS Code дают полный контроль для отладки.
•	Чек-лист помогает не забывать важные сценарии.
📌 Хорошо протестированное расширение даёт пользователю чувство надёжности и повышает рейтинг в Web Store.
Глава 26. Отзывы пользователей и развитие продукта
________________________________________
26.1. Почему обратная связь важна
Пользователь — лучший тестировщик.
•	Он всегда найдёт сценарий, который разработчик не предусматривал.
•	Он первым заметит ошибки, которые проявляются «в реальной жизни».
•	Он подскажет новые функции, о которых разработчик мог даже не задуматься.
📌 Сильный продукт — это не только код, но и умение слушать пользователей.
________________________________________
26.2. Каналы обратной связи
Для расширения типа Visual Bookmarks наиболее важны:
•	Chrome Web Store: отзывы и рейтинг ⭐⭐⭐⭐⭐.
•	GitHub Issues / Discussions: пользователи могут писать баги и предложения.
•	Email / Telegram / Discord (если разработчик укажет контакт).
•	Встроенная форма обратной связи прямо в расширении (простая кнопка «Сообщить об ошибке»).
________________________________________
26.3. Типы отзывов
Отзывы условно делятся на:
1.	Баг-репорты
o	«При копировании вкладок дублируются старые».
o	«Темная тема не работает в Windows 10».
2.	Фич-реквесты
o	«Сделайте экспорт/импорт закладок».
o	«Добавьте возможность поиска по группам».
3.	Общее впечатление
o	«Очень полезное расширение, спасибо!»
o	«Слишком сложно разобраться, сделайте проще».
________________________________________
26.4. Как правильно реагировать
•	На баг-репорты — быстро отвечать и подтверждать проблему («Спасибо, мы проверим»).
•	На фич-реквесты — собирать и сортировать, потом выносить в «план развития».
•	На позитивные отзывы — благодарить (это укрепляет сообщество).
❌ Никогда не игнорировать пользователей. Даже одно «спасибо» повышает доверие.
________________________________________
26.5. План развития продукта
Правильный подход:
1.	Составить дорожную карту (roadmap).
o	например, ближайшие релизы:
	v1.2 → экспорт/импорт закладок;
	v1.3 → улучшенная работа с контекстным меню;
	v1.4 → синхронизация через Google Drive.
2.	Разделить фичи на:
o	«Must-have» (без них продукт не работает).
o	«Nice-to-have» (приятные дополнения).
3.	Всегда документировать изменения → changelog.
________________________________________
26.6. Метрики успеха
Разработчику полезно отслеживать:
•	число установок;
•	процент активных пользователей;
•	количество баг-репортов на версию;
•	рейтинг в Chrome Web Store.
📌 Если после релиза вырос рейтинг и снизилось число багов — вы на правильном пути.
________________________________________
26.7. Сообщество вокруг расширения
Visual Bookmarks может вырасти из личного проекта в open-source сообщество.
•	Принимать pull request’ы от других разработчиков.
•	Писать документацию для новичков.
•	Делать скринкасты/видео по работе.
•	Создать Telegram-чат для пользователей.
________________________________________
26.8. Итог
•	Обратная связь — это источник идей и гарантия стабильности.
•	Баги нужно фиксить быстро, фичи — собирать и планировать.
•	Дорожная карта помогает структурировать развитие.
•	Сообщество — это сила, которая двигает проект вперёд.
📌 В итоге продукт становится не только вашим, а «народным», и именно это делает расширение популярным.
Глава 27. Публикация расширения в Chrome Web Store
________________________________________
27.1. Подготовка к публикации
Перед тем как загружать расширение, нужно убедиться, что оно:
•	🛠️ работает стабильно (нет ошибок в консоли);
•	📦 собрано в production-режиме (npm run build или vite build);
•	📝 имеет правильный manifest.json:
o	корректная версия ("version": "1.0.0");
o	указаны необходимые разрешения (permissions);
o	добавлено описание и иконки.
Иконки
Google требует набор изображений:
•	16x16
•	48x48
•	128x128
Файл иконки указывается в manifest.json:
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
________________________________________
27.2. Регистрация в Google
Чтобы публиковать расширения:
1.	Перейти в Chrome Web Store Developer Dashboard.
2.	Зарегистрироваться как разработчик (разовый взнос $5).
3.	Создать новый проект.
________________________________________
27.3. Сборка пакета расширения
Пакет должен быть в .zip формате.
Для нашего проекта:
cd extension
npm run build
После этого появится папка dist/.
Создаём архив:
•	Windows:
o	выделить содержимое dist/ → правой кнопкой → «Отправить → Сжатая ZIP-папка».
•	Linux/macOS:
•	zip -r visual-bookmarks.zip dist/*
________________________________________
27.4. Загрузка в Web Store
1.	Войти в Developer Dashboard.
2.	Нажать Добавить элемент → загрузить .zip.
3.	Указать:
o	Название расширения (до 45 символов).
o	Краткое описание (до 132 символов).
o	Полное описание (развёрнуто, с примерами).
o	Скриншоты (минимум 1280×800).
o	Видео (по желанию).
________________________________________
27.5. Проверка и публикация
Google проверяет расширение:
•	на безопасность (нет вредоносного кода, скрытых API);
•	на корректность разрешений;
•	на соответствие правилам Developer Program Policies.
Обычно проверка занимает 1–3 дня.
После одобрения расширение становится доступным всем пользователям.
________________________________________
27.6. Обновления
Когда выходит новая версия:
1.	Повышаем "version" в manifest.json.
2.	Снова собираем и загружаем .zip.
3.	Web Store автоматически обновит расширение у всех пользователей.
________________________________________
27.7. Советы для успешной публикации
•	Используйте 📸 красивые скриншоты и иконки — это повышает CTR.
•	Напишите простое и понятное описание («Управляйте вкладками в виде дерева»).
•	Добавьте ключевые слова для поиска.
•	Поддерживайте хорошую оценку (отвечайте на отзывы).
________________________________________
27.8. Итог
•	Публикация в Chrome Web Store — это переход от «проекта для себя» к продукту для тысяч людей.
•	Важно соблюдать правила Google и обеспечивать безопасность кода.
•	Обновления должны быть регулярными, с changelog.
📌 Успешный релиз = новые пользователи, новые отзывы и новая ответственност
Глава 28. Продвижение и монетизация расширения
________________________________________
28.1. Продвижение: как привлечь пользователей
Просто «залить» расширение в магазин мало — там сотни тысяч конкурентов. Нужно выделяться.
1. Качественная страница расширения
•	🎨 Красивые скриншоты (1280×800).
•	📝 Краткое, цепкое описание («Организуй вкладки в древовидную структуру — забудь о хаосе!»).
•	📽️ Видео-демо (30–60 секунд).
•	⭐ Первые отзывы (можно попросить друзей протестировать).
2. SEO для Chrome Web Store
•	Используйте ключевые слова в названии и описании: «bookmarks», «tabs manager», «tree view».
•	Название должно быть коротким, но запоминающимся.
3. Внешнее продвижение
•	🌐 Сайт или лендинг расширения (с документацией и ссылкой на установку).
•	📹 YouTube-обзоры (короткое видео «как пользоваться»).
•	📢 Соцсети, Reddit, Hacker News, Product Hunt.
•	📬 Email-рассылка или блог о развитии проекта.
________________________________________
28.2. Методы удержания пользователей
•	Регулярные обновления (и changelog).
•	Ответы на отзывы.
•	Встроенные подсказки (онбординг при первой установке).
•	Возможность кастомизации (темы, настройки поведения).
📌 Пользователь должен чувствовать: расширение живое и развивается.
________________________________________
28.3. Монетизация
Есть несколько моделей:
1. Freemium
•	Базовый функционал — бесплатно.
•	Дополнительные возможности (например, экспорт/импорт, синхронизация через облако) — платно.
2. Подписка
•	Месячная/годовая подписка.
•	Подходит для «серьёзных» расширений (например, менеджеры задач или VPN).
3. Разовая покупка
•	Пользователь платит один раз и получает расширение навсегда.
•	Минус: меньше стабильного дохода.
4. Донаты и спонсорство
•	Кнопка «Buy me a coffee» ☕.
•	Patreon или GitHub Sponsors.
•	Особенно подходит для open-source проектов.
5. B2B-модель
•	Предложить корпоративным клиентам кастомизированную версию расширения.
________________________________________
28.4. Правила Google
⚠️ Google жёстко относится к монетизации:
•	Нельзя скрывать функционал за неожиданным paywall.
•	Нельзя использовать обманные методы (например, скрытая реклама).
•	Все платежи должны идти через проверенные сервисы (Stripe, PayPal и др.).
________________________________________
28.5. Кейсы успешных расширений
•	Tab Manager Plus → бесплатное, но с донатами и большим сообществом.
•	Grammarly → freemium + подписка (основной доход).
•	LastPass → freemium, корпоративные клиенты приносят основную прибыль.
________________________________________
28.6. Итог
•	Продвижение важно не меньше, чем разработка.
•	Монетизация должна быть прозрачной и удобной.
•	Самый надёжный путь — начать с donations и freemium, а затем при необходимости добавить подписку.
Глава 29. Безопасность и защита данных
________________________________________
29.1. Почему безопасность важна
•	🌐 Расширения имеют доступ к веб-страницам и вкладкам → могут читать содержимое сайтов.
•	🔑 У них есть доступ к cookies и локальному хранилищу.
•	🛡️ Google жёстко проверяет расширения, чтобы они не нарушали приватность.
Вывод: защита данных — это не только требование Google, но и основа доверия пользователей.
________________________________________
29.2. Разрешения в manifest.json
Чем меньше прав требует расширение, тем лучше.
❌ Плохо:
"permissions": ["tabs", "cookies", "history", "storage", "management"]
✅ Хорошо:
"permissions": ["tabs", "storage"]
•	Запрашивай только то, что действительно нужно.
•	Используй "host_permissions" вместо "*://*/*" — явно перечисляй сайты.
________________________________________
29.3. Хранение данных
В нашем расширении данные сохраняются в IndexedDB / LocalStorage через sqlStorage.ts.
Рекомендации:
•	🔒 Не хранить пароли или чувствительные токены.
•	📦 Хранить только структуру дерева закладок и ссылки.
•	🔄 При импорте/экспорте файлов делать формат JSON и показывать пользователю содержимое.
________________________________________
29.4. Передача сообщений между модулями
Мы используем chrome.runtime.sendMessage и chrome.runtime.onMessage.
Безопасность:
•	Проверять тип сообщения (msg.type).
•	Игнорировать неизвестные типы.
•	Никогда не выполнять eval или произвольный код из сообщений.
________________________________________
29.5. Работа с внешними API
Если решим добавить синхронизацию (например, с Google Drive или Dropbox):
•	Использовать OAuth2 (официальные SDK).
•	Хранить токены только в зашифрованном виде (chrome.storage.local + Crypto API).
•	Не отправлять данные на сторонние серверы без ведома пользователя.
________________________________________
29.6. Manifest V3 и безопасность
Google ввёл MV3 именно ради повышения безопасности:
•	❌ Нет фоновых страниц (background page).
•	✅ Есть сервис-воркеры (работают только по запросу).
•	⛔ Блокировка remote code execution.
•	✅ Контент-скрипты должны быть заранее прописаны в manifest.json.
________________________________________
29.7. Best Practices для безопасности
1.	Минимизируй список прав в manifest.json.
2.	Не отправляй пользовательские данные без согласия.
3.	Используй HTTPS при любом сетевом запросе.
4.	Добавь в README информацию о том, какие данные расширение хранит.
5.	Используй Content Security Policy (CSP).
Пример CSP для MV3:
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'"
}
________________________________________
29.8. Реакция на инциденты
•	Если найден баг с безопасностью — выпустить hotfix и обновить расширение.
•	Сообщать пользователям об изменениях (changelog).
•	Поддерживать прозрачность («мы не собираем ваши данные»).
________________________________________
29.9. Итог
•	Безопасность — это доверие.
•	Правильные разрешения, ограниченный доступ и прозрачность = хорошие отзывы и больше пользователей.
•	Google сам проверяет расширения, но ответственность всегда на разработчике.
Глава 30. Заключение
________________________________________
30.1. От идеи к реализации
Visual Bookmarks начинался как простая мысль:
"А что, если сделать дерево вкладок и закладок прямо в Chrome?"
Мы прошли путь от идеи до полноценного расширения, разобрали:
•	⚙️ внутреннюю архитектуру (background, React, TypeScript, Chrome API);
•	📦 хранение данных и офлайн-режим;
•	🖱️ взаимодействие с пользователем через контекстное меню и дерево;
•	🔒 безопасность и работу с правами;
•	🚀 публикацию и продвижение.
________________________________________
30.2. Что мы узнали
1.	Chrome Extension — это мини-приложение.
У него есть свои файлы, API, механизмы обмена сообщениями.
2.	Node.js и TypeScript дают современный стек: сборку, строгую типизацию, поддержку больших проектов.
3.	React делает интерфейс удобным и гибким.
4.	Chrome API открывает двери к работе с вкладками, хранением и контекстным меню.
5.	Безопасность и прозрачность — главный фактор доверия пользователей.
6.	Продвижение и монетизация не менее важны, чем сама разработка.
________________________________________
30.3. Ценность проекта
Visual Bookmarks — это не просто менеджер вкладок.
Это:
•	🗂️ инструмент для организации информации;
•	🧠 способ разгрузить память и сосредоточиться;
•	🌐 пример того, как современные веб-технологии (React + TS + Chrome API) могут работать вместе.
________________________________________
30.4. Что дальше?
У любого проекта есть продолжение:
•	Добавить облако для синхронизации закладок.
•	Поддержка Firefox и Edge (WebExtensions API почти одинаков).
•	Эксперименты с AI-подсказками (например, автоматическая категоризация вкладок).
•	Сообщество, которое будет помогать улучшать проект.
________________________________________
30.5. Заключительное слово
Мы разобрали расширение до винтика и собрали обратно.
Теперь у вас есть:
•	понимание, как устроен весь стек;
•	знание, как писать своё расширение;
•	база, чтобы экспериментировать и развиваться.
В программировании нет финальных точек. Есть только новые ветки развития.
Visual Bookmarks — это всего лишь одна из них. Возможно, ваш следующий проект станет ещё лучше.
