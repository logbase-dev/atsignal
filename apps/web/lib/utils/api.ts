/**
 * Public API URL helper
 * - Firebase App Hosting에서 `/api/*` 경로가 403으로 막히는 문제 해결
 * - 프로덕션에서는 Functions API 사용
 * - 개발 환경에서는 Next.js API Route 사용
 */
export function getPublicApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // 개발 환경에서는 로컬 Next.js API Route 사용
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    // 서버 사이드에서는 절대 URL 필요
    if (typeof window === 'undefined') {
      return `http://localhost:3000/api/${cleanPath}`;
    }
    return `/api/${cleanPath}`;
  }

  // 프로덕션에서 Functions 직접 호출이 안되면 프록시 경로 사용
  // 환경변수로 제어 가능하게 함
  const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";
  if (useProxy) {
    return `/api/${cleanPath}`;
  }

  // 프로덕션에서는 Functions API 사용
  return `https://asia-northeast3-atsignal.cloudfunctions.net/api/${cleanPath}`;
}

/**
 * Public API fetch wrapper
 * - CORS 헤더 설정
 * - 에러 처리
 */
export async function publicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(getPublicApiUrl(path), {
      ...init,
      headers,
      mode: 'cors', // CORS 모드 명시적 설정
    });

    // 에러 로깅 추가
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`, {
        url: getPublicApiUrl(path),
        method: init.method || 'GET',
        headers: Object.fromEntries(headers.entries())
      });
    }

    return response;
  } catch (error) {
    console.error('Network Error:', error, {
      url: getPublicApiUrl(path),
      method: init.method || 'GET'
    });
    throw error;
  }
}