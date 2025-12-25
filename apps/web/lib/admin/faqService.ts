'use client';

import type { FAQ } from './types';
import { adminFetch } from './api';

export async function getFAQs(options?: {
  categoryId?: string;
  tags?: string[];
  search?: string;
  orderBy?: 'level' | 'isTop' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}): Promise<FAQ[]> {
  const params = new URLSearchParams();
  if (options?.categoryId) params.append('categoryId', options.categoryId);
  if (options?.tags?.length) {
    options.tags.forEach((tag) => params.append('tags', tag));
  }
  if (options?.search) params.append('search', options.search);
  if (options?.orderBy) params.append('orderBy', options.orderBy);
  if (options?.orderDirection) params.append('orderDirection', options.orderDirection);

  const qs = params.toString();
  const response = await adminFetch(`faqs${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch FAQs: ${response.statusText}`);
  }
  const data = await response.json().catch(() => ({}));
  return (data.faqs || []) as FAQ[];
}

export async function getFAQById(id: string): Promise<FAQ | null> {
  const response = await adminFetch(`faqs/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to fetch FAQ: ${response.statusText}`);
  const data = await response.json().catch(() => ({}));
  return (data.faq || null) as FAQ | null;
}

export async function createFAQ(faq: Omit<FAQ, 'id' | 'createdBy' | 'updatedBy'>): Promise<string> {
  const response = await adminFetch('faqs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faq),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'FAQ 생성에 실패했습니다.');
  }
  const result = await response.json().catch(() => ({}));
  return result.id as string;
}

export async function updateFAQ(
  id: string,
  faq: Partial<Omit<FAQ, 'id' | 'createdBy' | 'updatedBy'>>,
): Promise<void> {
  const response = await adminFetch(`faqs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faq),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'FAQ 수정에 실패했습니다.');
  }
}

export async function deleteFAQ(id: string): Promise<void> {
  const response = await adminFetch(`faqs/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'FAQ 삭제에 실패했습니다.');
  }
}

export async function getAllTags(): Promise<string[]> {
  // No dedicated endpoint; fetch FAQs and aggregate tags client-side.
  const faqs = await getFAQs();
  const tags = new Set<string>();
  for (const faq of faqs) {
    (faq.tags || []).forEach((t) => {
      if (typeof t === 'string' && t.trim()) tags.add(t.trim());
    });
  }
  return Array.from(tags).sort();
}


