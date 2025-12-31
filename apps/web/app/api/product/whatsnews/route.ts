import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'atsignal';
const DEFAULT_FUNCTIONS_REGION = 'asia-northeast3';

function getFunctionsBase(): string {
  const envBase =
    process.env.FUNCTIONS_API_BASE_URL ||
    process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_URL ||
    process.env.NEXT_PUBLIC_FUNCTIONS_URL ||
    '';

  if (envBase) {
    const trimmed = envBase.trim().replace(/\/+$/, '');
    if (trimmed.includes('/api')) return trimmed;
    try {
      const u = new URL(trimmed);
      const path = (u.pathname || '').replace(/\/+$/, '');
      if (!path) {
        u.pathname = `/${DEFAULT_PROJECT_ID}/${DEFAULT_FUNCTIONS_REGION}/api`;
        return u.toString().replace(/\/+$/, '');
      }
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 1) {
        u.pathname = `/${parts[0]}/${DEFAULT_FUNCTIONS_REGION}/api`;
        return u.toString().replace(/\/+$/, '');
      }
      if (parts.length === 2) {
        u.pathname = `/${parts[0]}/${parts[1]}/api`;
        return u.toString().replace(/\/+$/, '');
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  // 개발 환경에서는 에뮬레이터 URL 사용
  if (process.env.NODE_ENV === 'development') {
    return `http://127.0.0.1:5001/${DEFAULT_PROJECT_ID}/${DEFAULT_FUNCTIONS_REGION}/api`;
  }

  // 기본값: 프로덕션 Functions URL
  return `https://${DEFAULT_FUNCTIONS_REGION}-${DEFAULT_PROJECT_ID}.cloudfunctions.net/api`;
}

/**
 * 공개 WhatsNew API - 사용자 화면에서 사용 (인증 불필요)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const functionsBase = getFunctionsBase();
    console.log('[WhatsNew API] Functions Base URL:', functionsBase);
    const apiUrl = new URL(`${functionsBase}/admin/whatsnew`);
    console.log('[WhatsNew API] Full API URL:', apiUrl.toString());

    // 쿼리 파라미터 전달
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    // 공개 API이므로 published=true로 고정 (발행된 글만)
    if (!apiUrl.searchParams.has('published')) {
      apiUrl.searchParams.append('published', 'true');
    }

    console.log('[WhatsNew API] Final URL with params:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[WhatsNew API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsNew API] Functions error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch whats new', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[WhatsNew API] Response data:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[WhatsNew API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}