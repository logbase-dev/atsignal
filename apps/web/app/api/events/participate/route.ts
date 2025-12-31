import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { EventParticipant } from '@/lib/admin/types';

/**
 * 이벤트 참가 신청 API
 * POST /api/events/participate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, company, email, phone, privacyConsent } = body;

    // 필수 필드 검증
    if (!eventId || !name || !company || !email || !phone || !privacyConsent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (010-1234-5678)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format' },
        { status: 400 }
      );
    }

    console.log('[Event Participate API] Processing request:', { 
      eventId, name, company, email, phone 
    });

    // 이벤트 존재 확인
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // 중복 참가 신청 확인 (같은 이벤트에 같은 이메일로 신청)
    const existingParticipant = await db
      .collection('eventParticipants')
      .where('eventId', '==', eventId)
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (!existingParticipant.empty) {
      return NextResponse.json(
        { 
          error: 'Already registered for this event', 
          message: '이미 해당 이벤트에 참가신청 했습니다.' 
        },
        { status: 409 }
      );
    }

    // EventParticipant 데이터 생성
    const participantData: Omit<EventParticipant, 'id'> = {
      eventId,
      name: name.trim(),
      company: company.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      privacyConsent,
      createdAt: new Date(),
    };

    // Firestore에 저장
    const docRef = await db.collection('eventParticipants').add(participantData);

    console.log('[Event Participate API] Successfully created participant:', docRef.id);

    return NextResponse.json({
      success: true,
      participantId: docRef.id,
      message: '이벤트 참가 신청이 완료되었습니다.',
    });

  } catch (error) {
    console.error('[Event Participate API] Error:', error);
    
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