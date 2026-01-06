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
    const target = formData.get('target') as string || 'editor'; // target 파라미터 추가
    
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
      target,
      elapsed: Date.now() - startTime + "ms"
    });

    // Storage bucket 초기화
    const bucket = admin.storage().bucket();
    console.log("[Next.js Image Upload] Storage bucket 초기화 완료:", Date.now() - startTime, "ms");

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const baseName = `${timestamp}-${safeName}`;

    // target에 따라 저장 경로 결정
    const getStoragePath = (target: string, sizeName?: string): string => {
      switch (target) {
        case 'editor':
          return `images/editor/${sizeName}/${baseName}`;
        case 'authorImage':
          return `images/blog/author/${baseName}`;
        case 'thumbnail':
          return `images/blog/thumbnail/${baseName}`;
        case 'featuredImage':
          return `images/blog/featured/${baseName}`;
        case 'event-featured':
          return `images/events/featured/${baseName}`;
        case 'event-thumbnail':
          return `images/events/thumbnail/${baseName}`;
        default:
          return `images/editor/${sizeName}/${baseName}`;
      }
    };

    // 에디터 이미지는 다중 크기, 나머지는 단일 파일
    const isEditorImage = target === 'editor';
    
    if (isEditorImage) {
      // 에디터 이미지: 기존 로직 (다중 크기)
      const sizes = [
        { name: "thumbnail", width: 300 },
        { name: "medium", width: 800 },
        { name: "large", width: 1200 },
      ];
      const targetSizes = maxWidth ? sizes.filter((s) => s.width <= maxWidth) : sizes;
      console.log("[Next.js Image Upload] 에디터 이미지 - 대상 크기들:", targetSizes);

      const uploadOne = async (name: string, width: number) => {
        const resizeStart = Date.now();
        const optimized = await sharp(fileBuffer)
          .resize(width, null, { withoutEnlargement: true, fit: "inside" })
          .webp({ quality: 80 })
          .toBuffer();
        console.log(`[Next.js Image Upload] ${name} 리사이징 완료:`, Date.now() - resizeStart, "ms");

        const uploadStart = Date.now();
        const storagePath = getStoragePath(target, name);
        const fileRef = bucket.file(storagePath);
        
        await fileRef.save(optimized, { 
          contentType: "image/webp", 
          resumable: false
        });
        console.log(`[Next.js Image Upload] ${name} 업로드 완료:`, Date.now() - uploadStart, "ms");
        
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
        return { name, url: publicUrl };
      };

      console.log("[Next.js Image Upload] 에디터 이미지 병렬 업로드 시작");
      const uploadPromises = targetSizes.map((s) => uploadOne(s.name, s.width));
      const results = await Promise.all(uploadPromises);
      console.log("[Next.js Image Upload] 에디터 이미지 모든 크기 업로드 완료:", Date.now() - startTime, "ms");

      // 원본 저장 (5MB 미만일 때만)
      let originalUrl: string | null = null;
      const shouldSaveOriginal = fileBuffer.length < 5 * 1024 * 1024;
      if (shouldSaveOriginal) {
        try {
          const originalStart = Date.now();
          const storagePath = getStoragePath(target, 'original');
          const fileRef = bucket.file(storagePath);
          
          await fileRef.save(fileBuffer, { 
            contentType: file.type, 
            resumable: false
          });
          
          originalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
          console.log("[Next.js Image Upload] 에디터 원본 업로드 완료:", Date.now() - originalStart, "ms");
        } catch (err) {
          console.error("[Next.js Image Upload] 에디터 원본 업로드 실패:", err);
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

      console.log("[Next.js Image Upload] 에디터 이미지 전체 완료:", Date.now() - startTime, "ms");
      return NextResponse.json(payload);
      
    } else {
      // 블로그/이벤트 이미지: 단일 파일 업로드
      console.log("[Next.js Image Upload] 단일 이미지 업로드 시작:", target);
      
      // 적절한 크기로 리사이징 (target에 따라 다른 크기)
      let targetWidth = 800; // 기본값
      switch (target) {
        case 'authorImage':
          targetWidth = 400;
          break;
        case 'thumbnail':
          targetWidth = 800;
          break;
        case 'featuredImage':
          targetWidth = 1200;
          break;
        case 'event-featured':
          targetWidth = 1200;
          break;
        case 'event-thumbnail':
          targetWidth = 800;
          break;
      }

      const resizeStart = Date.now();
      const optimized = await sharp(fileBuffer)
        .resize(targetWidth, null, { withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 80 })
        .toBuffer();
      console.log(`[Next.js Image Upload] ${target} 리사이징 완료:`, Date.now() - resizeStart, "ms");

      const uploadStart = Date.now();
      const storagePath = getStoragePath(target);
      const fileRef = bucket.file(storagePath);
      
      await fileRef.save(optimized, { 
        contentType: "image/webp", 
        resumable: false
      });
      console.log(`[Next.js Image Upload] ${target} 업로드 완료:`, Date.now() - uploadStart, "ms");
      
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      const payload: UploadResult = {
        success: true,
        originalUrl: publicUrl,
        urls: { [target]: publicUrl },
        fileName: baseName,
        originalSaved: false,
      };

      console.log("[Next.js Image Upload] 단일 이미지 전체 완료:", Date.now() - startTime, "ms");
      return NextResponse.json(payload);
    }

  } catch (error: any) {
    console.error("[Next.js Image Upload] 에러:", error);
    console.error("[Next.js Image Upload] 에러 발생 시점:", Date.now() - startTime, "ms");
    return NextResponse.json({ error: error.message || "이미지 업로드에 실패했습니다." }, { status: 500 });
  }
}