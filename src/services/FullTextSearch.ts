/**
 * Сервис полнотекстового поиска
 * Позволяет индексировать и искать контент страниц
 */

// Интерфейс для документа в индексе
interface IndexedDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  tags?: string[];
  lastIndexed: number; // timestamp
}

// Интерфейс для результата поиска
export interface SearchResult {
  id: string;
  url: string;
  title: string;
  snippet: string;
  score: number;
  lastIndexed: number;
}

// Настройки поиска
export interface SearchOptions {
  limit?: number;
  includeContent?: boolean;
  includeTags?: boolean;
  exactMatch?: boolean;
}

// Настройки индексирования
export interface IndexOptions {
  maxContentLength?: number;
  excludeCommonWords?: boolean;
  reindexIfOlderThan?: number; // milliseconds
}

class FullTextSearch {
  private index: Map<string, IndexedDocument>;
  private invertedIndex: Map<string, Set<string>>;
  private storageKey: string;
  
  constructor(storageKey = 'visual-bookmarks-search-index') {
    this.index = new Map();
    this.invertedIndex = new Map();
    this.storageKey = storageKey;
    this.loadFromStorage();
  }
  
  /**
   * Загрузка индекса из localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Восстанавливаем основной индекс
        this.index = new Map();
        for (const [id, doc] of Object.entries(parsedData.documents || {})) {
          this.index.set(id, doc as IndexedDocument);
        }
        
        // Восстанавливаем инвертированный индекс
        this.invertedIndex = new Map();
        for (const [term, docIds] of Object.entries(parsedData.invertedIndex || {})) {
          this.invertedIndex.set(term, new Set(docIds as string[]));
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке индекса поиска:', error);
    }
  }
  
  /**
   * Сохранение индекса в localStorage
   */
  private saveToStorage(): void {
    try {
      // Преобразуем Map в объект для сериализации
      const documents: Record<string, IndexedDocument> = {};
      for (const [id, doc] of this.index.entries()) {
        documents[id] = doc;
      }
      
      // Преобразуем инвертированный индекс в объект
      const invertedIndex: Record<string, string[]> = {};
      for (const [term, docIds] of this.invertedIndex.entries()) {
        invertedIndex[term] = Array.from(docIds);
      }
      
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ documents, invertedIndex })
      );
    } catch (error) {
      console.error('Ошибка при сохранении индекса поиска:', error);
    }
  }
  
  /**
   * Индексирование контента страницы
   */
  async indexPage(
    id: string,
    url: string,
    title: string,
    tags?: string[],
    options: IndexOptions = {}
  ): Promise<boolean> {
    try {
      // Проверяем, нужно ли переиндексировать страницу
      const existingDoc = this.index.get(id);
      if (
        existingDoc && 
        options.reindexIfOlderThan && 
        Date.now() - existingDoc.lastIndexed < options.reindexIfOlderThan
      ) {
        return false; // Страница недавно индексировалась
      }
      
      // Получаем контент страницы
      const content = await this.fetchPageContent(url, options.maxContentLength);
      
      // Индексируем документ
      const document: IndexedDocument = {
        id,
        url,
        title,
        content,
        tags,
        lastIndexed: Date.now()
      };
      
      // Удаляем старый документ из инвертированного индекса, если он существует
      if (existingDoc) {
        this.removeFromInvertedIndex(existingDoc);
      }
      
      // Добавляем документ в основной индекс
      this.index.set(id, document);
      
      // Добавляем документ в инвертированный индекс
      this.addToInvertedIndex(document, options.excludeCommonWords);
      
      // Сохраняем индекс
      this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error(`Ошибка при индексировании страницы ${url}:`, error);
      return false;
    }
  }
  
  /**
   * Получение контента страницы
   */
  private async fetchPageContent(url: string, maxLength = 100000): Promise<string> {
    try {
      // Используем Fetch API для получения содержимого страницы
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Создаем DOM-парсер для извлечения текста
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Удаляем скрипты, стили и другие ненужные элементы
      const scripts = doc.querySelectorAll('script, style, noscript, iframe, svg');
      scripts.forEach(script => script.remove());
      
      // Получаем текст из body
      let content = doc.body.textContent || '';
      
      // Очищаем текст от лишних пробелов
      content = content
        .replace(/\s+/g, ' ')
        .trim();
      
      // Ограничиваем длину контента
      if (maxLength && content.length > maxLength) {
        content = content.substring(0, maxLength);
      }
      
      return content;
    } catch (error) {
      console.error(`Ошибка при получении контента страницы ${url}:`, error);
      return '';
    }
  }
  
  /**
   * Добавление документа в инвертированный индекс
   */
  private addToInvertedIndex(document: IndexedDocument, excludeCommonWords = true): void {
    // Получаем все термины из документа
    const terms = this.extractTerms(
      `${document.title} ${document.content}`, 
      excludeCommonWords
    );
    
    // Добавляем теги к терминам, если они есть
    if (document.tags && document.tags.length > 0) {
      document.tags.forEach(tag => {
        terms.push(...this.extractTerms(tag, false));
      });
    }
    
    // Добавляем каждый термин в инвертированный индекс
    for (const term of terms) {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Set());
      }
      
      this.invertedIndex.get(term)!.add(document.id);
    }
  }
  
  /**
   * Удаление документа из инвертированного индекса
   */
  private removeFromInvertedIndex(document: IndexedDocument): void {
    // Проходим по всему инвертированному индексу
    for (const [term, docIds] of this.invertedIndex.entries()) {
      // Удаляем ID документа из множества
      docIds.delete(document.id);
      
      // Если множество стало пустым, удаляем термин из индекса
      if (docIds.size === 0) {
        this.invertedIndex.delete(term);
      }
    }
  }
  
  /**
   * Извлечение терминов из текста
   */
  private extractTerms(text: string, excludeCommonWords = true): string[] {
    if (!text) return [];
    
    // Приводим к нижнему регистру и разбиваем на слова
    const words = text.toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ') // Оставляем только буквы и цифры
      .split(/\s+/)
      .filter(word => word.length > 1); // Игнорируем слова из одной буквы
    
    // Фильтруем общие слова, если нужно
    if (excludeCommonWords) {
      return words.filter(word => !this.isCommonWord(word));
    }
    
    return words;
  }
  
  /**
   * Проверка, является ли слово общим (стоп-словом)
   */
  private isCommonWord(word: string): boolean {
    // Список общих слов (стоп-слов) на русском и английском
    const commonWords = new Set([
      'и', 'в', 'на', 'с', 'по', 'для', 'не', 'что', 'это', 'как',
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'from'
    ]);
    
    return commonWords.has(word);
  }
  
  /**
   * Поиск по индексу
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    if (!query.trim()) {
      return [];
    }
    
    const limit = options.limit || 100;
    const searchTerms = this.extractTerms(query, false);
    
    if (searchTerms.length === 0) {
      return [];
    }
    
    // Получаем множество ID документов для каждого термина
    const termResults: Set<string>[] = [];
    
    for (const term of searchTerms) {
      const docIds = this.invertedIndex.get(term);
      if (docIds && docIds.size > 0) {
        termResults.push(docIds);
      }
    }
    
    if (termResults.length === 0) {
      return [];
    }
    
    // Находим пересечение или объединение результатов
    let resultIds: Set<string>;
    
    if (options.exactMatch) {
      // Для точного совпадения находим пересечение всех множеств
      resultIds = termResults[0];
      for (let i = 1; i < termResults.length; i++) {
        resultIds = new Set([...resultIds].filter(id => termResults[i].has(id)));
      }
    } else {
      // Для обычного поиска находим объединение всех множеств
      resultIds = new Set();
      for (const docIds of termResults) {
        for (const id of docIds) {
          resultIds.add(id);
        }
      }
    }
    
    // Преобразуем ID в результаты поиска
    const results: SearchResult[] = [];
    
    for (const id of resultIds) {
      const doc = this.index.get(id);
      if (doc) {
        // Вычисляем релевантность результата
        const score = this.calculateScore(doc, searchTerms);
        
        // Создаем сниппет
        const snippet = this.createSnippet(doc.content, searchTerms);
        
        results.push({
          id: doc.id,
          url: doc.url,
          title: doc.title,
          snippet,
          score,
          lastIndexed: doc.lastIndexed
        });
      }
    }
    
    // Сортируем результаты по релевантности
    results.sort((a, b) => b.score - a.score);
    
    // Ограничиваем количество результатов
    return results.slice(0, limit);
  }
  
  /**
   * Вычисление релевантности результата
   */
  private calculateScore(doc: IndexedDocument, searchTerms: string[]): number {
    let score = 0;
    
    // Базовый вес для совпадений в заголовке и контенте
    const titleWeight = 2.0;
    const contentWeight = 1.0;
    const tagWeight = 1.5;
    
    // Проверяем совпадения в заголовке
    const titleLower = doc.title.toLowerCase();
    for (const term of searchTerms) {
      if (titleLower.includes(term)) {
        score += titleWeight;
      }
    }
    
    // Проверяем совпадения в контенте
    const contentLower = doc.content.toLowerCase();
    for (const term of searchTerms) {
      // Считаем количество совпадений в контенте
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches * contentWeight;
    }
    
    // Проверяем совпадения в тегах
    if (doc.tags && doc.tags.length > 0) {
      const tagsLower = doc.tags.map(tag => tag.toLowerCase());
      for (const term of searchTerms) {
        for (const tag of tagsLower) {
          if (tag.includes(term)) {
            score += tagWeight;
          }
        }
      }
    }
    
    // Учитываем "свежесть" документа
    const ageInDays = (Date.now() - doc.lastIndexed) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 1 - (ageInDays / 30)); // Максимум 30 дней
    
    // Итоговый скор с учетом свежести
    return score * (0.8 + 0.2 * freshnessScore);
  }
  
  /**
   * Создание сниппета для результата поиска
   */
  private createSnippet(content: string, searchTerms: string[], maxLength = 160): string {
    if (!content) return '';
    
    const contentLower = content.toLowerCase();
    
    // Находим первое вхождение любого из терминов
    let bestPosition = -1;
    let bestTerm = '';
    
    for (const term of searchTerms) {
      const position = contentLower.indexOf(term);
      if (position !== -1 && (bestPosition === -1 || position < bestPosition)) {
        bestPosition = position;
        bestTerm = term;
      }
    }
    
    // Если ничего не найдено, возвращаем начало контента
    if (bestPosition === -1) {
      return content.length > maxLength 
        ? content.substring(0, maxLength) + '...' 
        : content;
    }
    
    // Определяем начало и конец сниппета
    const termLength = bestTerm.length;
    const snippetStart = Math.max(0, bestPosition - 60);
    const snippetEnd = Math.min(content.length, bestPosition + termLength + 60);
    
    // Создаем сниппет
    let snippet = '';
    
    if (snippetStart > 0) {
      snippet += '...';
    }
    
    snippet += content.substring(snippetStart, snippetEnd);
    
    if (snippetEnd < content.length) {
      snippet += '...';
    }
    
    return snippet;
  }
  
  /**
   * Удаление документа из индекса
   */
  removeDocument(id: string): boolean {
    const doc = this.index.get(id);
    if (!doc) {
      return false;
    }
    
    // Удаляем из инвертированного индекса
    this.removeFromInvertedIndex(doc);
    
    // Удаляем из основного индекса
    this.index.delete(id);
    
    // Сохраняем изменения
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * Очистка всего индекса
   */
  clearIndex(): void {
    this.index.clear();
    this.invertedIndex.clear();
    this.saveToStorage();
  }
  
  /**
   * Получение документа по ID
   */
  getDocumentById(id: string): IndexedDocument | undefined {
    return this.index.get(id);
  }
  
  /**
   * Получение статистики индекса
   */
  getStats(): { documentCount: number; termCount: number; storageSize: string } {
    const documentCount = this.index.size;
    const termCount = this.invertedIndex.size;
    
    // Оценка размера хранилища
    const storageSize = this.estimateStorageSize();
    
    return {
      documentCount,
      termCount,
      storageSize
    };
  }
  
  /**
   * Оценка размера хранилища
   */
  private estimateStorageSize(): string {
    try {
      const data = localStorage.getItem(this.storageKey) || '';
      const bytes = new Blob([data]).size;
      
      if (bytes < 1024) {
        return `${bytes} байт`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} КБ`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
      }
    } catch (error) {
      return 'Неизвестно';
    }
  }
}

export default FullTextSearch;