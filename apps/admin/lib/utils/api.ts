/**
 * Admin API Base URL
 * 로컬 개발: Firebase Functions Emulator
 * 프로덕션: 실제 Firebase Functions URL
 */
export function getApiBaseUrl(): string {
    // 개발 환경에서 Functions Emulator 사용
    if (process.env.NODE_ENV === 'development') {
      // NOTE: Functions region = asia-northeast3 (Seoul)
      // Emulator URL uses /<project>/<region>/<functionName>
      return process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_URL || 'http://localhost:5001/atsignal/asia-northeast3/api';
    }
    
    // 프로덕션 환경
    return process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://asia-northeast3-atsignal.cloudfunctions.net/api';
  }
  
  /**
   * Admin API 엔드포인트 URL 생성
   * @param path API 경로 (예: 'auth/me', 'admins')
   */
  export function getAdminApiUrl(path: string): string {
    const baseUrl = getApiBaseUrl();
    // Functions 라우팅: /admin/* 경로 사용
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/admin/${cleanPath}`;
  }