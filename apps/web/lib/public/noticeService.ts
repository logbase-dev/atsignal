import type { Notice } from '@/lib/admin/types';
import { getPublicApiUrl } from '@/lib/utils/api';

export async function getPublicNotices(options?: { 
  page?: number; 
  limit?: number;
  search?: string;
}): Promise<{ notices: Notice[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const baseUrl = getPublicApiUrl('resources/notices');
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (options?.search) params.append('search', options.search);
  const url = `${baseUrl}?${params.toString()}`;
  
  console.log('[getPublicNotices] API 호출 시작:', { url, options });
  
  const response = await fetch(url);
  
  console.log('[getPublicNotices] API 응답:', { 
    ok: response.ok, 
    status: response.status, 
    statusText: response.statusText 
  });
  
  if (!response.ok) {
    console.error('[getPublicNotices] API 에러:', response.status, response.statusText);
    throw new Error('공지사항을 불러오는데 실패했습니다.');
  }
  
  const data = await response.json().catch(() => ({}));
  
  console.log('[getPublicNotices] 파싱된 데이터:', {
    noticesCount: data.notices?.length || 0,
    total: data.total,
    hasNotices: !!data.notices
  });
  
  return {
    notices: (data.notices || []) as Notice[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function getPublicNoticeById(id: string): Promise<Notice | null> {
  const response = await fetch(getPublicApiUrl(`resources/notices/${id}`));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('공지사항을 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return (data.notice || null) as Notice | null;
}