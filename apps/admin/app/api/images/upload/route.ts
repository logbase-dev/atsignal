import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    if (!storage) {
      return NextResponse.json(
        { error: 'Firebase Storage가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const maxWidth = formData.get('maxWidth') 
      ? parseInt(formData.get('maxWidth') as string) 
      : null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 원본 이미지 크기 확인 (5MB 이상이면 원본 저장 생략)
    const originalSizeMB = file.size / (1024 * 1024);
    const shouldSaveOriginal = originalSizeMB < 5; // 5MB 미만일 때만 원본 저장

    // 여러 크기로 이미지 최적화
    const sizes = [
      { name: 'thumbnail', width: 300 },
      { name: 'medium', width: 800 },
      { name: 'large', width: 1200 },
    ];

    // maxWidth가 지정된 경우 해당 크기 이하만 생성
    const targetSizes = maxWidth 
      ? sizes.filter(s => s.width <= maxWidth)
      : sizes;

    const uploadPromises = targetSizes.map(async ({ name, width }) => {
      try {
        // 이미지 리사이징 및 WebP 변환
        const optimized = await sharp(Buffer.from(buffer))
          .resize(width, null, { 
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: 80 })
          .toBuffer();

        // Firebase Storage에 업로드
        const storageRef = ref(storage, `images/${name}/${fileName}`);
        await uploadBytes(storageRef, optimized);
        const url = await getDownloadURL(storageRef);

        return { name, url, width };
      } catch (error) {
        console.error(`[Image Upload] ${name} 크기 생성 실패:`, error);
        return null;
      }
    });

    // 원본 이미지 업로드 (5MB 미만일 때만)
    let originalUrl = null;
    if (shouldSaveOriginal) {
      try {
        const originalRef = ref(storage, `images/original/${fileName}`);
        await uploadBytes(originalRef, Buffer.from(buffer));
        originalUrl = await getDownloadURL(originalRef);
      } catch (error) {
        console.error('[Image Upload] 원본 이미지 업로드 실패:', error);
        // 원본 업로드 실패해도 최적화된 버전은 정상 반환
      }
    }

    const results = await Promise.all(uploadPromises);
    const urls = results.filter(Boolean).reduce((acc, result) => {
      if (result) {
        acc[result.name] = result.url;
      }
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      originalUrl,
      urls,
      fileName,
      originalSaved: shouldSaveOriginal,
    });
  } catch (error: any) {
    console.error('[Image Upload] 에러:', error);
    return NextResponse.json(
      { error: error.message || '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}

