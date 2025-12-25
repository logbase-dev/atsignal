'use client';

import type { WhatsNew } from './types';
import { adminFetch } from './api';

export async function getWhatsNews(options?: {
  page?: number;
  limit?: number;
  published?: boolean;
  showInBanner?: boolean;
  search?: string;
}): Promise<{ whatsnews: WhatsNew[]; total: number; page: number; limit: number; totalPages: number }> {
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

  const response = await adminFetch(`whatsnew?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch whatsnews: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    whatsnews: (data?.whatsnews || []) as WhatsNew[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function getWhatsNewById(id: string): Promise<WhatsNew | null> {
  const response = await adminFetch(`whatsnew/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch whatsnew: ${response.statusText}`);
  }
  const data = await response.json();
  return (data?.whatsnew || null) as WhatsNew | null;
}

export async function createWhatsNew(whatsnew: Omit<WhatsNew, 'id'>): Promise<string> {
  const response = await adminFetch('whatsnew', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whatsnew),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "What's new 생성에 실패했습니다.");
  }
  const data = await response.json().catch(() => ({}));
  return data.id as string;
}

export async function updateWhatsNew(id: string, whatsnew: Partial<WhatsNew>): Promise<void> {
  const response = await adminFetch(`whatsnew/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whatsnew),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "What's new 수정에 실패했습니다.");
  }
}

export async function deleteWhatsNew(id: string): Promise<void> {
  const response = await adminFetch(`whatsnew/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "What's new 삭제에 실패했습니다.");
  }
}

export async function incrementWhatsNewViews(id: string): Promise<void> {
  const response = await adminFetch(`whatsnew/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'incrementViews' }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '조회수 증가에 실패했습니다.');
  }
}

