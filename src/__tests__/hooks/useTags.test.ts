import { renderHook, act } from '@testing-library/react';
import { useTags } from '../../hooks/useTags';
import { Tag, TagRelation } from '../../models/TagModels';

// Мокаем localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useTags Hook', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  // Тест на инициализацию с начальными значениями
  it('initializes with provided initial values', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: 'tag2', name: 'Tag 2', createdAt: '2023-01-02', updatedAt: '2023-01-02' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' },
      { tagId: 'tag2', nodeId: 'node2', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    expect(result.current.tags).toEqual(initialTags);
    expect(result.current.relations).toEqual(initialRelations);
  });

  // Тест на создание нового тега
  it('creates a new tag', () => {
    const { result } = renderHook(() => useTags());
    
    act(() => {
      result.current.createTag('New Tag', '#ff0000');
    });
    
    expect(result.current.tags.length).toBe(1);
    expect(result.current.tags[0].name).toBe('New Tag');
    expect(result.current.tags[0].color).toBe('#ff0000');
    expect(result.current.tags[0].id).toBeDefined();
    expect(result.current.tags[0].createdAt).toBeDefined();
    expect(result.current.tags[0].updatedAt).toBeDefined();
  });

  // Тест на обновление тега
  it('updates an existing tag', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const { result } = renderHook(() => useTags({ initialTags }));
    
    act(() => {
      result.current.updateTag('tag1', { name: 'Updated Tag', color: '#00ff00' });
    });
    
    expect(result.current.tags[0].name).toBe('Updated Tag');
    expect(result.current.tags[0].color).toBe('#00ff00');
    expect(result.current.tags[0].updatedAt).not.toBe('2023-01-01');
  });

  // Тест на удаление тега
  it('deletes a tag and its relations', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    act(() => {
      result.current.deleteTag('tag1');
    });
    
    expect(result.current.tags.length).toBe(0);
    expect(result.current.relations.length).toBe(0);
  });

  // Тест на добавление тега к узлу
  it('adds a tag to a node', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const { result } = renderHook(() => useTags({ initialTags }));
    
    act(() => {
      result.current.addTagToNode('tag1', 'node1', 'tree1');
    });
    
    expect(result.current.relations.length).toBe(1);
    expect(result.current.relations[0]).toEqual({
      tagId: 'tag1',
      nodeId: 'node1',
      treeId: 'tree1'
    });
  });

  // Тест на предотвращение дублирования связей
  it('prevents duplicate tag-node relations', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    act(() => {
      result.current.addTagToNode('tag1', 'node1', 'tree1');
    });
    
    expect(result.current.relations.length).toBe(1);
  });

  // Тест на удаление тега из узла
  it('removes a tag from a node', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    act(() => {
      result.current.removeTagFromNode('tag1', 'node1', 'tree1');
    });
    
    expect(result.current.relations.length).toBe(0);
  });

  // Тест на получение тегов для узла
  it('gets tags for a node', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: 'tag2', name: 'Tag 2', createdAt: '2023-01-02', updatedAt: '2023-01-02' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' },
      { tagId: 'tag2', nodeId: 'node1', treeId: 'tree1' },
      { tagId: 'tag1', nodeId: 'node2', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    const nodeTags = result.current.getNodeTags('node1', 'tree1');
    
    expect(nodeTags.length).toBe(2);
    expect(nodeTags[0].id).toBe('tag1');
    expect(nodeTags[1].id).toBe('tag2');
  });

  // Тест на получение узлов с тегом
  it('gets nodes with a specific tag', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' },
      { tagId: 'tag1', nodeId: 'node2', treeId: 'tree1' },
      { tagId: 'tag1', nodeId: 'node3', treeId: 'tree2' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    const nodes = result.current.getNodesWithTag('tag1', 'tree1');
    
    expect(nodes.length).toBe(2);
    expect(nodes).toContain('node1');
    expect(nodes).toContain('node2');
    expect(nodes).not.toContain('node3');
  });

  // Тест на фильтрацию узлов по тегам (любой из тегов)
  it('filters nodes by tags with "any" match type', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: 'tag2', name: 'Tag 2', createdAt: '2023-01-02', updatedAt: '2023-01-02' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' },
      { tagId: 'tag2', nodeId: 'node2', treeId: 'tree1' },
      { tagId: 'tag1', nodeId: 'node3', treeId: 'tree1' },
      { tagId: 'tag2', nodeId: 'node3', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    const nodes = [
      { id: 'node1', title: 'Node 1' },
      { id: 'node2', title: 'Node 2' },
      { id: 'node3', title: 'Node 3' },
      { id: 'node4', title: 'Node 4' }
    ];
    
    act(() => {
      result.current.updateFilterState({
        selectedTags: ['tag1'],
        matchType: 'any',
        showUntagged: false
      });
    });
    
    const filteredNodes = result.current.filterNodesByTags(nodes, 'tree1');
    
    expect(filteredNodes.length).toBe(2);
    expect(filteredNodes[0].id).toBe('node1');
    expect(filteredNodes[1].id).toBe('node3');
  });

  // Тест на фильтрацию узлов по тегам (все теги)
  it('filters nodes by tags with "all" match type', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: 'tag2', name: 'Tag 2', createdAt: '2023-01-02', updatedAt: '2023-01-02' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' },
      { tagId: 'tag2', nodeId: 'node2', treeId: 'tree1' },
      { tagId: 'tag1', nodeId: 'node3', treeId: 'tree1' },
      { tagId: 'tag2', nodeId: 'node3', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    const nodes = [
      { id: 'node1', title: 'Node 1' },
      { id: 'node2', title: 'Node 2' },
      { id: 'node3', title: 'Node 3' },
      { id: 'node4', title: 'Node 4' }
    ];
    
    act(() => {
      result.current.updateFilterState({
        selectedTags: ['tag1', 'tag2'],
        matchType: 'all',
        showUntagged: false
      });
    });
    
    const filteredNodes = result.current.filterNodesByTags(nodes, 'tree1');
    
    expect(filteredNodes.length).toBe(1);
    expect(filteredNodes[0].id).toBe('node3');
  });

  // Тест на фильтрацию с показом незатегированных узлов
  it('includes untagged nodes when showUntagged is true', () => {
    const initialTags: Tag[] = [
      { id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
    ];
    
    const initialRelations: TagRelation[] = [
      { tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' }
    ];
    
    const { result } = renderHook(() => useTags({
      initialTags,
      initialRelations
    }));
    
    const nodes = [
      { id: 'node1', title: 'Node 1' },
      { id: 'node2', title: 'Node 2' }
    ];
    
    act(() => {
      result.current.updateFilterState({
        selectedTags: ['tag1'],
        matchType: 'any',
        showUntagged: true
      });
    });
    
    const filteredNodes = result.current.filterNodesByTags(nodes, 'tree1');
    
    expect(filteredNodes.length).toBe(2);
    expect(filteredNodes[0].id).toBe('node1');
    expect(filteredNodes[1].id).toBe('node2');
  });

  // Тест на сохранение в localStorage
  it('saves tags and relations to localStorage', () => {
    const { result } = renderHook(() => useTags({
      storageKey: 'test-tags'
    }));
    
    let tagId: string;
    
    act(() => {
      const newTag = result.current.createTag('New Tag');
      tagId = newTag.id;
    });
    
    act(() => {
      result.current.addTagToNode(tagId, 'node1', 'tree1');
    });
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test-tags',
      expect.any(String)
    );
    
    const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1]);
    expect(savedData.tags.length).toBe(1);
    expect(savedData.tags[0].name).toBe('New Tag');
    expect(savedData.relations.length).toBe(1);
  });

  // Тест на загрузку из localStorage
  it('loads tags and relations from localStorage', () => {
    const storageData = {
      tags: [{ id: 'tag1', name: 'Tag 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }],
      relations: [{ tagId: 'tag1', nodeId: 'node1', treeId: 'tree1' }]
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storageData));
    
    const { result } = renderHook(() => useTags({
      storageKey: 'test-tags'
    }));
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-tags');
    expect(result.current.tags.length).toBe(1);
    expect(result.current.tags[0].name).toBe('Tag 1');
    expect(result.current.relations.length).toBe(1);
  });
});