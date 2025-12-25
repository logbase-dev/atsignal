'use client';

import { useEffect, useState } from 'react';
import { getMenus, deleteMenu } from '@/lib/admin/menuService';
import { getPages, getPagesByMenuId } from '@/lib/admin/pageService';
import { buildMenuTree, moveMenuToNewParent, reorderMenusInSameLevel, type MenuNode } from '@/utils/adminMenuTree';
import { MenuTree } from './MenuTree';
import { MenuModal } from './MenuModal';
import type { Menu, Page, PageType, Site } from '@/lib/admin/types';
import { adminFetch } from '@/lib/admin/api';

interface MenuManagementProps {
  site: Site;
  title: string;
}

export function MenuManagement({ site, title }: MenuManagementProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | undefined>();
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());

  useEffect(() => {
    void loadMenus();
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await adminFetch('admins');
      if (!response.ok) return;
      const data = await response.json();
      const adminMap = new Map<string, { name: string; username: string }>();
      (data?.admins || []).forEach((admin: { id?: string; name: string; username: string }) => {
        if (admin.id) adminMap.set(admin.id, { name: admin.name, username: admin.username });
      });
      setAdmins(adminMap);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      // 성능 최적화: 페이지 메타데이터만 가져오기 (content 필드 제외)
      const [menuData, pageData] = await Promise.all([
        getMenus(site),
        getPages(site, { minimal: true }), // minimal 옵션으로 메타데이터만 가져오기
      ]);
      setMenus(menuData);
      setPages(pageData);
    } catch (error: any) {
      console.error('Failed to load menus:', error);
      alert(`메뉴를 불러오는 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`);
      setMenus([]);
      setPages([]);
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

  const getChildMenuIds = (parentId: string): string[] => {
    const children: string[] = [];
    menus.forEach((menu) => {
      if (menu.parentId === parentId && menu.id) {
        children.push(menu.id);
        children.push(...getChildMenuIds(menu.id));
      }
    });
    return children;
  };

  const handleDelete = async (id: string) => {
    const childMenuIds = getChildMenuIds(id);
    if (childMenuIds.length > 0) {
      alert('하위 메뉴가 존재하므로 삭제할 수 없습니다.\n하위 메뉴를 먼저 삭제해야 합니다.');
      return;
    }

    const menuToDelete = menus.find((m) => m.id === id);
    const menuName = menuToDelete?.labels.ko || '메뉴';

    try {
      const connectedPages = await getPagesByMenuId(id, site);
      if (connectedPages.length > 0) {
        const pageTitles = connectedPages
          .map((page) => {
            const t = page.labelsLive?.ko || page.labelsDraft?.ko || '제목 없음';
            return `(페이지 제목: ${t})`;
          })
          .join('\n');
        if (!confirm(`메뉴에 연결된 페이지가 있습니다. 페이지도 같이 삭제하시겠습니까?\n\n${pageTitles}`)) return;
      } else {
        if (!confirm(`"${menuName}" 메뉴를 삭제하시겠습니까?`)) return;
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
    const parent = menus.find((m) => m.id === parentId);
    if (!parent) return;

    const siblings = menus.filter((m) => m.parentId === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((m) => m.order)) + 1 : 1;

    const parentPath = parent.path || '';
    const initialPath = parentPath ? `${parentPath}/` : '';

    setEditingMenu({
      site: parent.site,
      labels: { ko: '', en: '' },
      path: initialPath,
      depth: parent.depth + 1,
      parentId,
      order: maxOrder,
      enabled: { ko: true, en: false },
    } as Menu);
    setIsModalOpen(true);
  };

  const handleToggleEnabled = async (id: string, locale: 'ko' | 'en') => {
    try {
      const menu = menus.find((m) => m.id === id);
      if (!menu) return;

      const newEnabledState = !menu.enabled[locale];
      const childMenuIds = getChildMenuIds(id);

      if (newEnabledState && menu.parentId && menu.parentId !== '0') {
        const parent = menus.find((m) => m.id === menu.parentId);
        if (parent && !parent.enabled[locale]) {
          alert(`부모 메뉴 "${parent.labels.ko}"가 비활성화되어 있어 자식 메뉴를 활성화할 수 없습니다.\n부모 메뉴를 먼저 활성화해주세요.`);
          return;
        }
      }

      if (!newEnabledState && childMenuIds.length > 0) {
        const updatePromises: Array<Promise<Response | void>> = [
          adminFetch(`menus/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ enabled: { ...menu.enabled, [locale]: false } }),
          }),
          ...childMenuIds.map((childId) => {
            const childMenu = menus.find((m) => m.id === childId);
            if (childMenu && childMenu.enabled[locale]) {
              return adminFetch(`menus/${childId}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled: { ...childMenu.enabled, [locale]: false } }),
              });
            }
            return Promise.resolve();
          }),
        ];

        const responses = await Promise.all(updatePromises);
        for (const response of responses) {
          if (response instanceof Response && !response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error?.error || '메뉴 상태 변경에 실패했습니다.');
          }
        }
      } else {
        const response = await adminFetch(`menus/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ enabled: { ...menu.enabled, [locale]: newEnabledState } }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.error || '메뉴 상태 변경에 실패했습니다.');
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
    if (editingMenu?.id) {
      const response = await adminFetch(`menus/${editingMenu.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...menuData, site }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || '메뉴 수정에 실패했습니다.');
      }
    } else {
      const response = await adminFetch('menus', {
        method: 'POST',
        body: JSON.stringify({ ...menuData, site }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || '메뉴 생성에 실패했습니다.');
      }
    }
    await loadMenus();
  };

  const handleDragEnd = async (activeId: string, overId: string | null, activeIndex: number, overIndex: number) => {
    if (!overId || activeId === overId) return;
    const draggedMenu = menus.find((m) => m.id === activeId);
    if (!draggedMenu) return;

    try {
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

      const overNode = findNodeInTree(treeNodes, overId);
      if (overNode) {
        if (overNode.parentId === draggedMenu.parentId) {
          const updates = reorderMenusInSameLevel(menus, activeId, overIndex);
          await Promise.all(
            updates.map((u) =>
              adminFetch(`menus/${u.id}`, {
                method: 'PUT',
                body: JSON.stringify({ order: u.order }),
              }).then((res) => {
                if (!res.ok) throw new Error('메뉴 순서 변경에 실패했습니다.');
              }),
            ),
          );
        } else {
          const updates = moveMenuToNewParent(menus, activeId, overNode.parentId, overIndex);
          await Promise.all(
            updates.map((u) =>
              adminFetch(`menus/${u.id}`, {
                method: 'PUT',
                body: JSON.stringify({ parentId: u.parentId, depth: u.depth, order: u.order }),
              }).then((res) => {
                if (!res.ok) throw new Error('메뉴 이동에 실패했습니다.');
              }),
            ),
          );
        }
      } else {
        const updates = reorderMenusInSameLevel(menus, activeId, overIndex);
        await Promise.all(
          updates.map((u) =>
            adminFetch(`menus/${u.id}`, {
              method: 'PUT',
              body: JSON.stringify({ order: u.order }),
            }).then((res) => {
              if (!res.ok) throw new Error('메뉴 순서 변경에 실패했습니다.');
            }),
          ),
        );
      }

      await loadMenus();
    } catch (error) {
      console.error('Failed to reorder menus:', error);
      alert('메뉴 순서 변경에 실패했습니다.');
    }
  };

  const canDrop = (draggedId: string, targetParentId: string): boolean => {
    if (targetParentId === '0' || targetParentId === draggedId) return true;
    const getAllDescendantIds = (menuId: string): string[] => {
      const descendants: string[] = [];
      const findChildren = (parentId: string) => {
        menus.forEach((menu) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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
              fontSize: '1rem',
            }}
          >
            메뉴 추가
          </button>
        </div>
      </div>

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
          admins={admins}
        />
      )}

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


