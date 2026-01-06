'use client';

import type { GlossaryCategory } from './types';
import { getAdminApiUrl } from './api';

export async function getGlossaryCategories(): Promise<GlossaryCategory[]> {
  const response = await fetch(getAdminApiUrl('glossary-categories'), { credentials: 'include' });
  if (!response.ok) throw new Error(`Failed to fetch Glossary categories: ${response.statusText}`);
  const data = await response.json().catch(() => ({}));
  return (data.categories || []) as GlossaryCategory[];
}

export async function createGlossaryCategory(
  category: Omit<GlossaryCategory, 'id' | 'createdBy' | 'updatedBy'>,
): Promise<string> {
  const response = await fetch(getAdminApiUrl('glossary-categories'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '카테고리 생성에 실패했습니다.');
  }
  const result = await response.json().catch(() => ({}));
  return result.id as string;
}

export async function updateGlossaryCategory(
  id: string,
  category: Partial<Omit<GlossaryCategory, 'id' | 'createdBy'>>,
): Promise<void> {
  const response = await fetch(getAdminApiUrl(`glossary-categories/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '카테고리 수정에 실패했습니다.');
  }
}

export async function deleteGlossaryCategory(id: string): Promise<void> {
  const response = await fetch(getAdminApiUrl(`glossary-categories/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '카테고리 삭제에 실패했습니다.');
  }
}

export async function isCategoryInUse(categoryId: string): Promise<boolean> {
  const response = await fetch(
    getAdminApiUrl(`glossaries?categoryId=${encodeURIComponent(categoryId)}&limit=1`),
    {
      credentials: 'include',
    },
  );
  if (!response.ok) return false;
  const data = await response.json().catch(() => ({}));
  return (data.items || []).length > 0;
}

