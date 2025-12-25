'use client';

import { useEffect, useState } from 'react';
import { getMenus, deleteMenu } from '@/lib/admin/menuService';
import { getPagesByMenuId, getPages } from '@/lib/admin/pageService';
import { buildMenuTree, reorderMenusInSameLevel, moveMenuToNewParent, type MenuNode } from '@/utils/menuTree';
import { MenuTree } from './MenuTree';
import { MenuModal } from './MenuModal';
import type { Menu, Site, Page, PageType } from '@/lib/admin/types';

interface MenuManagementProps {
  site: Site;
  title: string; // "Web 사이트 메뉴 관리" 또는 "Docs 사이트 메뉴 관리"
}

export function MenuManagement({ site, title }: MenuManagementProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | undefined>();

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    setLoading(true);
    try {
      console.log(`[MenuManagement] Loading menus and pages for site=${site}`);
      const startTime = Date.now();
      const [menuData, pageData] = await Promise.all([
        getMenus(site),
        getPages(site),
      ]);
      const endTime = Date.now();
      console.log(`[MenuManagement] Loaded ${menuData.length} menus and ${pageData.length} pages in ${endTime - startTime}ms`);
      setMenus(menuData);
      setPages(pageData);
    } catch (error: any) {
      console.error('Failed to load menus:', error);
      const errorMessage = error.message || '메뉴를 불러오는데 실패했습니다.';
      alert(`메뉴 로드 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMenu(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (menu: MenuNode) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  /**
   * 특정 메뉴의 모든 하위 메뉴 ID를 재귀적으로 수집
   */
  const getChildMenuIds = (parentId: string): string[] => {
    const children: string[] = [];
    menus.forEach(menu => {
      if (menu.parentId === parentId && menu.id) {
        children.push(menu.id);
        // 재귀적으로 하위 메뉴의 하위 메뉴도 수집
        const grandchildren = getChildMenuIds(menu.id);
        children.push(...grandchildren);
      }
    });
    return children;
  };

  const handleDelete = async (id: string) => {
    // 하위 메뉴 확인
    const childMenuIds = getChildMenuIds(id);
    
    if (childMenuIds.length > 0) {
      alert('하위 메뉴가 존재하므로 삭제할 수 없습니다.\n하위 메뉴를 먼저 삭제해야 합니다.');
      return;
    }

    // 삭제할 메뉴 정보 가져오기
    const menuToDelete = menus.find(m => m.id === id);
    const menuName = menuToDelete?.labels.ko || '메뉴';

    // 연결된 페이지 확인
    try {
      const connectedPages = await getPagesByMenuId(id);
      
      if (connectedPages.length > 0) {
        // 연결된 페이지가 있으면 바로 페이지 삭제 확인 메시지 (첫 번째 경고창 없이)
        const pageTitles = connectedPages.map(page => {
          const title = page.labelsLive?.ko || page.labelsDraft?.ko || '제목 없음';
          return `(페이지 제목: ${title})`;
        }).join('\n');
        
        const message = `메뉴에 연결된 페이지가 있습니다. 페이지도 같이 삭제하시겠습니까?\n\n${pageTitles}`;
        
        if (!confirm(message)) {
          return;
        }
      } else {
        // 연결된 페이지가 없으면 메뉴명 포함 확인 메시지
        if (!confirm(`"${menuName}" 메뉴를 삭제하시겠습니까?`)) {
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check connected pages:', error);
      alert('연결된 페이지를 확인하는데 실패했습니다.');
      return;
    }

    try {
      await deleteMenu(id);
      await loadMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleAddChild = (parentId: string) => {
    const parent = menus.find(m => m.id === parentId);
    if (parent) {
      // 같은 부모를 가진 형제 메뉴들의 최대 order 계산
      const siblings = menus.filter(m => m.parentId === parentId);
      const maxOrder = siblings.length > 0 
        ? Math.max(...siblings.map(m => m.order)) + 1 
        : 1;
      
      // 부모 경로를 자동으로 설정 (최상위가 아닌 경우)
      const parentPath = parent.path || '';
      const initialPath = parentPath ? `${parentPath}/` : '';
      
      setEditingMenu({
        site: parent.site,
        labels: { ko: '', en: '' },
        path: initialPath, // 부모 경로 + '/' 자동 설정
        depth: parent.depth + 1,
        parentId,
        order: maxOrder,
        enabled: {
          ko: true,
          en: false,
        },
      } as Menu);
      setIsModalOpen(true);
    }
  };

  const handleToggleEnabled = async (id: string, locale: 'ko' | 'en') => {
    try {
      const menu = menus.find(m => m.id === id);
      if (!menu) return;

      const newEnabledState = !menu.enabled[locale];
      const childMenuIds = getChildMenuIds(id);

      // 케이스 1: 자식 메뉴를 활성화하려고 할 때 부모가 비활성화인 경우
      if (newEnabledState && menu.parentId && menu.parentId !== '0') {
        const parent = menus.find(m => m.id === menu.parentId);
        if (parent && !parent.enabled[locale]) {
          alert(`부모 메뉴 "${parent.labels.ko}"가 비활성화되어 있어 자식 메뉴를 활성화할 수 없습니다.\n부모 메뉴를 먼저 활성화해주세요.`);
          return;
        }
      }

      // 케이스 2: 부모 메뉴를 비활성화할 때 → 모든 하위 메뉴도 비활성화
      if (!newEnabledState && childMenuIds.length > 0) {
        // 부모와 모든 하위 메뉴 업데이트
        const updatePromises = [
          fetch(`/api/menus/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enabled: {
                ...menu.enabled,
                [locale]: false,
              },
            }),
          }),
          // 모든 하위 메뉴 비활성화
          ...childMenuIds.map(childId => {
            const childMenu = menus.find(m => m.id === childId);
            if (childMenu && childMenu.enabled[locale]) {
              return fetch(`/api/menus/${childId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  enabled: {
                    ...childMenu.enabled,
                    [locale]: false,
                  },
                }),
              });
            }
            return Promise.resolve();
          }),
        ];
        const responses = await Promise.all(updatePromises);
        for (const response of responses) {
          if (response instanceof Response && !response.ok) {
            const error = await response.json();
            throw new Error(error.error || '메뉴 상태 변경에 실패했습니다.');
          }
        }
      } else {
        // 케이스 3: 부모 메뉴를 활성화할 때 → 자식은 그대로 유지 (변경 없음)
        // 케이스 4: 자식 메뉴를 비활성화할 때 → 단순 토글
        const response = await fetch(`/api/menus/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: {
              ...menu.enabled,
              [locale]: newEnabledState,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '메뉴 상태 변경에 실패했습니다.');
        }
      }

      await loadMenus();
    } catch (error) {
      console.error('Failed to toggle menu enabled:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleSubmit = async (menuData: {
    labels: { ko: string; en?: string };
    path: string;
    pageType?: PageType;
    depth: number;
    parentId: string;
    order: number;
    enabled: { ko: boolean; en: boolean };
    description?: { ko: string; en?: string };
  }) => {
    try {
      if (editingMenu && editingMenu.id) {
        // 수정: API 호출
        const response = await fetch(`/api/menus/${editingMenu.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...menuData,
            site,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '메뉴 수정에 실패했습니다.');
        }
      } else {
        // 추가: API 호출
        const response = await fetch('/api/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...menuData,
            site,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '메뉴 생성에 실패했습니다.');
        }
      }
      await loadMenus();
    } catch (error) {
      console.error('Failed to save menu:', error);
      throw error; // MenuModal에서 처리
    }
  };

  /**
   * 드래그 앤 드롭 종료 핸들러
   * @param activeId 드래그된 메뉴 ID
   * @param overId 드롭된 위치의 메뉴 ID 또는 부모 ID
   * @param activeIndex 드래그된 메뉴의 원래 인덱스
   * @param overIndex 드롭된 위치의 인덱스
   */
  const handleDragEnd = async (
    activeId: string,
    overId: string | null,
    activeIndex: number,
    overIndex: number
  ) => {
    if (!overId || activeId === overId) {
      return; // 드롭 위치가 없거나 같은 위치면 무시
    }

    const draggedMenu = menus.find(m => m.id === activeId);
    if (!draggedMenu) {
      console.error('Dragged menu not found:', activeId);
      return;
    }

    try {
      // 트리 구조에서 같은 레벨의 노드들 찾기
      const treeNodes = buildMenuTree(menus);
      const findNodeInTree = (nodes: MenuNode[], id: string): MenuNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNodeInTree(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const activeNode = findNodeInTree(treeNodes, activeId);
      const overNode = findNodeInTree(treeNodes, overId);

      if (!activeNode) {
        console.error('Active node not found in tree');
        return;
      }

      if (overNode) {
        // 다른 메뉴 위에 드롭: 같은 부모 내에서 순서 변경 또는 다른 부모로 이동
        if (overNode.parentId === draggedMenu.parentId) {
          // 같은 부모 내에서 순서 변경
          const updates = reorderMenusInSameLevel(menus, activeId, overIndex);
          await Promise.all(updates.map(u => 
            fetch(`/api/menus/${u.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: u.order }),
            }).then(res => {
              if (!res.ok) throw new Error('메뉴 순서 변경에 실패했습니다.');
            })
          ));
        } else {
          // 다른 부모로 이동
          const updates = moveMenuToNewParent(menus, activeId, overNode.parentId, overIndex);
          await Promise.all(updates.map(u => 
            fetch(`/api/menus/${u.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                parentId: u.parentId, 
                depth: u.depth, 
                order: u.order 
              }),
            }).then(res => {
              if (!res.ok) throw new Error('메뉴 이동에 실패했습니다.');
            })
          ));
        }
      } else {
        // 같은 부모 내에서 순서만 변경 (overId가 형제 노드의 ID)
        const updates = reorderMenusInSameLevel(menus, activeId, overIndex);
        await Promise.all(updates.map(u => 
          fetch(`/api/menus/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: u.order }),
          }).then(res => {
            if (!res.ok) throw new Error('메뉴 순서 변경에 실패했습니다.');
          })
        ));
      }

      await loadMenus();
    } catch (error) {
      console.error('Failed to reorder menus:', error);
      alert('메뉴 순서 변경에 실패했습니다.');
    }
  };

  /**
   * 자기 자신의 하위로 드래그하는지 확인
   */
  const canDrop = (draggedId: string, targetParentId: string): boolean => {
    if (targetParentId === '0' || targetParentId === draggedId) {
      return true; // 최상위로 이동하거나 자기 자신이면 허용
    }

    // 드래그된 메뉴의 모든 하위 메뉴 ID 수집
    const getAllDescendantIds = (menuId: string): string[] => {
      const descendants: string[] = [];
      const findChildren = (parentId: string) => {
        menus.forEach(menu => {
          if (menu.parentId === parentId && menu.id) {
            descendants.push(menu.id);
            findChildren(menu.id);
          }
        });
      };
      findChildren(menuId);
      return descendants;
    };

    const descendants = getAllDescendantIds(draggedId);
    return !descendants.includes(targetParentId);
  };

  const treeNodes = buildMenuTree(menus);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>{title}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={handleAdd}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            메뉴 추가
          </button>
        </div>
      </div>

      {/* 트리 뷰 */}
      {menus.length === 0 ? (
        <p style={{ color: '#666', padding: '2rem', textAlign: 'center' }}>
          메뉴가 없습니다. "메뉴 추가" 버튼을 클릭하여 메뉴를 추가하세요.
        </p>
      ) : (
        <MenuTree
          nodes={treeNodes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddChild={handleAddChild}
          onToggleEnabled={handleToggleEnabled}
          onDragEnd={handleDragEnd}
          canDrop={canDrop}
          menus={menus}
          pages={pages}
          site={site}
        />
      )}

      {/* 모달 */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        site={site}
        parentMenus={menus}
        initialMenu={editingMenu}
      />
    </div>
  );
}

