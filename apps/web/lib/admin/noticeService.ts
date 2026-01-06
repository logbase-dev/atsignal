'use client';

import type { Notice } from './types';
import { adminFetch } from './api';

export async function getNotices(options?: {
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

  const response = await adminFetch(`notice?${params.toString()}`);

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

export async function getNoticeById(id: string): Promise<Notice | null> {
  const response = await adminFetch(`notice/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch notice: ${response.statusText}`);
  }
  const data = await response.json();
  return (data?.notice || null) as Notice | null;
}

export async function createNotice(notice: Omit<Notice, 'id'>): Promise<string> {
  const response = await adminFetch('notice', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notice),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '공지사항 생성에 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return data.id as string;
}

export async function updateNotice(id: string, notice: Partial<Notice>): Promise<void> {
  const response = await adminFetch(`notice/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notice),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '공지사항 수정에 실패했습니다.');
  }
}

export async function deleteNotice(id: string): Promise<void> {
  const response = await adminFetch(`notice/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '공지사항 삭제에 실패했습니다.');
  }
}

export async function incrementNoticeViews(id: string): Promise<void> {
  const response = await adminFetch(`notice/${id}`, {
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

