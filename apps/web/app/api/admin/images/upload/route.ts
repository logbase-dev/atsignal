import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[Images Upload API] 이미지 업로드 요청 받음');

    // 개발 환경에서는 Functions 에뮬레이터 호출
    if (process.env.NODE_ENV === 'development') {
      const formData = await request.formData();
      
      // Functions 에뮬레이터로 프록시
      const functionsUrl = 'http://127.0.0.1:5001/atsignal/asia-northeast3/api/admin/images/upload';
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        body: formData, // FormData를 그대로 전달
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // 프로덕션 환경에서는 Firebase Storage 직접 업로드
    const admin = require('firebase-admin');
    
    let app;
    try {
      app = admin.app();
    } catch {
      app = admin.initializeApp();
    }

    // 멀티파트 폼 데이터 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const maxWidth = formData.get('maxWidth') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', message: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    console.log('[Images Upload API] 파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type,
      maxWidth: maxWidth
    });

    // 파일 확장자 및 이름 생성
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    
    // 업로드 경로 생성 (년/월 폴더 구조)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storagePath = `images/${year}/${month}/${fileName}`;

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Firebase Storage 인스턴스 가져오기
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(storagePath);
    
    // 파일 업로드
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      }
    });

    // 공개 URL 생성
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    console.log('[Images Upload API] 업로드 성공:', { storagePath, publicUrl });

    // 기존 응답 형식에 맞춰 반환
    return NextResponse.json({
      success: true,
      originalUrl: publicUrl,
      urls: {
        medium: publicUrl,
        thumbnail: publicUrl,
        large: publicUrl
      },
      fileName: fileName,
      message: '이미지가 성공적으로 업로드되었습니다.'
    });

  } catch (error: any) {
    console.error('[Images Upload API] 업로드 에러:', error);
    
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        message: '이미지 업로드 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}