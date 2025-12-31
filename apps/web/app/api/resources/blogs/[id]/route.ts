import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const doc = await db.collection('blog').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const blog = {
      id: doc.id,
      ...data
    } as any; // 타입 단언 추가

    // 발행된 블로그만 반환
    if (!blog.published) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // 조회수 증가
    await db.collection('blog').doc(id).update({
      views: (blog.views || 0) + 1
    });

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Failed to fetch blog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}