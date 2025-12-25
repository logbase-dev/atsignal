'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMenus } from '@/lib/admin/menuService';
import { deletePage, getPages } from '@/lib/admin/pageService';
import { buildMenuTree, flattenMenuTree } from '@/utils/adminMenuTree';
import type { Menu, Page, Site } from '@/lib/admin/types';
import type { MenuOption } from '../types';

export function usePages(site: Site) {
  const [pages, setPages] = useState<Page[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pageList, menuList] = await Promise.all([getPages(site), getMenus(site)]);
      setPages(pageList);
      setMenus(menuList);
    } catch (err) {
      console.error('[usePages] Failed to fetch data', err);
      setError('데이터를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const menuOptions = useMemo<MenuOption[]>(() => {
    const validMenus = menus.filter((menu): menu is Menu & { id: string } => Boolean(menu.id));
    const tree = buildMenuTree(validMenus);
    const flattened = flattenMenuTree(tree);
    return flattened
      .filter((menu) => menu.pageType !== 'links')
      .map((menu) => ({
        id: menu.id!,
        depth: menu.depth,
        path: menu.path,
        label: `${menu.labels.ko}${menu.labels.en ? ` / ${menu.labels.en}` : ''}`,
        enabled: menu.enabled.ko || menu.enabled.en,
      }));
  }, [menus]);

  const handleDelete = async (id: string) => {
    try {
      await deletePage(id);
      await refresh();
    } catch (err) {
      console.error('[usePages] Failed to delete page', err);
      setError('페이지 삭제에 실패했습니다.');
      throw err;
    }
  };

  return {
    pages,
    menus,
    menuOptions,
    loading,
    error,
    handleDelete,
    refresh,
  };
}


