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
      // 프로덕션: Admin API 사용
      const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://asia-northeast3-atsignal.cloudfunctions.net/api';
      const response = await fetch(`${adminApiUrl}/blog-likes?blogId=${params.id}&sessionId=${sessionId}&ipAddress=${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')}&userAgent=${encodeURIComponent(request.headers.get('user-agent') || '')}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Blog Like Status API] Admin API 에러:', errorText);
        return NextResponse.json(
          { error: 'Admin API error', message: errorText },
          { status: response.status }
        );
      }
      
      const result = await response.json();
      return NextResponse.json(result);
      
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
      // 프로덕션: Admin API 사용
      const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://asia-northeast3-atsignal.cloudfunctions.net/api';
      const response = await fetch(`${adminApiUrl}/blog-likes`, {
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
        console.error('[Blog Like API] Admin API 에러:', errorText);
        return NextResponse.json(
          { error: 'Admin API error', message: errorText },
          { status: response.status }
        );
      }
      
      const result = await response.json();
      return NextResponse.json(result);
      
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