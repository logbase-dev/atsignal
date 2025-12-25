'use client';

import type { BlogPost } from './types';
import { getAdminApiUrl } from './api';

export async function getBlogPosts(options?: { 
  page?: number; 
  limit?: number;
  categoryId?: string;
  search?: string;
  published?: boolean;
}): Promise<{ posts: BlogPost[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const baseUrl = getAdminApiUrl('blog');
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (options?.categoryId) params.append('categoryId', options.categoryId);
  if (options?.search) params.append('search', options.search);
  if (options?.published !== undefined) params.append('published', String(options.published));
  const url = `${baseUrl}?${params.toString()}`;
  
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('블로그 포스트를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return {
    posts: (data.posts || []) as BlogPost[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const response = await fetch(getAdminApiUrl(`blog/${id}`), { credentials: 'include' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('블로그 포스트를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return (data.post || null) as BlogPost | null;
}

export async function createBlogPost(post: Omit<BlogPost, 'id'>): Promise<string> {
  const response = await fetch(getAdminApiUrl('blog'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '블로그 포스트 생성에 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return data.id as string;
}

export async function updateBlogPost(id: string, post: Partial<BlogPost>): Promise<void> {
  const response = await fetch(getAdminApiUrl(`blog/${id}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '블로그 포스트 수정에 실패했습니다.');
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  const response = await fetch(getAdminApiUrl(`blog/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '블로그 포스트 삭제에 실패했습니다.');
  }
}


