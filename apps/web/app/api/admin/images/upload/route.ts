import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import sharp from 'sharp';

type UploadResult = {
  success: boolean;
  originalUrl: string | null;
  urls: Record<string, string>;
  fileName: string;
  originalSaved: boolean;
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Next.js Image Upload] 업로드 시작");

  try {
    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const maxWidthStr = formData.get('maxWidth') as string;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }

    const maxWidth = maxWidthStr ? parseInt(maxWidthStr, 10) : undefined;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    console.log("[Next.js Image Upload] 파일 파싱 완료:", {
      fileName: file.name,
      mimeType: file.type,
      fileSize: fileBuffer.length,
      maxWidth,
      elapsed: Date.now() - startTime + "ms"
    });

    // Storage bucket 초기화
    const bucket = admin.storage().bucket();
    console.log("[Next.js Image Upload] Storage bucket 초기화 완료:", Date.now() - startTime, "ms");

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const baseName = `${timestamp}-${safeName}`;

    // 원본 크기 확인 (5MB 미만일 때만 저장)
    const shouldSaveOriginal = fileBuffer.length < 5 * 1024 * 1024;
    console.log("[Next.js Image Upload] 원본 저장 여부:", shouldSaveOriginal, "파일 크기:", fileBuffer.length);

    const sizes = [
      { name: "thumbnail", width: 300 },
      { name: "medium", width: 800 },
      { name: "large", width: 1200 },
    ];
    const targetSizes = maxWidth ? sizes.filter((s) => s.width <= maxWidth) : sizes;
    console.log("[Next.js Image Upload] 대상 크기들:", targetSizes);

    const uploadOne = async (name: string, width: number) => {
      const resizeStart = Date.now();
      const optimized = await sharp(fileBuffer)
        .resize(width, null, { withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 80 })
        .toBuffer();
      console.log(`[Next.js Image Upload] ${name} 리사이징 완료:`, Date.now() - resizeStart, "ms");

      const uploadStart = Date.now();
      const storagePath = `images/${name}/${baseName}`;
      const fileRef = bucket.file(storagePath);
      
      // 파일 업로드만 수행 (권한 설정 없음)
      await fileRef.save(optimized, { 
        contentType: "image/webp", 
        resumable: false
      });
      console.log(`[Next.js Image Upload] ${name} 업로드 완료:`, Date.now() - uploadStart, "ms");
      
      const urlStart = Date.now();
      // Firebase Storage 기본 URL 형태 사용
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
      console.log(`[Next.js Image Upload] ${name} URL 생성 완료:`, Date.now() - urlStart, "ms");
      
      return { name, url: publicUrl };
    };

    console.log("[Next.js Image Upload] 병렬 업로드 시작");
    const uploadPromises = targetSizes.map((s) => uploadOne(s.name, s.width));
    const results = await Promise.all(uploadPromises);
    console.log("[Next.js Image Upload] 모든 크기 업로드 완료:", Date.now() - startTime, "ms");

    let originalUrl: string | null = null;
    if (shouldSaveOriginal) {
      try {
        const originalStart = Date.now();
        const storagePath = `images/original/${baseName}`;
        const fileRef = bucket.file(storagePath);
        
        // 파일 업로드만 수행 (권한 설정 없음)
        await fileRef.save(fileBuffer, { 
          contentType: file.type, 
          resumable: false
        });
        
        // Firebase Storage 기본 URL 형태 사용
        originalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
        console.log("[Next.js Image Upload] 원본 업로드 완료:", Date.now() - originalStart, "ms");
      } catch (err) {
        console.error("[Next.js Image Upload] 원본 업로드 실패:", err);
      }
    }

    const urls = results.reduce((acc, cur) => {
      acc[cur.name] = cur.url;
      return acc;
    }, {} as Record<string, string>);

    const payload: UploadResult = {
      success: true,
      originalUrl,
      urls,
      fileName: baseName,
      originalSaved: shouldSaveOriginal,
    };

    console.log("[Next.js Image Upload] 전체 완료:", Date.now() - startTime, "ms");
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("[Next.js Image Upload] 에러:", error);
    console.error("[Next.js Image Upload] 에러 발생 시점:", Date.now() - startTime, "ms");
    return NextResponse.json({ error: error.message || "이미지 업로드에 실패했습니다." }, { status: 500 });
  }
}