import type { Menu } from '@/lib/admin/types';

export interface MenuNode extends Menu {
  children?: MenuNode[];
}

export function buildMenuTree(menus: Menu[]): MenuNode[] {
  const menuMap = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  menus.forEach((menu) => {
    if (menu.id) {
      menuMap.set(menu.id, { ...menu, children: [] });
    }
  });

  menus.forEach((menu) => {
    if (!menu.id) return;
    const node = menuMap.get(menu.id);
    if (!node) return;

    if (menu.parentId && menu.parentId !== '0' && menuMap.has(menu.parentId)) {
      const parent = menuMap.get(menu.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

export function flattenMenuTree(nodes: MenuNode[]): Menu[] {
  const result: Menu[] = [];

  const traverse = (node: MenuNode) => {
    const { children, ...menu } = node;
    result.push(menu);
    if (children) {
      children.forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return result;
}

export function moveMenuToNewParent(
  menus: Menu[],
  draggedMenuId: string,
  newParentId: string,
  newIndex: number,
): Array<{ id: string; parentId: string; depth: number; order: number }> {
  const draggedMenu = menus.find((m) => m.id === draggedMenuId);
  if (!draggedMenu) throw new Error(`Menu with id ${draggedMenuId} not found`);

  const oldParentId = draggedMenu.parentId;
  const newParent = menus.find((m) => m.id === newParentId);
  const newDepth = newParentId === '0' ? 1 : (newParent?.depth || 0) + 1;

  const newSiblings = menus.filter((m) => m.parentId === newParentId && m.id !== draggedMenuId);
  newSiblings.sort((a, b) => a.order - b.order);

  const updates: Array<{ id: string; parentId: string; depth: number; order: number }> = [];
  updates.push({ id: draggedMenuId, parentId: newParentId, depth: newDepth, order: newIndex + 1 });

  newSiblings.forEach((sibling, index) => {
    const order = index < newIndex ? index + 1 : index + 2;
    updates.push({ id: sibling.id!, parentId: newParentId, depth: sibling.depth, order });
  });

  if (oldParentId !== newParentId) {
    const oldSiblings = menus.filter((m) => m.parentId === oldParentId && m.id !== draggedMenuId);
    oldSiblings.sort((a, b) => a.order - b.order);
    oldSiblings.forEach((sibling, index) => {
      updates.push({ id: sibling.id!, parentId: oldParentId, depth: sibling.depth, order: index + 1 });
    });
  }

  return updates;
}

export function reorderMenusInSameLevel(
  menus: Menu[],
  draggedMenuId: string,
  newIndex: number,
): Array<{ id: string; order: number }> {
  const draggedMenu = menus.find((m) => m.id === draggedMenuId);
  if (!draggedMenu) throw new Error(`Menu with id ${draggedMenuId} not found`);

  const parentId = draggedMenu.parentId;
  const siblings = menus.filter((m) => m.parentId === parentId && m.id !== draggedMenuId);
  siblings.sort((a, b) => a.order - b.order);

  const updates: Array<{ id: string; order: number }> = [];
  updates.push({ id: draggedMenuId, order: newIndex + 1 });
  siblings.forEach((sibling, index) => {
    const order = index < newIndex ? index + 1 : index + 2;
    updates.push({ id: sibling.id!, order });
  });
  return updates;
}


