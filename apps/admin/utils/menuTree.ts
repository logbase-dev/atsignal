import type { Menu } from '@/lib/admin/types';

export interface MenuNode extends Menu {
  children?: MenuNode[];
}

/**
 * 평면 배열을 트리 구조로 변환
 */
export function buildMenuTree(menus: Menu[]): MenuNode[] {
  const menuMap = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  // 모든 메뉴를 맵에 저장
  menus.forEach(menu => {
    if (menu.id) {
      menuMap.set(menu.id, { ...menu, children: [] });
    }
  });

  // 트리 구조 생성
  menus.forEach(menu => {
    if (!menu.id) return;
    
    const node = menuMap.get(menu.id)!;
    
    // parentId가 "0"이 아니고 부모가 존재하면 하위 메뉴로 추가
    if (menu.parentId && menu.parentId !== '0' && menuMap.has(menu.parentId)) {
      const parent = menuMap.get(menu.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      // parentId가 "0"이거나 없으면 최상위 메뉴
      roots.push(node);
    }
  });

  // 정렬 함수
  const sortNodes = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };
  
  sortNodes(roots);
  return roots;
}

/**
 * 트리에서 모든 노드를 평면 배열로 변환 (부모-자식 관계 유지)
 */
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

/**
 * 같은 부모 내에서 메뉴 순서 재계산
 * @param menus 전체 메뉴 배열
 * @param parentId 부모 ID ("0"이면 최상위)
 * @returns 재계산된 order 값이 포함된 업데이트할 메뉴 배열
 */
export function reorderMenusInSameParent(
  menus: Menu[],
  parentId: string
): Array<{ id: string; order: number }> {
  // 같은 부모를 가진 메뉴들 필터링
  const siblings = menus.filter(m => m.parentId === parentId);
  
  // order로 정렬
  siblings.sort((a, b) => a.order - b.order);
  
  // order를 1부터 순차적으로 재할당
  return siblings.map((menu, index) => ({
    id: menu.id!,
    order: index + 1,
  }));
}

/**
 * 메뉴를 다른 부모로 이동하고 관련 메뉴들의 order 재계산
 * @param menus 전체 메뉴 배열
 * @param draggedMenuId 드래그된 메뉴 ID
 * @param newParentId 새로운 부모 ID
 * @param newIndex 새로운 위치 인덱스
 * @returns 업데이트할 메뉴 배열 (draggedMenu, 새 부모의 자식들, 기존 부모의 자식들)
 */
export function moveMenuToNewParent(
  menus: Menu[],
  draggedMenuId: string,
  newParentId: string,
  newIndex: number
): Array<{ id: string; parentId: string; depth: number; order: number }> {
  const draggedMenu = menus.find(m => m.id === draggedMenuId);
  if (!draggedMenu) {
    throw new Error(`Menu with id ${draggedMenuId} not found`);
  }

  const oldParentId = draggedMenu.parentId;
  const newParent = menus.find(m => m.id === newParentId);
  const newDepth = newParentId === '0' ? 1 : (newParent?.depth || 0) + 1;

  // 새 부모의 자식들 (드래그된 메뉴 제외)
  const newSiblings = menus.filter(
    m => m.parentId === newParentId && m.id !== draggedMenuId
  );
  newSiblings.sort((a, b) => a.order - b.order);

  // 새 위치에 맞게 order 재계산
  const updates: Array<{ id: string; parentId: string; depth: number; order: number }> = [];

  // 드래그된 메뉴 업데이트
  updates.push({
    id: draggedMenuId,
    parentId: newParentId,
    depth: newDepth,
    order: newIndex + 1,
  });

  // 새 부모의 기존 자식들 order 재계산
  newSiblings.forEach((sibling, index) => {
    const order = index < newIndex ? index + 1 : index + 2;
    updates.push({
      id: sibling.id!,
      parentId: newParentId,
      depth: sibling.depth,
      order,
    });
  });

  // 기존 부모의 자식들 order 재계산 (드래그된 메뉴 제외)
  if (oldParentId !== newParentId) {
    const oldSiblings = menus.filter(
      m => m.parentId === oldParentId && m.id !== draggedMenuId
    );
    oldSiblings.sort((a, b) => a.order - b.order);
    oldSiblings.forEach((sibling, index) => {
      updates.push({
        id: sibling.id!,
        parentId: oldParentId,
        depth: sibling.depth,
        order: index + 1,
      });
    });
  }

  return updates;
}

/**
 * 같은 부모 내에서 메뉴 순서 변경
 * @param menus 전체 메뉴 배열
 * @param draggedMenuId 드래그된 메뉴 ID
 * @param newIndex 새로운 위치 인덱스
 * @returns 업데이트할 메뉴 배열
 */
export function reorderMenusInSameLevel(
  menus: Menu[],
  draggedMenuId: string,
  newIndex: number
): Array<{ id: string; order: number }> {
  const draggedMenu = menus.find(m => m.id === draggedMenuId);
  if (!draggedMenu) {
    throw new Error(`Menu with id ${draggedMenuId} not found`);
  }

  const parentId = draggedMenu.parentId;
  const siblings = menus.filter(
    m => m.parentId === parentId && m.id !== draggedMenuId
  );
  siblings.sort((a, b) => a.order - b.order);

  const updates: Array<{ id: string; order: number }> = [];

  // 드래그된 메뉴의 새 order
  updates.push({
    id: draggedMenuId,
    order: newIndex + 1,
  });

  // 다른 형제들의 order 재계산
  siblings.forEach((sibling, index) => {
    const order = index < newIndex ? index + 1 : index + 2;
    updates.push({
      id: sibling.id!,
      order,
    });
  });

  return updates;
}

