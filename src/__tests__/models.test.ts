import { BookmarkNode } from '../models';

describe('BookmarkNode', () => {
  it('should create a bookmark node with correct properties', () => {
    const node: BookmarkNode = {
      id: 1,
      title: 'Test Bookmark',
      url: 'https://example.com',
      parentId: 0,
      treeId: 1,
      isFolder: false,
      position: 0
    };

    expect(node.id).toBe(1);
    expect(node.title).toBe('Test Bookmark');
    expect(node.url).toBe('https://example.com');
    expect(node.parentId).toBe(0);
    expect(node.treeId).toBe(1);
    expect(node.isFolder).toBe(false);
    expect(node.position).toBe(0);
  });
});