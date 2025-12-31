'use client';

import type { WhatsNew } from '@/lib/admin/types';

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
  // 공개 API 엔드포인트 사용 (인증 불필요)
  const response = await fetch(`/api/product/whatsnews${qs ? `?${qs}` : ''}`, {
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