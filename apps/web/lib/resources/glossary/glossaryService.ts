'use client';

import type { Glossary, GlossaryCategory } from '@/lib/admin/types';
import { getPublicApiUrl } from '@/lib/utils/api';

export interface GetGlossariesResponse {
  glossaries: Glossary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 공개 용어사전 API - 사용자 화면에서 사용
 */
export async function getPublicGlossaries(options?: {
  categoryId?: string;
  search?: string;
  initialLetter?: string;
  orderBy?: 'term' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  enabled?: {
    ko?: boolean;
    en?: boolean;
  };
}): Promise<GetGlossariesResponse> {
  const params = new URLSearchParams();
  if (options?.categoryId) params.append('categoryId', options.categoryId);
  if (options?.search) params.append('search', options.search);
  if (options?.initialLetter) params.append('initialLetter', options.initialLetter);
  if (options?.orderBy) params.append('orderBy', options.orderBy);
  if (options?.orderDirection) params.append('orderDirection', options.orderDirection);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.enabled?.ko !== undefined) params.append('enabledKo', String(options.enabled.ko));
  if (options?.enabled?.en !== undefined) params.append('enabledEn', String(options.enabled.en));

  const qs = params.toString();
  // Firebase App Hosting에서 /api/* 경로 403 문제 해결을 위해 Functions API 사용
  const apiUrl = getPublicApiUrl(`resources/glossaries${qs ? `?${qs}` : ''}`);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch glossaries: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return {
    glossaries: (data.glossaries || []) as Glossary[],
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 20,
    totalPages: data.totalPages || 1,
  };
}

/**
 * 공개 용어사전 카테고리 API
 */
export async function getPublicGlossaryCategories(): Promise<GlossaryCategory[]> {
  // Firebase App Hosting에서 /api/* 경로 403 문제 해결을 위해 Functions API 사용
  const apiUrl = getPublicApiUrl('resources/glossary-categories');
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch glossary categories: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return (data.categories || []) as GlossaryCategory[];
}