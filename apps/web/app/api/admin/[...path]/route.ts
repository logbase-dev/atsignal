import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

// A안 정리:
// - /api/admin/login, /api/admin/logout, /api/admin/auth/me 는 별도 Next Route Handler가 담당
// - 그 외 /api/admin/* 는 전부 Functions(/api/admin/*)로 프록시

const DEFAULT_PROJECT_ID = 'atsignal';
const DEFAULT_FUNCTIONS_REGION = 'asia-northeast3';

function normalizeFunctionsBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
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
  } catch {
    // ignore
  }

  return trimmed;
}

function getFunctionsBase(): string {
  const envBase =
    process.env.FUNCTIONS_API_BASE_URL ||
    process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_URL ||
    process.env.NEXT_PUBLIC_FUNCTIONS_URL ||
    '';

  if (envBase) return normalizeFunctionsBase(envBase);

  if (process.env.NODE_ENV === 'development') {
    return `http://127.0.0.1:5001/${DEFAULT_PROJECT_ID}/${DEFAULT_FUNCTIONS_REGION}/api`;
  }

  return `https://${DEFAULT_FUNCTIONS_REGION}-${DEFAULT_PROJECT_ID}.cloudfunctions.net/api`;
}

async function requireAdminAuth(request: NextRequest): Promise<void | NextResponse> {
  // Allow token-mode requests (Authorization header) as well.
  // Functions will verify and map the token to an admin.
  const authorization = request.headers.get('authorization');
  if (authorization) return;

  const cookieStore = await cookies();
  const token = cookieStore.get('admin-auth')?.value;
  if (!token) return jsonError(401, '인증되지 않았습니다.');

  // light validation (adminId:* 형태)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [adminId] = decoded.split(':');
    if (!adminId) return jsonError(401, '유효하지 않은 인증 토큰입니다.');
  } catch {
    return jsonError(401, '유효하지 않은 인증 토큰입니다.');
  }
}

async function proxyAnyToFunctions(request: NextRequest, pathParts: string[]): Promise<NextResponse> {
  try {
    const base = getFunctionsBase().replace(/\/+$/, '');
    const safePath = pathParts.join('/').replace(/^\/+/, '');
    const url = new URL(`${base}/admin/${safePath}`);

    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers = new Headers();
    const rawCookie = request.headers.get('cookie');
    if (rawCookie) {
      headers.set('cookie', rawCookie);
    } else {
      // In some Next.js runtimes, request.headers may not expose the cookie header.
      // Build a cookie header from the server cookie store to keep Functions auth working.
      const cookieStore = await cookies();
      const all = cookieStore.getAll();
      if (all.length > 0) {
        headers.set(
          'cookie',
          all
            .map((c) => `${c.name}=${c.value}`)
            .join('; ')
        );
      }
    }
    const userAgent = request.headers.get('user-agent');
    if (userAgent) headers.set('user-agent', userAgent);
    const auth = request.headers.get('authorization');
    if (auth) headers.set('authorization', auth);
    headers.set('accept', request.headers.get('accept') || 'application/json');

    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const method = request.method.toUpperCase();
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      // 멀티파트 폼 데이터인 경우 스트림을 직접 전달해야 boundary 정보가 유지됨
      if (contentType && contentType.includes('multipart/form-data')) {
        // Next.js Request의 body를 직접 전달 (ReadableStream)
        // @ts-ignore - Next.js Request body는 ReadableStream이지만 fetch의 body로 전달 가능
        body = request.body;
      } else {
        const ab = await request.arrayBuffer();
        if (ab.byteLength > 0) body = ab;
      }
    }

    const response = await fetch(url.toString(), { method, headers, body });
    const text = await response.text();

    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: 'INVALID_UPSTREAM_RESPONSE', raw: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Admin API Proxy] Error:', {
      error: error?.message || String(error),
      stack: error?.stack,
      path: pathParts.join('/'),
      base: getFunctionsBase(),
    });
    return jsonError(500, `Functions 연결 실패: ${error?.message || '알 수 없는 오류'}`);
  }
}

async function handle(request: NextRequest, ctx: { params: { path: string[] } }) {
  try {
    const [resource, ...rest] = ctx.params.path || [];
    if (!resource) return jsonError(404, 'Not Found');

    if (resource === '__ping') {
      return NextResponse.json({ ok: true, route: '/api/admin/[...path]', proxy: 'functions', base: getFunctionsBase() });
    }

    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    return await proxyAnyToFunctions(request, [resource, ...rest]);
  } catch (error: any) {
    console.error('[Admin API Route] Unexpected error:', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return jsonError(500, `서버 오류: ${error?.message || '알 수 없는 오류'}`);
  }
}

export async function GET(request: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(request, ctx);
}

export async function POST(request: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(request, ctx);
}

export async function PUT(request: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(request, ctx);
}


