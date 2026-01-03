import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { DemoRequest } from '@/lib/admin/types';

/**
 * 데모 요청 API
 * POST /api/demo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, email, phone, inquiry, privacyConsent } = body;

    // 필수 필드 검증
    if (!name || !company || !email || !phone || !inquiry || !privacyConsent) {
      return NextResponse.json(
        { error: 'Missing required fields', message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (010-1234-5678)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format', message: '올바른 전화번호 형식을 입력해주세요. (010-0000-0000)' },
        { status: 400 }
      );
    }

    console.log('[Demo Request API] Processing request:', { 
      name, company, email, phone 
    });

    // DemoRequest 데이터 생성
    const demoRequestData: Omit<DemoRequest, 'id'> = {
      name: name.trim(),
      company: company.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      inquiry: inquiry.trim(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Firestore에 저장
    const docRef = await db.collection('demoRequests').add(demoRequestData);

    console.log('[Demo Request API] Successfully created demo request:', docRef.id);

    return NextResponse.json({
      success: true,
      requestId: docRef.id,
      message: '데모 요청이 성공적으로 접수되었습니다.',
    });

  } catch (error) {
    console.error('[Demo Request API] Error:', error);
    
    // Firestore 에러 구분
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          { error: 'Permission denied', message: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: '데모 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}