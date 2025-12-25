'use client';

import type { BlogCategory } from './types';
import { getAdminApiUrl } from './api';

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const response = await fetch(getAdminApiUrl('blog/categories'), { credentials: 'include' });
  if (!response.ok) throw new Error('블로그 카테고리를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return (data.categories || []) as BlogCategory[];
}

export async function createBlogCategory(category: Omit<BlogCategory, 'id'>): Promise<string> {
  const response = await fetch(getAdminApiUrl('blog/categories'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '블로그 카테고리 생성에 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return data.id as string;
}

export async function updateBlogCategory(id: string, patch: Partial<BlogCategory>): Promise<void> {
  const response = await fetch(getAdminApiUrl(`blog/categories/${id}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '블로그 카테고리 수정에 실패했습니다.');
  }
}

export async function deleteBlogCategory(id: string): Promise<void> {
  const response = await fetch(getAdminApiUrl(`blog/categories/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '블로그 카테고리 삭제에 실패했습니다.');
  }
}


