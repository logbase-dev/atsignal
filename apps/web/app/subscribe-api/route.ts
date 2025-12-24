import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 환경에 따라 Firebase Functions URL 결정
    const functionsUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:5001/atsignal/asia-northeast3/subscribeNewsletterApi' // 로컬 Emulator
      : process.env.NEXT_PUBLIC_SUBSCRIBE_API_URL || 
        'https://asia-northeast3-atsignal.cloudfunctions.net/subscribeNewsletterApi'; // 프로덕션
    
    // 요청 본문 가져오기
    const body = await request.json();
    
    // Firebase Functions로 프록시 요청
    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // 응답 본문을 한 번만 읽기
    const responseText = await response.text();
    
    // 응답이 성공하지 않으면 에러 처리
    if (!response.ok) {
      console.error('[Subscribe API] Firebase Functions error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText?.substring(0, 500), // 처음 500자만 로깅
        url: functionsUrl,
      });
      
      // JSON 파싱 시도 (에러 응답도 JSON일 수 있음)
      let errorData;
      try {
        errorData = responseText ? JSON.parse(responseText) : { message: response.statusText };
      } catch {
        errorData = { message: responseText || response.statusText };
      }
      
      // 502 에러인 경우 더 자세한 정보 제공
      if (response.status === 502) {
        console.error('[Subscribe API] 502 Bad Gateway - Functions 연결 실패 가능성:', {
          functionsUrl,
          errorData,
        });
      }
      
      return NextResponse.json(
        { 
          error: errorData.error || 'Firebase Functions error',
          message: errorData.message || errorData.error || response.statusText,
          status: response.status,
          ...errorData,
        },
        { status: response.status }
      );
    }
    
    // 성공 응답 파싱
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response text:', responseText);
      return NextResponse.json(
        { error: 'Invalid response from server', raw: responseText },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}