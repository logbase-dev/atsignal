import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'atsignal';
const DEFAULT_FUNCTIONS_REGION = 'asia-northeast3';

type CachedIdToken = {
  token: string;
  exp: number; // epoch seconds
};

declare global {
  // eslint-disable-next-line no-var
  var __ats_functions_id_token_cache: Record<string, CachedIdToken> | undefined;
}

function base64UrlDecodeToString(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function getJwtExp(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadJson = base64UrlDecodeToString(parts[1]);
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

async function getGcpIdentityToken(audience: string): Promise<string | null> {
  // Cache per audience to reduce metadata calls
  const g = globalThis as any;
  if (!g.__ats_functions_id_token_cache) g.__ats_functions_id_token_cache = {};
  const cache = g.__ats_functions_id_token_cache as Record<string, CachedIdToken>;

  const now = Math.floor(Date.now() / 1000);
  const cached = cache[audience];
  if (cached && cached.exp - now > 60) return cached.token;

  // Cloud Run / App Hosting has access to the metadata server.
  const metaUrl =
    `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity` +
    `?audience=${encodeURIComponent(audience)}&format=full`;

  const res = await fetch(metaUrl, {
    headers: { 'Metadata-Flavor': 'Google' },
    // Ensure this never follows redirects to external networks.
    redirect: 'error',
  });

  if (!res.ok) return null;
  const token = (await res.text()).trim();
  const exp = getJwtExp(token) ?? (now + 300); // fallback: short cache
  cache[audience] = { token, exp };
  return token;
}

function normalizeFunctionsBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  // If it already includes "/api" (function name), assume it's correct.
  if (trimmed.includes('/api')) return trimmed;

  // Emulator pattern: http://127.0.0.1:5001/<projectId>/<region>/api
  try {
    const u = new URL(trimmed);
    const path = (u.pathname || '').replace(/\/+$/, '');
    if (!path || path === '') {
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

const FUNCTIONS_BASE = getFunctionsBase();

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  const path = params.path.join('/');
  const isDev = process.env.NODE_ENV === 'development';

  // Functions 프록시 사용 중임을 명확히 표시
  if (path === 'login') {
    console.log('[Admin API Proxy] ⚠️ Functions 프록시를 통해 로그인 요청 처리 중');
    console.log('[Admin API Proxy] URL:', request.url);
  }

  if (isDev) {
    console.log('[Admin API Proxy] Request received:', { method, path, url: request.url });
  }

  // Health check (does not hit Functions)
  if (path === '__ping') {
    return NextResponse.json({ ok: true, route: '/admin-api/admin/[...path]', method }, { status: 200 });
  }

  const base = FUNCTIONS_BASE.replace(/\/+$/, '');
  const safePath = path.replace(/^\/+/, '');
  const url = new URL(`${base}/admin/${safePath}`);

  if (isDev) {
    console.log('[Admin API Proxy] Functions URL:', url.toString());
  }

  // 쿼리 파라미터 복사
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // 헤더 준비 (Host 제외, Origin은 명시적으로 전달)
  const headers = new Headers();
  const clientOrigin = request.headers.get('origin');
  const contentType = request.headers.get('content-type');
  
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'host' || lowerKey.startsWith('x-')) return;
    headers.set(key, value);
  });
  
  // 멀티파트 데이터의 경우 Content-Type 헤더에 boundary가 포함되어 있어야 함
  // 브라우저가 자동으로 설정한 Content-Type을 그대로 사용
  if (contentType && contentType.includes('multipart/form-data')) {
    headers.set('content-type', contentType);
    console.log('[Admin API Proxy] Content-Type 헤더 설정:', contentType.substring(0, 100));
  }

  // IMPORTANT:
  // - Our Cloud Functions `api` endpoint is protected by IAM (no allUsers invoker due to org policy).
  // - App Hosting (Next.js server) calls Functions via plain fetch, so we must attach an ID token.
  // - Only do this when there is no existing Authorization header (e.g., token auth in dev).
  if (!headers.has('authorization') && !isDev && base.includes('.cloudfunctions.net/')) {
    const audience = base; // e.g. https://asia-northeast3-atsignal.cloudfunctions.net/api
    const idToken = await getGcpIdentityToken(audience);
    if (idToken) {
      headers.set('authorization', `Bearer ${idToken}`);
      console.log('[Admin API Proxy] Attached GCP identity token for Functions invoker');
    } else {
      console.warn('[Admin API Proxy] Failed to get GCP identity token (metadata server)');
    }
  }
  
  // IMPORTANT: 서버 사이드에서 실행되므로 클라이언트의 Origin을 명시적으로 전달
  // Functions의 CORS 체크를 통과하기 위해 필요
  if (clientOrigin) {
    headers.set('origin', clientOrigin);
    console.log('[Admin API Proxy] Forwarding Origin header:', clientOrigin);
  } else {
    // Origin이 없으면 Referer에서 추출 시도
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        headers.set('origin', refererUrl.origin);
        console.log('[Admin API Proxy] Using Referer origin:', refererUrl.origin);
      } catch {
        // ignore
      }
    }
  }

  let body: BodyInit | undefined;
  let needsDuplex = false; // multipart/form-data인 경우 duplex 옵션 필요
  
  if (method !== 'GET' && method !== 'HEAD') {
    // contentType은 위에서 이미 가져왔으므로 재사용
    // 멀티파트 폼 데이터인 경우 ReadableStream을 직접 전달
    if (contentType && contentType.includes('multipart/form-data')) {
      // Content-Type 헤더에 boundary가 포함되어 있는지 확인
      if (!contentType.includes('boundary=')) {
        console.warn('[Admin API Proxy] multipart/form-data Content-Type에 boundary가 없습니다:', contentType);
      } else {
        console.log('[Admin API Proxy] multipart/form-data를 ReadableStream으로 전달합니다. boundary:', contentType.match(/boundary=([^;]+)/)?.[1]);
      }
      // ReadableStream을 직접 전달 (duplex 옵션 필요)
      // Functions 쪽에서 Node.js Stream으로 변환하여 처리
      if (request.body) {
        body = request.body;
        needsDuplex = true; // multipart/form-data는 항상 duplex 필요
        console.log('[Admin API Proxy] ReadableStream을 직접 전달합니다. duplex 옵션 필요.');
      } else {
        console.warn('[Admin API Proxy] 요청 body가 없습니다.');
      }
    } else {
      try {
        const ab = await request.arrayBuffer();
        body = ab.byteLength > 0 ? ab : undefined;
      } catch {
        // ignore
      }
    }
  }

  try {
    // ReadableStream인 경우 duplex 옵션 필요
    // Node.js fetch의 duplex 옵션은 RequestInit 타입에 없으므로 타입 단언 사용
    const fetchOptions: RequestInit & { duplex?: 'half' } = {
      method,
      headers,
    };
    
    // multipart/form-data인 경우 항상 duplex 옵션 추가
    // duplex 옵션은 body를 설정하기 전에 설정해야 함
    if (needsDuplex && body) {
      fetchOptions.duplex = 'half';
      fetchOptions.body = body;
      console.log('[Admin API Proxy] multipart/form-data body에 duplex: "half" 옵션 추가');
    } else if (body) {
      fetchOptions.body = body;
    }
    
    const response = await fetch(url.toString(), fetchOptions);

    // IMPORTANT: 헤더를 먼저 읽어야 함 (body를 읽기 전에)
    const anyHeaders = response.headers as any;
    let setCookieValues: string[] = [];

    // Prefer undici / Node fetch helper when available
    if (typeof anyHeaders.getSetCookie === 'function') {
      setCookieValues = anyHeaders.getSetCookie();
      console.log('[Admin API Proxy] Using getSetCookie(), found', setCookieValues.length, 'cookies');
    } else if (typeof anyHeaders.raw === 'function') {
      const rawHeaders = anyHeaders.raw?.() || {};
      setCookieValues = rawHeaders['set-cookie'] || [];
      console.log('[Admin API Proxy] Using raw(), found', setCookieValues.length, 'cookies');
      console.log('[Admin API Proxy] Raw headers:', rawHeaders);
    } else {
      // Web API Headers는 getAll()이 없으므로 get() 사용
      // Express는 보통 하나의 Set-Cookie만 설정하지만, 여러 개일 수 있으므로
      // raw()가 없으면 get()으로 단일 헤더 읽기
      const single = response.headers.get('set-cookie');
      if (single) {
        setCookieValues = [single];
        console.log('[Admin API Proxy] Using get("set-cookie"), found 1 cookie');
        console.log('[Admin API Proxy] Set-Cookie header value:', single.substring(0, 100) + '...');
      } else {
        // Set-Cookie 헤더가 없는 경우, 모든 헤더를 확인
        const allHeaders = Array.from(response.headers.entries());
        const setCookieHeaders = allHeaders.filter(([key]) => key.toLowerCase() === 'set-cookie');
        if (setCookieHeaders.length > 0) {
          setCookieValues = setCookieHeaders.map(([, value]) => value);
          console.log('[Admin API Proxy] Found Set-Cookie headers by iterating:', setCookieValues.length);
        } else {
          console.log('[Admin API Proxy] No Set-Cookie header found using get()');
        }
      }
    }

    console.log('[Admin API Proxy] Functions response status:', response.status);
    console.log('[Admin API Proxy] Functions response headers:', Object.fromEntries(response.headers.entries()));
    console.log('[Admin API Proxy] Set-Cookie values found:', setCookieValues.length);

    // 이제 body 읽기
    const responseBody = await response.text();
    let jsonBody: any;
    try {
      jsonBody = JSON.parse(responseBody);
    } catch {
      jsonBody = responseBody;
    }
    
    // Functions 에러 로깅 (500 에러인 경우)
    if (response.status >= 500) {
      console.error('[Admin API Proxy] Functions 500 에러 응답:', {
        status: response.status,
        body: jsonBody,
        rawBody: responseBody.substring(0, 500), // 처음 500자만
      });
    }

    const nextResponse = NextResponse.json(jsonBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy Set-Cookie headers
    if (setCookieValues.length > 0) {
      setCookieValues.forEach((cookie: string) => {
        nextResponse.headers.append('Set-Cookie', cookie);
        console.log('[Admin API Proxy] Forwarding cookie:', cookie.substring(0, 80) + '...');
      });
    } else {
      console.warn('[Admin API Proxy] ⚠️ No Set-Cookie headers found in Functions response');
      console.warn('[Admin API Proxy] All response headers:', Array.from(response.headers.entries()));
    }
    
    // Helpful for debugging: confirm whether proxy saw Set-Cookie from Functions.
    nextResponse.headers.set('x-ats-cookie-forward-count', String(setCookieValues.length));
    console.log('[Admin API Proxy] Set x-ats-cookie-forward-count:', setCookieValues.length);

    // Copy other headers
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // IMPORTANT:
      // Node/undici `fetch()` transparently decompresses gz/br responses by default.
      // If we forward upstream `content-encoding` while sending an already-decoded body,
      // browsers will fail with `ERR_CONTENT_DECODING_FAILED` even when status is 200.
      // So we must NOT forward encoding/transfer-related headers.
      if (
        lowerKey !== 'set-cookie' &&
        lowerKey !== 'content-type' &&
        lowerKey !== 'content-length' &&
        lowerKey !== 'content-encoding' &&
        lowerKey !== 'transfer-encoding'
      ) {
        nextResponse.headers.set(key, value);
      }
    });

    return nextResponse;
  } catch (error: any) {
    console.error('[Admin API Proxy] Error:', error);
    return NextResponse.json(
      { error: '프록시 요청 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}


