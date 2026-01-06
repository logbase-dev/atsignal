import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Event Participate API] 요청 받음:', { body });

    // Firebase Admin SDK 직접 사용
    const admin = require('firebase-admin');
    
    // Firebase Admin 초기화 (이미 초기화되어 있으면 기존 앱 사용)
    let app;
    try {
      app = admin.app();
    } catch {
      app = admin.initializeApp();
    }
    
    const db = admin.firestore();

    const { eventId, name, company, email, phone, privacyConsent } = body;

    // 필수 필드 검증
    if (!eventId || !name || !company || !email || !phone || !privacyConsent) {
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

    // 이벤트 존재 확인
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found', message: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 중복 참가 신청 확인 및 저장을 트랜잭션으로 처리
    console.log('[Event Participate API] 트랜잭션 시작:', { eventId, email });
    
    const result = await db.runTransaction(async (transaction: any) => {
      // 더 안전한 중복 체크: 복합 키 사용
      const participantId = `${eventId}_${email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}`;
      const participantRef = db.collection('eventParticipants').doc(participantId);
      
      console.log('[Event Participate API] 중복 체크 중:', { participantId });
      
      const existingDoc = await transaction.get(participantRef);
      
      console.log('[Event Participate API] 기존 문서 확인:', { 
        exists: existingDoc.exists,
        participantId 
      });
      
      if (existingDoc.exists) {
        console.log('[Event Participate API] 중복 참가 신청 발견!');
        throw new Error('ALREADY_REGISTERED');
      }
      
      // EventParticipant 데이터 생성
      const participantData = {
        eventId,
        name: name.trim(),
        company: company.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        privacyConsent,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      console.log('[Event Participate API] 새 참가자 저장 중:', { participantId });
      
      // 고정된 문서 ID로 저장 (자동으로 중복 방지)
      transaction.set(participantRef, participantData);
      
      return participantId;
    });

    console.log('[Event Participate API] Successfully created participant:', result);

    return NextResponse.json({
      success: true,
      participantId: result,
      message: '이벤트 참가 신청이 완료되었습니다.',
    });

  } catch (error: any) {
    console.error('[Event Participate API] 에러:', error);
    
    // 트랜잭션에서 발생한 중복 등록 에러 처리
    if (error instanceof Error && error.message === 'ALREADY_REGISTERED') {
      return NextResponse.json(
        { error: 'Already registered for this event', message: '이미 해당 이벤트에 참가신청 했습니다.' },
        { status: 409 }
      );
    }
    
    // Firestore 에러 구분
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          { error: 'Permission denied', message: '권한이 없습니다.' },
          { status: 403 }
        );
      } else if (error.message.includes('not-found')) {
        return NextResponse.json(
          { error: 'Event not found', message: '이벤트를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: '참가 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}