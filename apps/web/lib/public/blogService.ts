import type { BlogPost } from '@/lib/admin/types';
import { getPublicApiUrl } from '@/lib/utils/api';

export async function getPublicBlogs(options?: { 
  page?: number; 
  limit?: number;
  categoryId?: string;
  search?: string;
  isFeatured?: boolean;
}): Promise<{ blogs: BlogPost[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const baseUrl = getPublicApiUrl('resources/blogs');
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (options?.categoryId) params.append('categoryId', options.categoryId);
  if (options?.search) params.append('search', options.search);
  if (options?.isFeatured !== undefined) params.append('isFeatured', String(options.isFeatured));
  const url = `${baseUrl}?${params.toString()}`;
  
  console.log('[getPublicBlogs] API 호출 시작:', { url, options });
  
  const response = await fetch(url);
  
  console.log('[getPublicBlogs] API 응답:', { 
    ok: response.ok, 
    status: response.status, 
    statusText: response.statusText 
  });
  
  if (!response.ok) {
    console.error('[getPublicBlogs] API 에러:', response.status, response.statusText);
    throw new Error('블로그를 불러오는데 실패했습니다.');
  }
  
  const data = await response.json().catch(() => ({}));
  
  console.log('[getPublicBlogs] 파싱된 데이터:', {
    blogsCount: data.blogs?.length || 0,
    total: data.total,
    hasBlogs: !!data.blogs
  });
  
  return {
    blogs: (data.blogs || []) as BlogPost[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function getPublicFeaturedBlogs(limit: number = 3): Promise<BlogPost[]> {
  const response = await getPublicBlogs({ 
    isFeatured: true, 
    limit: 50 // 충분한 수를 가져와서 필터링
  });
  return response.blogs.slice(0, limit);
}

export async function getPublicFeaturedBlogsByCategory(categoryId: string, limit: number = 5): Promise<BlogPost[]> {
  const response = await getPublicBlogs({ categoryId, limit: 100 }); // 많이 가져와서 필터링
  return response.blogs.filter(blog => blog.isFeatured === true).slice(0, limit);
}

export async function getPublicBlogById(id: string): Promise<BlogPost | null> {
  const response = await fetch(getPublicApiUrl(`resources/blogs/${id}`));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('블로그를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return (data.blog || null) as BlogPost | null;
}

export async function getPublicBlogBySlug(slug: string): Promise<BlogPost | null> {
  const response = await fetch(getPublicApiUrl(`resources/blogs/${slug}`));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('블로그를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return (data.blog || null) as BlogPost | null;
}

export async function getPublicBlogCategories(): Promise<any[]> {
  const response = await fetch(getPublicApiUrl('resources/blog-categories'));
  if (!response.ok) throw new Error('블로그 카테고리를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return data.categories || [];
}