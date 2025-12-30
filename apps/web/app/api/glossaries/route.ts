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
 * 공개 용어사전 API - 사용자 화면에서 사용 (인증 불필요)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const functionsBase = getFunctionsBase();
    const apiUrl = new URL(`${functionsBase}/admin/glossaries`);

    // 쿼리 파라미터 전달
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    // 공개 API이므로 enabled 필터 추가 (활성화된 용어사전만)
    if (!apiUrl.searchParams.has('enabledKo')) {
      apiUrl.searchParams.append('enabledKo', 'true');
    }
    if (!apiUrl.searchParams.has('enabledEn')) {
      apiUrl.searchParams.append('enabledEn', 'true');
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Glossary API] Functions error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch glossaries', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Admin API 응답 형식을 공개 API 형식으로 변환
    const result = {
      glossaries: data.items || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      totalPages: data.totalPages || 1,
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Glossary API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}