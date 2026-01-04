import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'atsignal';
const DEFAULT_FUNCTIONS_REGION = 'asia-northeast3';

function getFunctionsBase(): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://127.0.0.1:5001/${DEFAULT_PROJECT_ID}/${DEFAULT_FUNCTIONS_REGION}/api`;
  }
  return `https://${DEFAULT_FUNCTIONS_REGION}-${DEFAULT_PROJECT_ID}.cloudfunctions.net/api`;
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Sales API] 요청 받음:', { body });

    // 개발 환경에서는 Functions 에뮬레이터 직접 호출
    if (process.env.NODE_ENV === 'development') {
      const functionsUrl = `${getFunctionsBase()}/sales`;
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // 프로덕션 환경에서는 Firebase Admin SDK 직접 사용
    const admin = require('firebase-admin');
    
    // Firebase Admin 초기화 (이미 초기화되어 있으면 기존 앱 사용)
    let app;
    try {
      app = admin.app();
    } catch {
      app = admin.initializeApp();
    }
    
    const db = admin.firestore();

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

    // SalesInquiry 데이터 생성
    const salesInquiryData = {
      name: name.trim(),
      company: company.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      inquiry: inquiry.trim(),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Firestore에 저장
    const docRef = await db.collection('salesInquiries').add(salesInquiryData);

    console.log('[Sales API] Successfully created sales inquiry:', docRef.id);

    return NextResponse.json({
      success: true,
      inquiryId: docRef.id,
      message: '구매 문의가 성공적으로 접수되었습니다.',
    });

  } catch (error: any) {
    console.error('[Sales API] 에러:', error);
    
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
      { error: 'Internal server error', message: '구매 문의 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}