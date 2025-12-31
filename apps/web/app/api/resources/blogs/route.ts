import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    let query = db.collection('blog')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc');

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    // 검색 기능은 클라이언트 사이드에서 필터링
    const snapshot = await query.get();
    let blogs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as any; // 타입 단언 추가
    });

    // 검색어가 있으면 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      blogs = blogs.filter((blog: any) => {
        const titleKo = blog.title?.ko?.toLowerCase() || '';
        const titleEn = blog.title?.en?.toLowerCase() || '';
        const contentKo = blog.content?.ko?.toLowerCase() || '';
        const contentEn = blog.content?.en?.toLowerCase() || '';
        return titleKo.includes(searchLower) ||
               titleEn.includes(searchLower) ||
               contentKo.includes(searchLower) ||
               contentEn.includes(searchLower);
      });
    }

    const total = blogs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlogs = blogs.slice(startIndex, endIndex);

    return NextResponse.json({
      blogs: paginatedBlogs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Failed to fetch blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}