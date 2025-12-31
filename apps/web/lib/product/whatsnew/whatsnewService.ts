'use client';

import type { WhatsNew } from '@/lib/admin/types';
import { getPublicApiUrl } from '@/lib/utils/api';

export interface GetWhatsNewResponse {
  items: WhatsNew[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 공개 WhatsNew API - 사용자 화면에서 사용
 */
export async function getPublicWhatsNews(options?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<GetWhatsNewResponse> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));
  
  // 공개 API이므로 published=true로 고정
  params.append('published', 'true');

  const qs = params.toString();
  // Firebase App Hosting에서 /api/* 경로 403 문제 해결을 위해 Functions API 사용
  const apiUrl = getPublicApiUrl(`product/whatsnews${qs ? `?${qs}` : ''}`);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch whats new: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return {
    items: (data.whatsnews || data.items || []) as WhatsNew[],
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 20,
    totalPages: data.totalPages || 1,
  };
}