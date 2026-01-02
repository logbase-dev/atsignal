import type { Event } from '@/lib/admin/types';
import { getPublicApiUrl } from '@/lib/utils/api';

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
  const baseUrl = getPublicApiUrl('resources/events');
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (options?.search) params.append('search', options.search);
  const url = `${baseUrl}?${params.toString()}`;

  console.log('[getPublicEvents] API 호출 시작:', { url, options });

  const response = await fetch(url);

  console.log('[getPublicEvents] API 응답:', { 
    ok: response.ok, 
    status: response.status, 
    statusText: response.statusText 
  });

  if (!response.ok) {
    console.error('[getPublicEvents] API 에러:', response.status, response.statusText);
    throw new Error('이벤트를 불러오는데 실패했습니다.');
  }

  const data = await response.json().catch(() => ({}));

  console.log('[getPublicEvents] 파싱된 데이터:', {
    eventsCount: data.events?.length || 0,
    total: data.total,
    hasEvents: !!data.events
  });

  return {
    events: (data.events || []) as Event[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}