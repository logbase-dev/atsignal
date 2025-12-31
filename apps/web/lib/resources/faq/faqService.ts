'use client';

import type { FAQ, FAQCategory } from '@/lib/admin/types';

export interface GetFAQsResponse {
  faqs: FAQ[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 공개 FAQ API - 사용자 화면에서 사용
 */
export async function getPublicFAQs(options?: {
  categoryId?: string;
  tags?: string[];
  search?: string;
  orderBy?: 'level' | 'isTop' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  enabled?: {
    ko?: boolean;
    en?: boolean;
  };
}): Promise<GetFAQsResponse> {
  const params = new URLSearchParams();
  if (options?.categoryId) params.append('categoryId', options.categoryId);
  if (options?.tags?.length) {
    options.tags.forEach((tag) => params.append('tags', tag));
  }
  if (options?.search) params.append('search', options.search);
  if (options?.orderBy) params.append('orderBy', options.orderBy);
  if (options?.orderDirection) params.append('orderDirection', options.orderDirection);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.enabled?.ko !== undefined) params.append('enabledKo', String(options.enabled.ko));
  if (options?.enabled?.en !== undefined) params.append('enabledEn', String(options.enabled.en));

  const qs = params.toString();
  // 공개 API 엔드포인트 사용 (인증 불필요)
  const response = await fetch(`/api/resources/faqs${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch FAQs: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return {
    faqs: (data.faqs || []) as FAQ[],
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 20,
    totalPages: data.totalPages || 1,
  };
}

/**
 * 공개 FAQ 카테고리 API
 */
export async function getPublicFAQCategories(): Promise<FAQCategory[]> {
  const response = await fetch('/api/resources/faq-categories', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch FAQ categories: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return (data.categories || []) as FAQCategory[];
}

