import { MenuNode } from '@/types/menu';
import { pathToUrl } from '@/utils/menu';

/**
 * Firestore 메뉴 배열을 MenuNode 트리 구조로 변환
 */
export function buildMenuTreeFromFirestore(menus: any[], locale: 'ko' | 'en'): MenuNode[] {
  const menuMap = new Map<string, any>();
  const roots: MenuNode[] = [];

  // 모든 메뉴를 맵에 저장하고 MenuNode 형태로 변환
  menus.forEach(menu => {
    if (menu.id) {
      const label = menu.label || menu.labels?.[locale] || menu.labels?.ko || '';
      const path = menu.path || '';
      
      menuMap.set(menu.id, {
        id: menu.id,
        name: label,
        path: menu.isExternal ? path : normalizePath(path),
        url: menu.isExternal ? path : undefined,
        isExternal: menu.isExternal || false,
        description: menu.description?.[locale] || menu.description?.ko, // description이 LocalizedField일 수 있음
        children: [],
        order: menu.order || 0,
      });
    }
  });

  // 트리 구조 생성
  menus.forEach(menu => {
    if (!menu.id) return;
    
    const node = menuMap.get(menu.id)!;
    
    if (menu.parentId && menu.parentId !== '0' && menuMap.has(menu.parentId)) {
      const parent = menuMap.get(menu.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 정렬
  const sortNodes = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => {
      // order 속성이 있으면 사용, 없으면 name으로 정렬
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      return aOrder - bOrder;
    });
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
 * 경로 정규화 (앞뒤 슬래시 제거)
 */
function normalizePath(input: string): string {
  if (!input) return '/';
  const trimmed = input.trim();
  const withoutExtraSlashes = trimmed.replace(/\/{2,}/g, '/').replace(/\/+$/g, '');
  const withLeadingSlash = withoutExtraSlashes.startsWith('/')
    ? withoutExtraSlashes
    : `/${withoutExtraSlashes}`;
  return withLeadingSlash;
}

/**
 * MenuNode를 평탄화 (모든 노드를 배열로 반환)
 */
export function flattenMenuTree(tree: MenuNode[]): MenuNode[] {
  const result: MenuNode[] = [];
  
  function traverse(nodes: MenuNode[]) {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }
  
  traverse(tree);
  return result;
}

