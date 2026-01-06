/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import type { Page, PageDraftPayload, Site } from './types';
import { adminFetch } from './api';

export async function getPages(site: Site, options?: { minimal?: boolean }): Promise<Page[]> {
  const minimal = options?.minimal ? '&minimal=true' : '';
  const response = await adminFetch(`pages?site=${site}${minimal}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch pages: ${response.statusText}`);
  }

  const data = await response.json();
  return (data?.pages || []) as Page[];
}

export async function getPageById(id: string): Promise<Page | null> {
  const response = await adminFetch(`pages/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
  }
  const data = await response.json();
  return (data?.page || null) as Page | null;
}

export async function createPageDraft(site: Site, payload: PageDraftPayload): Promise<string> {
  const response = await adminFetch('pages', {
    method: 'POST',
    body: JSON.stringify({ site, payload }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to create page');
  }
  const data = await response.json().catch(() => ({}));
  return data?.id as string;
}

export async function updatePageDraft(pageId: string, payload: PageDraftPayload): Promise<void> {
  const response = await adminFetch(`pages/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'draft', payload }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to save draft');
  }
}

export async function publishPage(pageId: string, payload: PageDraftPayload): Promise<void> {
  const response = await adminFetch(`pages/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'publish', payload }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to publish page');
  }
}

export async function deletePage(id: string): Promise<void> {
  const response = await adminFetch(`pages/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to delete page');
  }
}

export async function getPagesByMenuId(menuId: string, site?: Site): Promise<Page[]> {
  // There is no dedicated endpoint; reuse list and filter client-side.
  // 메뉴 삭제 시에는 메타데이터만 필요하므로 minimal 옵션 사용
  if (site) {
    const pages = await getPages(site, { minimal: true });
    return pages.filter((p) => p.menuId === menuId);
  }
  const [webPages, docsPages] = await Promise.all([
    getPages('web', { minimal: true }),
    getPages('docs', { minimal: true }),
  ]);
  return [...webPages, ...docsPages].filter((p) => p.menuId === menuId);
}
 
