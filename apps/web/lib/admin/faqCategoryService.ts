'use client';

import type { FAQCategory } from './types';
import { getAdminApiUrl } from './api';

export async function getFAQCategories(): Promise<FAQCategory[]> {
  const response = await fetch(getAdminApiUrl('faq-categories'), { credentials: 'include' });
  if (!response.ok) throw new Error(`Failed to fetch FAQ categories: ${response.statusText}`);
  const data = await response.json().catch(() => ({}));
  return (data.categories || []) as FAQCategory[];
}

export async function deleteFAQCategory(id: string): Promise<void> {
  const response = await fetch(getAdminApiUrl(`faq-categories/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'FAQ 카테고리 삭제에 실패했습니다.');
  }
}

export async function isCategoryInUse(categoryId: string): Promise<boolean> {
  const response = await fetch(getAdminApiUrl(`faqs?categoryId=${encodeURIComponent(categoryId)}&limit=1`), {
    credentials: 'include',
  });
  if (!response.ok) return false;
  const data = await response.json().catch(() => ({}));
  return (data.faqs || []).length > 0;
}


