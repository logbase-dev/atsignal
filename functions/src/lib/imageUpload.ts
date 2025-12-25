export interface ImageUploadResult {
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  fileName: string;
}

export async function uploadImage(
  file: File, 
  options?: { maxWidth?: number }
): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.maxWidth) {
    formData.append('maxWidth', String(options.maxWidth));
  }

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '이미지 업로드에 실패했습니다.');
  }

  const data = await response.json();
  
  return {
    originalUrl: data.originalUrl,
    thumbnailUrl: data.urls.thumbnail || data.originalUrl,
    mediumUrl: data.urls.medium || data.originalUrl,
    largeUrl: data.urls.large || data.originalUrl,
    fileName: data.fileName,
  };
}

