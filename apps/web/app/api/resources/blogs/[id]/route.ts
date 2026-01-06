import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// slug인지 ID인지 판단하는 함수 (Firestore ID는 보통 20자 이상의 랜덤 문자열이고 하이픈이 없음)
function isFirestoreId(value: string): boolean {
  return value.length >= 20 && /^[a-zA-Z0-9]+$/.test(value) && !value.includes('-');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('[API] Blog 요청:', { id, isFirestoreId: isFirestoreId(id) });
    
    let doc;
    let blog;

    if (isFirestoreId(id)) {
      // ID로 조회
      console.log('[API] ID로 블로그 조회:', id);
      doc = await db.collection('blog').doc(id).get();
      
      if (!doc.exists) {
        console.log('[API] ID로 블로그를 찾을 수 없음:', id);
        return NextResponse.json(
          { error: 'Blog not found' },
          { status: 404 }
        );
      }

      const data = doc.data();
      blog = {
        id: doc.id,
        ...data
      } as any;
    } else {
      // slug로 조회
      console.log('[API] slug로 블로그 조회:', id);
      const querySnapshot = await db.collection('blog')
        .where('slug', '==', id)
        .limit(1)
        .get();
      
      console.log('[API] slug 쿼리 결과:', { empty: querySnapshot.empty, size: querySnapshot.size });
      
      if (querySnapshot.empty) {
        console.log('[API] slug로 블로그를 찾을 수 없음:', id);
        return NextResponse.json(
          { error: 'Blog not found' },
          { status: 404 }
        );
      }

      doc = querySnapshot.docs[0];
      const data = doc.data();
      blog = {
        id: doc.id,
        ...data
      } as any;
    }

    console.log('[API] 블로그 찾음:', { id: blog.id, title: blog.title, published: blog.published });

    // 발행된 블로그만 반환
    if (!blog.published) {
      console.log('[API] 블로그가 발행되지 않음:', blog.id);
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // 조회수 증가
    await db.collection('blog').doc(blog.id).update({
      views: (blog.views || 0) + 1
    });

    console.log('[API] 블로그 반환 성공:', blog.id);
    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Failed to fetch blog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}