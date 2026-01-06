'use client';

import type { Event } from '@/lib/admin/types';
import { getPublicApiUrl } from '@/lib/utils/api';

export interface GetEventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 공개 이벤트 API - 사용자 화면에서 사용
 */
export async function getPublicEvents(options?: {
  search?: string;
  page?: number;
  limit?: number;
  enabled?: {
    ko?: boolean;
    en?: boolean;
  };
}): Promise<GetEventsResponse> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.enabled?.ko !== undefined) params.append('enabledKo', String(options.enabled.ko));
  if (options?.enabled?.en !== undefined) params.append('enabledEn', String(options.enabled.en));
  
  // 공개 API이므로 published=true로 고정
  params.append('published', 'true');

  const qs = params.toString();
  // Firebase App Hosting에서 /api/* 경로 403 문제 해결을 위해 Functions API 사용
  const apiUrl = getPublicApiUrl(`resources/events${qs ? `?${qs}` : ''}`);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return {
    events: (data.events || []) as Event[],
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 20,
    totalPages: data.totalPages || 1,
  };
}

/**
 * 메인 이벤트 가져오기 (isMainEvent=true인 이벤트 1개)
 */
export async function getMainEvent(): Promise<Event | null> {
  const response = await getPublicEvents({ limit: 1 });
  const mainEvent = response.events.find(event => event.isMainEvent);
  return mainEvent || null;
}

/**
 * 서브 이벤트 가져오기 (subEventOrder가 있는 이벤트 3개)
 */
export async function getSubEvents(): Promise<Event[]> {
  const response = await getPublicEvents({ limit: 50 }); // 충분히 많이 가져와서 필터링
  return response.events
    .filter(event => event.subEventOrder !== undefined && event.subEventOrder > 0)
    .sort((a, b) => (a.subEventOrder || 0) - (b.subEventOrder || 0))
    .slice(0, 3);
}

/**
 * 나머지 이벤트 가져오기 (메인도 서브도 아닌 이벤트들)
 */
export async function getOtherEvents(options?: {
  page?: number;
  limit?: number;
}): Promise<GetEventsResponse> {
  const response = await getPublicEvents({ 
    page: options?.page || 1,
    limit: options?.limit || 20 
  });
  
  // 메인 이벤트와 서브 이벤트 제외
  const otherEvents = response.events.filter(event => 
    !event.isMainEvent && 
    (!event.subEventOrder || event.subEventOrder <= 0)
  );

  return {
    ...response,
    events: otherEvents,
    total: otherEvents.length,
  };
}

/**
 * 이벤트 상세 정보 가져오기
 */
export async function getEventById(id: string): Promise<Event | null> {
  // Firebase App Hosting에서 /api/* 경로 403 문제 해결을 위해 Functions API 사용
  const apiUrl = getPublicApiUrl(`resources/events/${id}`);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({}));
  return (data.event || data) as Event;
}