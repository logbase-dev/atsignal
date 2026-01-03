import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 환경에 따른 API URL 결정
    let apiUrl: string;
    
    if (process.env.NODE_ENV === 'development') {
      // 로컬 개발 환경: Firebase Emulator 사용
      const emulatorUrl = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_URL || 'http://127.0.0.1:5001/atsignal/asia-northeast3/api';
      apiUrl = `${emulatorUrl}/stibee/subscribe`;
    } else {
      // 프로덕션 환경: 실제 Firebase Functions 사용
      apiUrl = 'https://asia-northeast3-atsignal.cloudfunctions.net/api/stibee/subscribe';
    }
    
    console.log('[API Route] Environment:', process.env.NODE_ENV);
    console.log('[API Route] Forwarding to:', apiUrl);
    console.log('[API Route] Request body:', body);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    console.log('[API Route] Response status:', response.status);
    console.log('[API Route] Response data:', data);
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Route] Error:', error);
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}