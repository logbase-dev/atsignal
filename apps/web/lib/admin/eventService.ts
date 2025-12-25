'use client';

import type { Event } from './types';
import { adminFetch } from './api';

export async function getEvents(options?: {
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

  const response = await adminFetch(`event?${params.toString()}`);

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

export async function getEventById(id: string): Promise<Event | null> {
  const response = await adminFetch(`event/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }
  const data = await response.json();
  return (data?.event || null) as Event | null;
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<string> {
  const response = await adminFetch('event', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '이벤트 생성에 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return data.id as string;
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<void> {
  const response = await adminFetch(`event/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '이벤트 수정에 실패했습니다.');
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const response = await adminFetch(`event/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '이벤트 삭제에 실패했습니다.');
  }
}

export async function incrementEventViews(id: string): Promise<void> {
  const response = await adminFetch(`event/${id}`, {
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

