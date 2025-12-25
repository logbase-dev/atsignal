import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FAQ } from '@/lib/admin/types';

// undefined 값을 제거하는 헬퍼 함수
function removeUndefinedFields(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * POST /api/faqs
 * 새 FAQ 생성
 */
export async function POST(request: Request) {
  try {
    // 인증 확인
    const cookieStore = await cookies();
    const authToken = cookieStore.get('admin-auth')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      );
    }

    // 토큰에서 관리자 ID 추출
    let adminId: string;
    try {
      const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
      const [id] = decoded.split(':');
      if (!id) {
        return NextResponse.json(
          { error: '유효하지 않은 인증 토큰입니다.' },
          { status: 401 }
        );
      }
      adminId = id;
    } catch (error) {
      return NextResponse.json(
        { error: '인증 토큰 처리 중 오류가 발생했습니다.' },
        { status: 401 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firestore가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 요청 본문 파싱
    const body: Omit<FAQ, 'id' | 'createdBy' | 'updatedBy'> = await request.json();

    // 필수 필드 검증
    if (!body.question?.ko) {
      return NextResponse.json(
        { error: '질문(한국어)은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (!body.answer?.ko) {
      return NextResponse.json(
        { error: '답변(한국어)은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // FAQ 생성 (createdBy, updatedBy 추가)
    const faqsRef = collection(db, 'faqs');
    const now = Timestamp.fromDate(new Date());
    const docRef = await addDoc(faqsRef, removeUndefinedFields({
      ...body,
      level: body.level ?? 999,
      isTop: body.isTop ?? false,
      order: body.order ?? 0,
      createdAt: now,
      updatedAt: now,
      createdBy: adminId,
      updatedBy: adminId,
    }));

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('[POST /api/faqs] 에러:', error.message);
    return NextResponse.json(
      { error: 'FAQ 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

