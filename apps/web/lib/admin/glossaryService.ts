'use client';

import type { Glossary } from './types';
import { adminFetch } from './api';

export interface GetGlossariesResponse {
  items: Glossary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getGlossaries(options?: {
  categoryId?: string;
  search?: string;
  locale?: 'ko' | 'en';
  page?: number;
  limit?: number;
}): Promise<GetGlossariesResponse> {
  const params = new URLSearchParams();
  if (options?.categoryId) params.append('categoryId', options.categoryId);
  if (options?.search) params.append('search', options.search);
  if (options?.locale) params.append('locale', options.locale);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const qs = params.toString();
  const response = await adminFetch(`glossaries${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch glossaries: ${response.statusText}`);
  }
  const data = await response.json().catch(() => ({}));
  return data as GetGlossariesResponse;
}

export async function getGlossaryById(id: string): Promise<Glossary | null> {
  const response = await adminFetch(`glossaries/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to fetch glossary: ${response.statusText}`);
  const data = await response.json().catch(() => ({}));
  return (data.glossary || null) as Glossary | null;
}

export async function createGlossary(
  glossary: Omit<Glossary, 'id' | 'createdBy' | 'updatedBy' | 'initialLetter'>,
): Promise<string> {
  const response = await adminFetch('glossaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(glossary),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || '용어 생성에 실패했습니다.');
  }
  const result = await response.json().catch(() => ({}));
  return result.id as string;
}

export async function updateGlossary(
  id: string,
  glossary: Partial<Omit<Glossary, 'id' | 'createdBy' | 'updatedBy'>>,
): Promise<void> {
  const response = await adminFetch(`glossaries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(glossary),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || '용어 수정에 실패했습니다.');
  }
}

export async function deleteGlossary(id: string): Promise<void> {
  const response = await adminFetch(`glossaries/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || '용어 삭제에 실패했습니다.');
  }
}

// URL에서 문서 제목 추출
export async function extractTitleFromUrl(
  url: string,
  linkType: 'docs' | 'faq' | 'blog' | 'notice',
): Promise<string | null> {
  try {
    // URL 파싱
    let id: string | null = null;
    let slug: string | null = null;
    let locale: string = 'ko';

    if (url.startsWith('/docs/')) {
      // /docs/ko/getting-started
      const parts = url.split('/').filter(Boolean);
      if (parts.length >= 3) {
        locale = parts[1];
        slug = parts.slice(2).join('/');
      }
    } else if (url.startsWith('/faq/')) {
      // /faq/123
      id = url.split('/').pop() || null;
    } else if (url.startsWith('/blog/')) {
      // /blog/123
      id = url.split('/').pop() || null;
    } else if (url.startsWith('/notice/')) {
      // /notice/123
      id = url.split('/').pop() || null;
    }

    if (linkType === 'docs' && slug) {
      const response = await adminFetch(`pages?slug=${encodeURIComponent(slug)}&locale=${locale}`);
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const page = Array.isArray(data.pages) ? data.pages[0] : data.page;
        if (page?.labelsLive?.[locale] || page?.labels?.[locale]) {
          return page.labelsLive?.[locale] || page.labels?.[locale];
        }
      }
    } else if (id) {
      let endpoint = '';
      if (linkType === 'faq') endpoint = `faqs/${id}`;
      else if (linkType === 'blog') endpoint = `blog/${id}`;
      else if (linkType === 'notice') endpoint = `notice/${id}`;

      if (endpoint) {
        const response = await adminFetch(endpoint);
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          if (linkType === 'faq' && data.faq?.question?.ko) {
            return data.faq.question.ko;
          } else if (linkType === 'blog' && data.blog?.title?.ko) {
            return data.blog.title.ko;
          } else if (linkType === 'notice' && data.notice?.title?.ko) {
            return data.notice.title.ko;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting title from URL:', error);
    return null;
  }
}

