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
  
  // IMPORTANT:
  // In production builds (App Hosting), some `*.hosted.app` domains can block `/api/*` at the edge.
  // Also, `NEXT_PUBLIC_*` envs are baked at build-time and can be tricky to reason about across rollouts.
  // So in non-dev, we always use the `/admin-api/*` proxy route.
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return `/admin-api/admin/${cleanPath}`;
  }

  // Dev: allow switching via env (false -> direct Next API routes for cookie stability)
  const useFunctions = process.env.NEXT_PUBLIC_ADMIN_USE_FUNCTIONS !== "false";
  return useFunctions ? `/admin-api/admin/${cleanPath}` : `/api/admin/${cleanPath}`;
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

  return fetch(getAdminApiUrl(path), {
    ...init,
    headers,
    credentials: mode === "cookie" ? "include" : "omit",
  });
}


