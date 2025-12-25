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
 * 로컬 방식: Functions 직접 업로드
 */
async function uploadViaFunctions(
  file: File,
  target: 'editor' | 'authorImage' | 'thumbnail' | 'featuredImage',
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
  // upload.ts는 images/thumbnail/, images/medium/, images/large/에 저장
  // originalUrl은 images/original/에 저장 (5MB 미만일 때만)
  return {
    originalUrl: result.originalUrl || result.urls?.medium || '',
    thumbnailUrl: result.urls?.thumbnail,
    mediumUrl: result.urls?.medium,
    largeUrl: result.urls?.large,
    fileName: result.fileName,
  };
}

/**
 * Signed URL 요청
 */
async function getSignedUrl(
  fileName: string,
  contentType: string,
  target: 'editor' | 'authorImage' | 'thumbnail' | 'featuredImage'
): Promise<{ uploadUrl: string; publicUrl: string; path: string; fileName: string }> {
  const url = `/admin-api/admin/images/signed-url`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      contentType,
      target,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Signed URL 생성에 실패했습니다.');
  }

  return await response.json();
}

/**
 * Storage에 직접 업로드
 */
async function uploadToStorage(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Storage 업로드 실패: ${response.status} ${response.statusText}`);
  }
}

/**
 * 프로덕션 방식: Signed URL 사용
 */
async function uploadViaSignedUrl(
  file: File,
  target: 'editor' | 'authorImage' | 'thumbnail' | 'featuredImage',
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

  // Signed URL 요청
  const { uploadUrl, publicUrl, fileName: uploadedFileName } = await getSignedUrl(
    fileToUpload.name,
    fileToUpload.type,
    target
  );

  // Storage에 직접 업로드
  await uploadToStorage(uploadUrl, fileToUpload);
  console.log('[Image Upload] Storage 업로드 완료:', publicUrl);

  // 후처리된 이미지 URL 생성
  const urlObj = new URL(publicUrl);
  const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
  if (!pathMatch) {
    throw new Error('Invalid public URL format');
  }
  
  const encodedPath = pathMatch[1];
  const decodedPath = decodeURIComponent(encodedPath);
  const pathParts = decodedPath.split('/');
  const fileNamePart = pathParts[pathParts.length - 1];
  const basePath = decodedPath.replace(`/${fileNamePart}`, '');

  if (target === 'editor') {
    const bucketName = urlObj.pathname.match(/\/b\/([^/]+)/)?.[1];
    if (!bucketName) {
      throw new Error('Invalid bucket name in URL');
    }
    
    const buildUrl = (size: string) => {
      const sizePath = `${basePath}/${size}/${fileNamePart}`;
      return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(sizePath)}?alt=media`;
    };
    
    return {
      originalUrl: publicUrl,
      thumbnailUrl: buildUrl('thumbnail'),
      mediumUrl: buildUrl('medium'),
      largeUrl: buildUrl('large'),
      fileName: uploadedFileName,
    };
  } else {
    return {
      originalUrl: publicUrl,
      fileName: uploadedFileName,
    };
  }
}

/**
 * 이미지 업로드 (환경에 따라 자동 선택)
 */
export async function uploadImage(
  file: File,
  options?: { maxWidth?: number; target?: 'thumbnail' | 'featuredImage' | 'authorImage' | 'editor' }
): Promise<ImageUploadResult> {
  // 파일 크기 확인 (10MB 제한)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('이미지 크기는 10MB를 초과할 수 없습니다.');
  }

  const target = options?.target || 'editor';
  const maxWidth = options?.maxWidth;

  // 환경에 따라 방식 선택
  if (isLocalDevelopment()) {
    console.log('[Image Upload] 로컬 환경: Functions 직접 업로드 방식 사용');
    return await uploadViaFunctions(file, target, maxWidth);
  } else {
    console.log('[Image Upload] 프로덕션 환경: Signed URL 방식 사용');
    return await uploadViaSignedUrl(file, target, maxWidth);
  }
}
