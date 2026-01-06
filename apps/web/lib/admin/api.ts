/**
 * Admin API URL helper
 * - 개발 서버: Next.js API Route 직접 사용 (쿠키 생성 확실)
 * - 실서버: Functions 프록시 사용
 * 
 * 환경 변수 제어:
 * - NEXT_PUBLIC_ADMIN_USE_FUNCTIONS=false: Next.js API Route 직접 사용
 * - NEXT_PUBLIC_ADMIN_USE_FUNCTIONS=true 또는 미설정: Functions 프록시 사용
 */
export function getAdminApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // 개발 환경에서는 로컬 Next.js API Route 사용
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    // Dev: allow switching via env (false -> direct Next API routes for cookie stability)
    const useFunctions = process.env.NEXT_PUBLIC_ADMIN_USE_FUNCTIONS !== "false";
    
    // 서버 사이드에서는 절대 URL 필요
    if (typeof window === 'undefined') {
      const baseUrl = useFunctions ? 'http://localhost:3000' : 'http://localhost:3000';
      return useFunctions ? `${baseUrl}/admin-api/admin/${cleanPath}` : `${baseUrl}/api/admin/${cleanPath}`;
    }
    
    return useFunctions ? `/admin-api/admin/${cleanPath}` : `/api/admin/${cleanPath}`;
  }

  // 프로덕션 환경에서 서버 사이드 렌더링 시 절대 URL 필요
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 배포된 도메인의 절대 URL 사용
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'https://web-ssr--atsignal.asia-east1.hosted.app'; // Firebase App Hosting 기본 도메인
    
    return `${baseUrl}/admin-api/admin/${cleanPath}`;
  }

  // 클라이언트 사이드에서는 상대 경로 사용
  return `/admin-api/admin/${cleanPath}`;
}

export type AdminAuthMode = "cookie" | "token";

export function getAdminAuthMode(): AdminAuthMode {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE || "").toLowerCase();

  // IMPORTANT:
  // - `NEXT_PUBLIC_*` is baked into the client bundle at build time.
  // - We only want token mode for local development experiments.
  // - In production (App Hosting / real domains), force cookie mode to avoid
  //   accidental Firebase Auth sign-in attempts (identitytoolkit 400, etc).
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) return "cookie";

  return raw === "token" ? "token" : "cookie";
}

const TOKEN_STORAGE_KEY = "ats_admin_id_token";

export function setAdminIdToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAdminIdToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function getAdminIdToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function adminFetch(path: string, init: RequestInit = {}) {
  const mode = getAdminAuthMode();
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (mode === "token") {
    const token = await getAdminIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(getAdminApiUrl(path), {
      ...init,
      headers,
      credentials: mode === "cookie" ? "include" : "omit",
    });

    // 에러 로깅 추가
    if (!response.ok) {
      console.error(`Admin API Error: ${response.status} ${response.statusText}`, {
        url: getAdminApiUrl(path),
        method: init.method || 'GET',
        mode,
        headers: Object.fromEntries(headers.entries())
      });
    }

    return response;
  } catch (error) {
    console.error('Admin Network Error:', error, {
      url: getAdminApiUrl(path),
      method: init.method || 'GET',
      mode
    });
    throw error;
  }
}


