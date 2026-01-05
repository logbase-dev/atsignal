import { getAdminApiUrl } from './api';
import imageCompression from 'browser-image-compression';

export interface ImageUploadResult {
  originalUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  fileName: string;
}

/**
 * 환경 감지: 로컬 개발 환경인지 확인
 */
function isLocalDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

/**
 * 이미지 리사이징 (에디터용)
 */
async function resizeImageForEditor(file: File, maxWidth: number = 800): Promise<File> {
  try {
    const options = {
      maxSizeMB: 1, // 최대 파일 크기 (1MB)
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
      fileType: file.type,
    };
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error: any) {
    console.error('[Image Upload] 리사이징 실패, 원본 사용:', error);
    return file; // 리사이징 실패 시 원본 사용
  }
}

/**
 * 로컬 방식: Next.js API Route 사용
 */
async function uploadViaNextjsApi(
  file: File,
  target: 'editor' | 'authorImage' | 'thumbnail' | 'featuredImage' | 'event-featured' | 'event-thumbnail',
  maxWidth?: number
): Promise<ImageUploadResult> {
  // 에디터 이미지는 클라이언트에서 리사이징
  let fileToUpload = file;
  if (target === 'editor') {
    const resizeWidth = maxWidth || 800;
    fileToUpload = await resizeImageForEditor(file, resizeWidth);
    console.log('[Image Upload] 에디터 이미지 리사이징 완료:', {
      original: file.size,
      resized: fileToUpload.size,
      width: resizeWidth,
    });
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  if (maxWidth) {
    formData.append('maxWidth', maxWidth.toString());
  }

  const response = await fetch('/api/admin/images/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '이미지 업로드에 실패했습니다.');
  }

  const result = await response.json();
  
  // 기존 upload.ts 응답 형식에 맞춰 변환
  return {
    originalUrl: result.originalUrl || result.urls?.medium || '',
    thumbnailUrl: result.urls?.thumbnail,
    mediumUrl: result.urls?.medium,
    largeUrl: result.urls?.large,
    fileName: result.fileName,
  };
}

/**
 * 프로덕션 방식: Functions API 직접 사용
 */
async function uploadViaFunctions(
  file: File,
  target: 'editor' | 'authorImage' | 'thumbnail' | 'featuredImage' | 'event-featured' | 'event-thumbnail',
  maxWidth?: number
): Promise<ImageUploadResult> {
  // 에디터 이미지는 클라이언트에서 리사이징
  let fileToUpload = file;
  if (target === 'editor') {
    const resizeWidth = maxWidth || 800;
    fileToUpload = await resizeImageForEditor(file, resizeWidth);
    console.log('[Image Upload] 에디터 이미지 리사이징 완료:', {
      original: file.size,
      resized: fileToUpload.size,
      width: resizeWidth,
    });
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  if (maxWidth) {
    formData.append('maxWidth', maxWidth.toString());
  }

  const response = await fetch(getAdminApiUrl('images/upload'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '이미지 업로드에 실패했습니다.');
  }

  const result = await response.json();
  
  // 기존 upload.ts 응답 형식에 맞춰 변환
  return {
    originalUrl: result.originalUrl || result.urls?.medium || '',
    thumbnailUrl: result.urls?.thumbnail,
    mediumUrl: result.urls?.medium,
    largeUrl: result.urls?.large,
    fileName: result.fileName,
  };
}

/**
 * 이미지 업로드 (환경에 따라 자동 선택)
 */
export async function uploadImage(
  file: File,
  options?: { maxWidth?: number; target?: 'thumbnail' | 'featuredImage' | 'authorImage' | 'editor' | 'event-featured' | 'event-thumbnail' }
): Promise<ImageUploadResult> {
  // 파일 크기 확인 (10MB 제한)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
  }

  const target = options?.target || 'editor';
  const maxWidth = options?.maxWidth;

  // 환경에 따라 방식 선택
  if (isLocalDevelopment()) {
    console.log('[Image Upload] 로컬 환경: Next.js API Route 사용');
    return await uploadViaNextjsApi(file, target, maxWidth);
  } else {
    // 
    // console.log('[Image Upload] 프로덕션 환경: Functions 직접 업로드 방식 사용');
    // return await uploadViaFunctions(file, target, maxWidth);
    console.log('[Image Upload] 프로덕션 환경: Next.js API Route 사용 (조직 정책으로 인한 우회)');
    return await uploadViaNextjsApi(file, target, maxWidth);
  }
}