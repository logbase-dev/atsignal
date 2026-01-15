import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Blogs API] 시작 - Firebase Admin SDK 사용');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isFeatured = searchParams.get('isFeatured');

    console.log('[Blogs API] 파라미터:', { page, limit, categoryId, search, isFeatured });

    let query = db.collection('blog')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc');

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    // isFeatured 필터는 클라이언트 사이드에서 처리 (Firestore 인덱스 이슈 방지)
    // if (isFeatured === 'true') {
    //   query = query.where('isFeatured', '==', true);
    // }

    console.log('[Blogs API] Firestore 쿼리 실행 중...');

    // 검색 기능은 클라이언트 사이드에서 필터링
    const snapshot = await query.get();
    
    console.log('[Blogs API] 쿼리 결과:', {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.length
    });

    let blogs = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('[Blogs API] 문서 데이터 샘플:', {
        id: doc.id,
        hasTitle: !!data.title,
        hasContent: !!data.content,
        published: data.published,
        createdAt: data.createdAt,
        createdAtType: typeof data.createdAt
      });
      
      return {
        id: doc.id,
        ...data,
        // FAQ처럼 날짜 변환 추가
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as any; // 타입 단언 추가
    });

    console.log('[Blogs API] 매핑된 블로그 수:', blogs.length);

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

    // isFeatured 필터링 (클라이언트 사이드)
    if (isFeatured === 'true') {
      blogs = blogs.filter((blog: any) => blog.isFeatured === true);
    }

    const total = blogs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlogs = blogs.slice(startIndex, endIndex);

    console.log('[Blogs API] 최종 결과:', {
      total,
      page,
      limit,
      totalPages,
      paginatedCount: paginatedBlogs.length
    });

    return NextResponse.json({
      blogs: paginatedBlogs,
      total,
      page,
      limit,
      totalPages,
      // 디버그 정보 추가
      debug: {
        timestamp: new Date().toISOString(),
        queryExecuted: true,
        snapshotSize: snapshot.size,
        blogsAfterMapping: blogs.length,
        paginatedCount: paginatedBlogs.length,
        sampleBlog: blogs[0] ? {
          id: blogs[0].id,
          hasTitle: !!blogs[0].title,
          hasContent: !!blogs[0].content,
          published: blogs[0].published
        } : null
      }
    });
  } catch (error) {
    console.error('[Blogs API] 에러 발생:', error);
    console.error('[Blogs API] 에러 스택:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to fetch blogs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}