import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    console.log('[Blog Like Status API] 요청 받음:', { blogId: params.id, sessionId });

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId', message: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 환경에 따라 다른 방식으로 처리
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // 프로덕션: Firebase Admin SDK 사용
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      // Firebase Admin 초기화 (이미 초기화되어 있으면 재사용)
      let app;
      if (getApps().length === 0) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        app = getApps()[0];
      }
      
      const db = getFirestore(app);
      
      // 블로그 포스트 정보 가져오기
      const blogRef = db.collection('blog').doc(params.id);
      const blogDoc = await blogRef.get();
      
      if (!blogDoc.exists) {
        return NextResponse.json(
          { error: 'Blog not found', message: '블로그를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      const blogData = blogDoc.data();
      const likesCount = blogData?.likes || 0;
      
      // 사용자 좋아요 여부 확인
      const likesQuery = await db.collection('blogLikes')
        .where('blogId', '==', params.id)
        .where('sessionId', '==', sessionId)
        .limit(1)
        .get();
      
      const userLiked = !likesQuery.empty;
      
      return NextResponse.json({
        success: true,
        likes: likesCount,
        userLiked,
      });
      
    } else {
      // 로컬: Functions 에뮬레이터 사용
      const functionsUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'http://127.0.0.1:5001/atsignal/asia-northeast3';
      const response = await fetch(`${functionsUrl}/getBlogLikeStatus?blogId=${params.id}&sessionId=${sessionId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Blog Like Status API] Functions 에러:', errorText);
        return NextResponse.json(
          { error: 'Functions error', message: errorText },
          { status: response.status }
        );
      }
      
      const result = await response.json();
      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error('[Blog Like Status API] 에러:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: '좋아요 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, sessionId } = body;

    console.log('[Blog Like API] 요청 받음:', { blogId: params.id, action, sessionId });

    if (!action || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields', message: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action', message: '잘못된 액션입니다.' },
        { status: 400 }
      );
    }

    // 환경에 따라 다른 방식으로 처리
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // 프로덕션: Firebase Admin SDK 사용
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
      
      // Firebase Admin 초기화 (이미 초기화되어 있으면 재사용)
      let app;
      if (getApps().length === 0) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        app = getApps()[0];
      }
      
      const db = getFirestore(app);
      
      // 블로그 포스트 존재 확인
      const blogRef = db.collection('blog').doc(params.id);
      const blogDoc = await blogRef.get();
      
      if (!blogDoc.exists) {
        return NextResponse.json(
          { error: 'Blog not found', message: '블로그를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      // 기존 좋아요 확인
      const likesQuery = await db.collection('blogLikes')
        .where('blogId', '==', params.id)
        .where('sessionId', '==', sessionId)
        .limit(1)
        .get();
      
      const existingLike = !likesQuery.empty ? likesQuery.docs[0] : null;
      
      if (action === 'like') {
        if (existingLike) {
          return NextResponse.json(
            { error: 'Already liked', message: '이미 좋아요를 누르셨습니다.' },
            { status: 409 }
          );
        }
        
        // 좋아요 추가
        await db.collection('blogLikes').add({
          blogId: params.id,
          sessionId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
          createdAt: FieldValue.serverTimestamp(),
        });
        
        // 블로그 포스트의 likes 카운트 증가
        await blogRef.update({
          likes: FieldValue.increment(1),
        });
        
      } else if (action === 'unlike') {
        if (!existingLike) {
          return NextResponse.json(
            { error: 'Not liked yet', message: '아직 좋아요를 누르지 않으셨습니다.' },
            { status: 409 }
          );
        }
        
        // 좋아요 제거
        await existingLike.ref.delete();
        
        // 블로그 포스트의 likes 카운트 감소
        await blogRef.update({
          likes: FieldValue.increment(-1),
        });
      }
      
      // 업데이트된 좋아요 수 가져오기
      const updatedBlogDoc = await blogRef.get();
      const updatedBlog = updatedBlogDoc.data();
      const likesCount = updatedBlog?.likes || 0;
      
      return NextResponse.json({
        success: true,
        likes: likesCount,
        userLiked: action === 'like',
      });
      
    } else {
      // 로컬: Functions 에뮬레이터 사용
      const functionsUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'http://127.0.0.1:5001/atsignal/asia-northeast3';
      const response = await fetch(`${functionsUrl}/blogLikeApi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogId: params.id,
          action,
          sessionId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Blog Like API] Functions 에러:', errorText);
        return NextResponse.json(
          { error: 'Functions error', message: errorText },
          { status: response.status }
        );
      }
      
      const result = await response.json();
      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error('[Blog Like API] 에러:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: '좋아요 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}