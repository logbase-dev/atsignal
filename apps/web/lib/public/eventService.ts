'use client';

import type { Event } from '@/lib/admin/types';

export async function getPublicEvents(options?: {
  page?: number;
  limit?: number;
  published?: boolean;
  showInBanner?: boolean;
  hasCtaButton?: boolean;
  search?: string;
}): Promise<{ events: Event[]; total: number; page: number; limit: number; totalPages: number }> {
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
  if (options?.hasCtaButton !== undefined) {
    params.append('hasCtaButton', String(options.hasCtaButton));
  }
  if (options?.search) {
    params.append('search', options.search);
  }

  // 공개 API 경로 사용 (인증 불필요)
  const response = await fetch(`/admin-api/admin/event?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    events: (data?.events || []) as Event[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}