'use client';

import type { Notice } from '@/lib/admin/types';

export async function getPublicNotices(options?: {
  page?: number;
  limit?: number;
  published?: boolean;
  showInBanner?: boolean;
  search?: string;
}): Promise<{ notices: Notice[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (options?.published !== undefined) {
    params.append('published', String(options.published));
  }
  if (options?.showInBanner !== undefined) {
    params.append('showInBanner', String(options.showInBanner));
  }
  if (options?.search) {
    params.append('search', options.search);
  }

  // 공개 API 경로 사용 (인증 불필요)
  const response = await fetch(`/admin-api/admin/notice?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch notices: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    notices: (data?.notices || []) as Notice[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}