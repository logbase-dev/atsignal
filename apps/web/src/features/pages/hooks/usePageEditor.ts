'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMenus } from '@/lib/admin/menuService';
import { createPageDraft, deletePage, getPageById, getPages, publishPage, updatePageDraft } from '@/lib/admin/pageService';
import { buildMenuTree, flattenMenuTree } from '@/utils/adminMenuTree';
import type { Menu, Page, Site, PageDraftPayload } from '@/lib/admin/types';
import type { MenuOption, PageFormValues } from '../types';
import { buildPreviewUrl } from '@/lib/admin/preview';

export function usePageEditor(site: Site, pageId: string | null) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuList, pageList, pageData] = await Promise.all([
        getMenus(site),
        getPages(site),
        pageId ? getPageById(pageId) : Promise.resolve(null),
      ]);
      setMenus(menuList);
      setPages(pageList);
      if (pageData) {
        if (pageData.site !== site) {
          setError('이 페이지는 현재 사이트에 속하지 않습니다.');
          return;
        }
        setPage(pageData);
      } else if (pageId) {
        setError('페이지를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('[usePageEditor] Failed to load data', err);
      setError('데이터를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [site, pageId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const menuOptions = useMemo<MenuOption[]>(() => {
    const validMenus = menus.filter((menu): menu is Menu & { id: string } => Boolean(menu.id));

    const usedMenuIds = new Set(pages.filter((p) => p.id !== pageId && p.menuId).map((p) => p.menuId));

    const childrenMap = new Map<string, boolean>();
    validMenus.forEach((menu) => {
      if (menu.id && menu.parentId && menu.parentId !== '0') {
        childrenMap.set(menu.parentId, true);
      }
    });

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
        hasPage: usedMenuIds.has(menu.id!),
        hasChildren: childrenMap.has(menu.id!) || false,
      }));
  }, [menus, pages, pageId]);

  const persistDraft = async (values: PageFormValues, options: { silent?: boolean; refresh?: boolean } = {}) => {
    const { silent = false, refresh = true } = options;
    if (!silent) setSubmitting(true);
    try {
      const payload: PageDraftPayload = {
        menuId: values.menuId,
        slug: values.slug,
        labels: values.labels,
        content: values.content,
        editorType: values.editorType,
        saveFormat: values.saveFormat,
      };

      let id: string;
      if (pageId) {
        await updatePageDraft(pageId, payload);
        id = pageId;
      } else {
        id = await createPageDraft(site, payload);
      }

      if (!pageId) {
        router.replace(`/admin/pages/${site}/${id}`);
      } else if (refresh) {
        await loadData();
      }

      return id;
    } catch (err) {
      console.error('[usePageEditor] Failed to save draft', err);
      setError('드래프트 저장에 실패했습니다.');
      throw err;
    } finally {
      if (!silent) setSubmitting(false);
    }
  };

  const handleSaveDraft = async (values: PageFormValues) => {
    await persistDraft(values);
  };

  const handlePublish = async (values: PageFormValues) => {
    const id = await persistDraft(values, { refresh: false });
    try {
      setSubmitting(true);
      const payload: PageDraftPayload = {
        menuId: values.menuId,
        slug: values.slug,
        labels: values.labels,
        content: values.content,
        editorType: values.editorType,
        saveFormat: values.saveFormat,
      };
      await publishPage(id, payload);
      router.push(`/admin/menus/${site}`);
    } catch (err) {
      console.error('[usePageEditor] Failed to publish page', err);
      setError('페이지 게시에 실패했습니다.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async (values: PageFormValues, locale: 'ko' | 'en') => {
    const id = await persistDraft(values, { silent: true, refresh: false });
    return buildPreviewUrl(site, values.slug, locale, id);
  };

  const handleDelete = async () => {
    if (!pageId || !page?.id) return;
    try {
      await deletePage(page.id);
      router.push(`/admin/menus/${site}`);
    } catch (err) {
      console.error('[usePageEditor] Failed to delete page', err);
      setError('페이지 삭제에 실패했습니다.');
      throw err;
    }
  };

  return {
    page,
    menus,
    menuOptions,
    loading,
    error,
    submitting,
    handleSaveDraft,
    handlePublish,
    handlePreview,
    handleDelete,
  };
}


