'use client';

import Link from 'next/link';
import { useMemo } from 'react';

interface MenuNode {
  id: string;
  label?: string;
  labels?: { ko: string; en?: string };
  path: string;
  pageType?: 'dynamic' | 'static' | 'notice' | 'links';  // 추가
  isExternal?: boolean;  // 하위 호환성을 위해 유지 (deprecated)
  children?: MenuNode[];
}

interface SidebarProps {
  menus: MenuNode[];
  locale: 'ko' | 'en';
  currentPath: string;
}

export function Sidebar({ menus, locale, currentPath }: SidebarProps) {
  // 현재 경로와 일치하는지 확인
  const isActive = (menuPath: string) => {
    if (menuPath === currentPath) return true;
    // 하위 경로인지 확인 (예: admin과 admin/test)
    return currentPath.startsWith(menuPath + '/');
  };

  const getMenuLabel = (menu: MenuNode): string => {
    return menu.label || menu.labels?.[locale] || menu.labels?.ko || '';
  };

  // 메뉴 트리에서 특정 경로를 가진 메뉴를 찾는 함수
  const findMenuByPath = (menuList: MenuNode[], targetPath: string): MenuNode | null => {
    for (const menu of menuList) {
      if (menu.path === targetPath) {
        return menu;
      }
      if (menu.children) {
        const found = findMenuByPath(menu.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  // 현재 메뉴의 루트까지의 경로를 추적하는 함수
  const findMenuPath = (menuList: MenuNode[], targetPath: string, path: MenuNode[] = []): MenuNode[] | null => {
    for (const menu of menuList) {
      const currentPath = [...path, menu];
      if (menu.path === targetPath) {
        return currentPath;
      }
      if (menu.children) {
        const found = findMenuPath(menu.children, targetPath, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  // 필터링된 메뉴 트리 생성
  const filteredMenus = useMemo(() => {
    // currentPath와 일치하는 메뉴 경로 찾기
    const menuPath = findMenuPath(menus, currentPath);
    
    if (!menuPath || menuPath.length === 0) {
      // 현재 경로를 찾을 수 없으면 전체 메뉴 반환
      return menus;
    }

    // 항상 depth 1(최상위) 메뉴를 기준으로 그 하위의 모든 메뉴 표시
    const rootMenu = menuPath[0];
    
    // depth 1 메뉴의 모든 하위 메뉴를 포함한 트리 반환
    return [{
      ...rootMenu,
      children: rootMenu.children || [],
    }];
  }, [menus, currentPath]);

  const renderMenu = (menu: MenuNode, depth: number = 0) => {
    const active = isActive(menu.path);
    const hasChildren = menu.children && menu.children.length > 0;
    const menuLabel = getMenuLabel(menu);
    const isExternal = menu.pageType === 'links' || menu.isExternal; // pageType 우선, 하위 호환성 유지

    return (
      <div key={menu.id} style={{ marginBottom: depth === 0 ? '0.5rem' : '0' }}>
        {/* 하위 메뉴가 있으면 링크 없이 텍스트만 표시, 없으면 링크 표시 */}
        {hasChildren ? (
          <span
            style={{
              display: 'block',
              padding: '0.5rem 0.75rem',
              paddingLeft: `${0.75 + depth * 1.25}rem`,
              fontSize: depth === 0 ? '0.9rem' : '0.85rem',
              fontWeight: depth === 0 ? 600 : 400,
              color: active ? '#2563eb' : '#6b7280',
              borderRadius: '0.375rem',
              transition: 'all 0.2s',
              backgroundColor: active ? '#eff6ff' : 'transparent',
              cursor: 'default',
            }}
          >
            {menuLabel}
          </span>
        ) : isExternal ? (
          <a
            href={menu.path}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '0.5rem 0.75rem',
              paddingLeft: `${0.75 + depth * 1.25}rem`,
              fontSize: depth === 0 ? '0.9rem' : '0.85rem',
              fontWeight: depth === 0 ? 600 : 400,
              color: active ? '#2563eb' : '#6b7280',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              transition: 'all 0.2s',
              backgroundColor: active ? '#eff6ff' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.color = '#111827';
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {menuLabel}
          </a>
        ) : (
          <Link
            href={`/${locale}/${menu.path}`}
            style={{
              display: 'block',
              padding: '0.5rem 0.75rem',
              paddingLeft: `${0.75 + depth * 1.25}rem`,
              fontSize: depth === 0 ? '0.9rem' : '0.85rem',
              fontWeight: depth === 0 ? 600 : 400,
              color: active ? '#2563eb' : '#6b7280',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              transition: 'all 0.2s',
              backgroundColor: active ? '#eff6ff' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.color = '#111827';
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {menuLabel}
          </Link>
        )}
        {hasChildren && (
          <div style={{ marginTop: '0.25rem' }}>
            {menu.children!.map((child) => renderMenu(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="page-renderer-sidebar">
      <nav className="sidebar-container">
        <div className="sidebar-header">
          <span className="sidebar-title">문서</span>
        </div>
        <div className="sidebar-menu">
          {filteredMenus.map((menu) => renderMenu(menu))}
        </div>
      </nav>
    </aside>
  );
}

