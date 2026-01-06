import type { Site } from './types';

// Web origin 가져오기 (site에 따라 올바른 origin 사용)
function getWebOrigin(): string {
  // 클라이언트 사이드: 로컬 개발 환경 감지
  if (typeof window !== 'undefined') {
    // 로컬 개발 환경인지 확인 (더 명확하게)
    const hostname = window.location.hostname;
    const isLocalDev = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.includes('localhost') ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      !hostname.includes('.');
    
    if (isLocalDev) {
      // 로컬 개발 환경: 무조건 현재 origin 사용
      const localOrigin = window.location.origin;
      console.log('[Preview] Web origin (local dev):', localOrigin, 'hostname:', hostname);
      return localOrigin;
    }
    
    // 프로덕션 환경: 환경변수 우선, 없으면 프로덕션 기본값
    const envOrigin = process.env.NEXT_PUBLIC_WEB_PREVIEW_ORIGIN || process.env.NEXT_PUBLIC_WEB_URL;
    // 잘못된 origin 필터링 (0.0.0.0, localhost 등)
    if (envOrigin && !envOrigin.includes('0.0.0.0') && !envOrigin.includes('localhost') && envOrigin.startsWith('http')) {
      console.log('[Preview] Web origin from env:', envOrigin);
      return envOrigin;
    }
    // 프로덕션 환경 기본값
    const defaultOrigin = 'https://web-ssr--atsignal.asia-east1.hosted.app';
    console.log('[Preview] Web origin using default:', defaultOrigin, '(env was:', envOrigin, ')');
    return defaultOrigin;
  }
  // 서버 사이드: 환경변수 사용
  const serverOrigin = process.env.NEXT_PUBLIC_WEB_PREVIEW_ORIGIN || process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
  // 잘못된 origin 필터링
  if (serverOrigin.includes('0.0.0.0')) {
    return 'https://web-ssr--atsignal.asia-east1.hosted.app';
  }
  return serverOrigin;
}

// Docs origin 가져오기 (site에 따라 올바른 origin 사용)
function getDocsOrigin(): string {
  // 클라이언트 사이드: 로컬 개발 환경 감지
  if (typeof window !== 'undefined') {
    // 로컬 개발 환경인지 확인 (더 명확하게)
    const hostname = window.location.hostname;
    const isLocalDev = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.includes('localhost') ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      !hostname.includes('.');
    
    if (isLocalDev) {
      // 로컬 개발 환경: 현재 origin 사용 (docs는 보통 3001 포트)
      const currentPort = window.location.port;
      const localOrigin = currentPort === '3000' 
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : window.location.origin;
      console.log('[Preview] Docs origin (local dev):', localOrigin, 'hostname:', hostname, 'port:', currentPort);
      return localOrigin;
    }
    
    // 프로덕션 환경: 환경변수 우선, 없으면 프로덕션 기본값
    const envOrigin = process.env.NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN || process.env.NEXT_PUBLIC_DOCS_URL;
    // 잘못된 origin 필터링 (0.0.0.0, localhost 등)
    if (envOrigin && !envOrigin.includes('0.0.0.0') && !envOrigin.includes('localhost') && envOrigin.startsWith('http')) {
      console.log('[Preview] Docs origin from env:', envOrigin);
      return envOrigin;
    }
    // 프로덕션 환경 기본값 (docs는 별도 App Hosting 인스턴스 사용)
    const defaultOrigin = 'https://docs-ssr--atsignal.asia-east1.hosted.app';
    console.log('[Preview] Docs origin using default:', defaultOrigin, '(env was:', envOrigin, ')');
    return defaultOrigin;
  }
  // 서버 사이드: 환경변수 사용
  const serverOrigin = process.env.NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN || process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3001';
  // 잘못된 origin 필터링
  if (serverOrigin.includes('0.0.0.0')) {
    return 'https://docs-ssr--atsignal.asia-east1.hosted.app';
  }
  return serverOrigin;
}

const PREVIEW_SECRET = process.env.NEXT_PUBLIC_PREVIEW_SECRET || 'atsignal-preview';

const ORIGIN_MAP: Record<Site, () => string> = {
  web: getWebOrigin,
  docs: getDocsOrigin,
};

export function buildPreviewUrl(site: Site, slug: string, locale: 'ko' | 'en', draftId: string) {
  const base = ORIGIN_MAP[site]();
  const sanitizedSlug = slug.replace(/^\/+/, '');
  const previewUrl = new URL('/api/preview', base);
  previewUrl.searchParams.set('secret', PREVIEW_SECRET);
  previewUrl.searchParams.set('slug', sanitizedSlug);
  previewUrl.searchParams.set('locale', locale);
  previewUrl.searchParams.set('draftId', draftId);
  previewUrl.searchParams.set('preview', '1');
  return previewUrl.toString();
}

export function buildPublishedUrl(site: Site, slug: string, locale: 'ko' | 'en' = 'ko') {
  const base = ORIGIN_MAP[site]();
  const sanitizedSlug = slug.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${base}/${locale}/${sanitizedSlug}`;
}


