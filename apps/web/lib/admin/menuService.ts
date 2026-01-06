'use client';

import type { Menu, Site } from './types';
import { adminFetch } from './api';

export async function getMenus(site: Site): Promise<Menu[]> {
  const response = await adminFetch(`menus?site=${site}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch menus: ${response.statusText}`);
  }

  const data = await response.json();
  const menus = (data?.menus || []) as Menu[];
  return menus.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function deleteMenu(id: string): Promise<void> {
  const response = await adminFetch(`menus/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || '메뉴 삭제에 실패했습니다.');
  }
}


