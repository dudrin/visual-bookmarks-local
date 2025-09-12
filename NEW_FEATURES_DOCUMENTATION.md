# Документация по новым функциям Visual Bookmarks Local

## Содержание
1. [Введение](#введение)
2. [Система иконок](#система-иконок)
3. [Предпросмотр страниц](#предпросмотр-страниц)
4. [Система тегов](#система-тегов)
5. [Полнотекстовый поиск](#полнотекстовый-поиск)
6. [Форматированные заметки](#форматированные-заметки)
7. [Улучшения UI](#улучшения-ui)
8. [Примеры использования](#примеры-использования)

## Введение

В этом документе описаны новые функции, добавленные в расширение Visual Bookmarks Local. Эти функции значительно расширяют возможности управления закладками и повышают удобство использования расширения.

## Система иконок

### Описание
Система иконок заменяет текстовые иконки на SVG-иконки, что улучшает масштабируемость и внешний вид интерфейса.

### Компоненты
- **Icon** - основной компонент для отображения SVG-иконок

### Использование
```tsx
import Icon from '../components/Icon';

// Базовое использование
<Icon type="bookmark" />

// С дополнительными параметрами
<Icon 
  type="folder" 
  size={24} 
  color="#3498db" 
  onClick={() => console.log('Icon clicked')} 
/>
```

### Доступные типы иконок
- bookmark - закладка
- folder - папка
- folder-open - открытая папка
- checkbox - чекбокс
- checkbox-checked - отмеченный чекбокс
- move - перемещение
- copy - копирование
- delete - удаление
- clear - очистка
- search - поиск
- tag - тег
- edit - редактирование
- preview - предпросмотр
- note - заметка
- close - закрытие

## Предпросмотр страниц

### Описание
Функция предпросмотра страниц позволяет увидеть содержимое страницы без перехода по ссылке. Предпросмотр появляется при наведении на закладку.

### Компоненты
- **PagePreview** - компонент для отображения предпросмотра страницы
- **PagePreviewWrapper** - компонент-обертка для добавления предпросмотра к любому элементу
- **usePagePreview** - хук для управления предпросмотром

### Использование
```tsx
import PagePreviewWrapper from '../components/PagePreviewWrapper';

// Обертка для элемента с предпросмотром
<PagePreviewWrapper
  url="https://example.com"
  title="Example Website"
  enabled={true}
  previewDelay={700}
>
  <div>Наведите на меня для предпросмотра</div>
</PagePreviewWrapper>
```

### Особенности
- Задержка перед показом предпросмотра для избежания мерцания
- Обработка ошибок загрузки предпросмотра
- Адаптивное позиционирование предпросмотра в зависимости от доступного места на экране
- Оптимизация для мобильных устройств

## Система тегов

### Описание
Система тегов позволяет присваивать закладкам теги для более гибкой организации и фильтрации.

### Компоненты
- **Tag** - компонент для отображения отдельного тега
- **TagManager** - компонент для управления тегами (создание, редактирование, удаление)
- **TagFilter** - компонент для фильтрации закладок по тегам
- **useTags** - хук для управления тегами и их связями с закладками

### Использование
```tsx
import Tag from '../components/Tag';
import TagManager from '../components/TagManager';
import TagFilter from '../components/TagFilter';
import { useTags } from '../hooks/useTags';

// В компоненте
const {
  tags,
  createTag,
  updateTag,
  deleteTag,
  addTagToNode,
  removeTagFromNode,
  getNodeTags,
  filterNodesByTags,
  updateFilterState
} = useTags();

// Отображение тега
<Tag
  id="tag-1"
  name="Важное"
  color="#ff0000"
  selected={true}
  onClick={handleTagClick}
  onRemove={handleTagRemove}
/>

// Управление тегами
<TagManager
  tags={tags}
  selectedTags={selectedTags}
  onTagSelect={handleTagSelect}
  onTagCreate={createTag}
  onTagDelete={deleteTag}
  onTagEdit={updateTag}
/>

// Фильтрация по тегам
<TagFilter
  tags={tags}
  filterState={filterState}
  onFilterChange={updateFilterState}
/>
```

### Особенности
- Цветовая маркировка тегов
- Фильтрация по нескольким тегам с режимами "любой из" и "все"
- Возможность показа незатегированных элементов
- Сохранение тегов в localStorage
- Поиск по тегам

## Полнотекстовый поиск

### Описание
Полнотекстовый поиск позволяет искать закладки не только по заголовкам, но и по содержимому страниц.

### Компоненты
- **FullTextSearch** - сервис для индексирования и поиска по содержимому страниц
- **SearchResults** - компонент для отображения результатов поиска
- **AdvancedSearch** - компонент расширенного поиска с дополнительными опциями

### Использование
```tsx
import FullTextSearch from '../services/FullTextSearch';
import SearchResults from '../components/SearchResults';
import AdvancedSearch from '../components/AdvancedSearch';

// Инициализация сервиса поиска
const searchService = new FullTextSearch();

// Индексирование страницы
await searchService.indexPage(
  'page-1',
  'https://example.com',
  'Example Website',
  ['tag1', 'tag2']
);

// Поиск
const results = searchService.search('query', {
  includeContent: true,
  includeTags: true,
  exactMatch: false,
  limit: 50
});

// Отображение результатов поиска
<SearchResults
  results={results}
  query="query"
  loading={false}
  onResultClick={handleResultClick}
  showPreview={true}
/>

// Расширенный поиск
<AdvancedSearch
  searchService={searchService}
  tags={tags}
  onClose={handleClose}
  onResultClick={handleResultClick}
/>
```

### Особенности
- Индексирование содержимого страниц
- Поиск по заголовкам, содержимому и тегам
- Ранжирование результатов по релевантности
- Подсветка совпадений в результатах
- Предпросмотр страниц в результатах поиска
- Расширенные настройки поиска
- Сохранение индекса в localStorage

## Форматированные заметки

### Описание
Функция форматированных заметок позволяет создавать и редактировать заметки с форматированием текста, списками, ссылками и другими элементами.

### Компоненты
- **RichTextEditor** - компонент редактора форматированного текста
- **NoteEditor** - компонент для редактирования заметок
- **NoteModal** - модальное окно для просмотра и редактирования заметок

### Использование
```tsx
import RichTextEditor from '../components/RichTextEditor';
import NoteEditor from '../components/NoteEditor';
import NoteModal from '../components/NoteModal';

// Редактор форматированного текста
<RichTextEditor
  initialValue="<p>Начальный текст</p>"
  onChange={handleChange}
  placeholder="Введите текст..."
  minHeight={150}
  maxHeight={500}
/>

// Редактор заметок
<NoteEditor
  nodeId="node-1"
  initialNote="<p>Начальная заметка</p>"
  onSave={handleSave}
  onCancel={handleCancel}
/>

// Модальное окно заметок
<NoteModal
  nodeId="node-1"
  title="Заметка к закладке"
  note="<p>Содержимое заметки</p>"
  onSave={handleSave}
  onClose={handleClose}
/>
```

### Особенности
- Форматирование текста (жирный, курсив, подчеркнутый, зачеркнутый)
- Создание списков (маркированных и нумерованных)
- Вставка ссылок
- Выравнивание текста
- Отступы
- Удаление форматирования
- Сохранение заметок в формате HTML
- Предпросмотр заметок

## Улучшения UI

### Описание
Улучшения UI включают в себя добавление CSS переменных для единообразного оформления, улучшение контраста и читаемости, а также оптимизацию интерфейса для мобильных устройств.

### Компоненты
- **variables.css** - файл с CSS переменными
- **main.css** - основной файл стилей
- **responsive.css** - стили для адаптивности на мобильных устройствах

### Использование
```html
<!-- В HTML -->
<link rel="stylesheet" href="styles/variables.css">
<link rel="stylesheet" href="styles/main.css">
<link rel="stylesheet" href="styles/responsive.css">
```

```css
/* В CSS */
.my-component {
  color: var(--text-primary);
  background-color: var(--bg-card);
  padding: var(--spacing-4);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}
```

### Особенности
- Единая система цветов
- Единая система отступов
- Единая система размеров шрифтов
- Единая система теней
- Адаптивность для мобильных устройств
- Поддержка темной темы
- Улучшенный контраст для лучшей читаемости
- Оптимизация для сенсорных экранов

## Примеры использования

### Пример 1: Добавление тегов к закладке

```tsx
import { useTags } from '../hooks/useTags';
import Tag from '../components/Tag';

function BookmarkItem({ bookmark }) {
  const {
    tags,
    getNodeTags,
    addTagToNode,
    removeTagFromNode
  } = useTags();
  
  const bookmarkTags = getNodeTags(bookmark.id, bookmark.treeId);
  
  const handleAddTag = (tagId) => {
    addTagToNode(tagId, bookmark.id, bookmark.treeId);
  };
  
  const handleRemoveTag = (tagId) => {
    removeTagFromNode(tagId, bookmark.id, bookmark.treeId);
  };
  
  return (
    <div className="bookmark-item">
      <div className="bookmark-title">{bookmark.title}</div>
      <div className="bookmark-tags">
        {bookmarkTags.map(tag => (
          <Tag
            key={tag.id}
            id={tag.id}
            name={tag.name}
            color={tag.color}
            onRemove={handleRemoveTag}
            size="small"
          />
        ))}
        <button onClick={() => setShowTagSelector(true)}>
          Добавить тег
        </button>
      </div>
    </div>
  );
}
```

### Пример 2: Использование предпросмотра страниц

```tsx
import PagePreviewWrapper from '../components/PagePreviewWrapper';

function BookmarkList({ bookmarks }) {
  return (
    <div className="bookmark-list">
      {bookmarks.map(bookmark => (
        <PagePreviewWrapper
          key={bookmark.id}
          url={bookmark.url}
          title={bookmark.title}
          enabled={true}
          previewDelay={700}
        >
          <div className="bookmark-item">
            <div className="bookmark-title">{bookmark.title}</div>
            <div className="bookmark-url">{bookmark.url}</div>
          </div>
        </PagePreviewWrapper>
      ))}
    </div>
  );
}
```

### Пример 3: Использование полнотекстового поиска

```tsx
import { useState, useEffect } from 'react';
import FullTextSearch from '../services/FullTextSearch';
import SearchResults from '../components/SearchResults';

function SearchPanel({ bookmarks }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchService = new FullTextSearch();
  
  // Индексирование закладок
  useEffect(() => {
    const indexBookmarks = async () => {
      for (const bookmark of bookmarks) {
        await searchService.indexPage(
          bookmark.id,
          bookmark.url,
          bookmark.title,
          bookmark.tags
        );
      }
    };
    
    indexBookmarks();
  }, [bookmarks]);
  
  // Обработчик поиска
  const handleSearch = () => {
    setLoading(true);
    
    const searchResults = searchService.search(query, {
      includeContent: true,
      includeTags: true
    });
    
    setResults(searchResults);
    setLoading(false);
  };
  
  return (
    <div className="search-panel">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск..."
        />
        <button onClick={handleSearch}>Поиск</button>
      </div>
      
      <SearchResults
        results={results}
        query={query}
        loading={loading}
        showPreview={true}
      />
    </div>
  );
}
```

### Пример 4: Использование форматированных заметок

```tsx
import { useState } from 'react';
import NoteModal from '../components/NoteModal';
import Icon from '../components/Icon';

function BookmarkWithNotes({ bookmark }) {
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState(bookmark.note || '');
  
  const handleSaveNote = (nodeId, updatedNote) => {
    setNote(updatedNote);
    // Сохранение заметки в хранилище
    saveNoteToStorage(nodeId, updatedNote);
    setShowNotes(false);
  };
  
  return (
    <div className="bookmark-with-notes">
      <div className="bookmark-title">{bookmark.title}</div>
      
      <button
        className="note-button"
        onClick={() => setShowNotes(true)}
        title="Открыть заметку"
      >
        <Icon type="note" size={16} />
        Заметка
      </button>
      
      {showNotes && (
        <NoteModal
          nodeId={bookmark.id}
          title={bookmark.title}
          note={note}
          onSave={handleSaveNote}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  );
}
```

### Пример 5: Использование CSS переменных

```tsx
import '../styles/variables.css';
import '../styles/main.css';
import '../styles/responsive.css';

function ThemedComponent() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Заголовок карточки</h3>
      </div>
      <div className="card-body">
        <p>Содержимое карточки с использованием CSS переменных.</p>
        <button className="btn btn-primary">Кнопка</button>
      </div>
    </div>
  );
}
```

## Заключение

Новые функции значительно расширяют возможности расширения Visual Bookmarks Local и делают его более удобным в использовании. Система тегов, полнотекстовый поиск, предпросмотр страниц и форматированные заметки позволяют более эффективно организовывать и использовать закладки.