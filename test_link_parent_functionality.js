// Тестовый скрипт для проверки функциональности ссылок с дочерними элементами

// Функция для создания тестового узла-ссылки с дочерними элементами
function createTestLinkWithChildren() {
  return {
    id: 'test-link-with-children',
    title: 'Тестовая ссылка с дочерними элементами',
    url: 'https://example.com',
    children: [
      {
        id: 'child-1',
        title: 'Дочерний элемент 1',
        url: 'https://example.com/child1'
      },
      {
        id: 'child-folder',
        title: 'Дочерняя папка',
        children: [
          {
            id: 'grandchild-1',
            title: 'Вложенный элемент',
            url: 'https://example.com/grandchild'
          }
        ]
      }
    ]
  };
}

// Функция для создания тестовой структуры данных
function createTestTree() {
  return {
    id: 'test-tree',
    title: 'Тестовое дерево',
    nodes: [
      {
        id: 'regular-link',
        title: 'Обычная ссылка',
        url: 'https://example.com'
      },
      createTestLinkWithChildren(),
      {
        id: 'regular-folder',
        title: 'Обычная папка',
        children: [
          {
            id: 'folder-child',
            title: 'Элемент в папке',
            url: 'https://example.com/folder-child'
          }
        ]
      }
    ]
  };
}

console.log('Тестовая структура создана успешно:');
console.log(JSON.stringify(createTestTree(), null, 2));

// Проверка функциональности добавления дочерних элементов к ссылке
function testAddChildToLink() {
  const linkNode = createTestLinkWithChildren();
  const newChild = {
    id: 'new-child',
    title: 'Новый дочерний элемент',
    url: 'https://example.com/new-child'
  };
  
  // Имитация функции insertChild из treeOps.ts
  function insertChild(list, parentId, child) {
    if (parentId === null) return [child, ...list];
    return list.map(n => {
      if (n.id === parentId) {
        return { ...n, children: n.children ? [child, ...n.children] : [child] };
      }
      if (n.children) {
        return { ...n, children: insertChild(n.children, parentId, child) };
      }
      return n;
    });
  }
  
  // Добавляем новый дочерний элемент к тестовой ссылке
  const updatedNode = {
    ...linkNode,
    children: [...linkNode.children, newChild]
  };
  
  console.log('Ссылка с новым дочерним элементом:');
  console.log(JSON.stringify(updatedNode, null, 2));
  
  return updatedNode;
}

testAddChildToLink();