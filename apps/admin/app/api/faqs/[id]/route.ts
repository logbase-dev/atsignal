import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FAQ, LocalizedField } from '@/lib/admin/types';

// Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
}

// LocalizedField 정규화 함수
function normalizeLocalizedField(field?: { ko?: string; en?: string }): LocalizedField {
  if (!field) {
    return { ko: '' };
  }
  return {
    ko: field.ko ?? '',
    ...(field.en ? { en: field.en } : {}),
  };
}

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

// FAQ 데이터 매핑 함수
function mapFAQData(docSnap: any): FAQ {
  const data = docSnap.data() as Record<string, any>;
  return {
    id: docSnap.id,
    question: normalizeLocalizedField(data.question),
    answer: normalizeLocalizedField(data.answer),
    categoryId: data.categoryId && String(data.categoryId).trim() ? String(data.categoryId) : undefined,
    level: Number(data.level ?? 999),
    isTop: Boolean(data.isTop ?? false),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    tags: Array.isArray(data.tags) ? data.tags.filter((tag: any) => typeof tag === 'string') : undefined,
    editorType: data.editorType || 'toast',
    saveFormat: data.saveFormat || 'markdown',
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    order: data.order !== undefined ? Number(data.order) : undefined,
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

/**
 * GET /api/faqs/[id]
 * FAQ 단일 조회
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const faqRef = doc(db, 'faqs', id);
    const faqSnap = await getDoc(faqRef);

    if (!faqSnap.exists()) {
      return NextResponse.json(
        { error: 'FAQ를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const faq = mapFAQData(faqSnap);
    return NextResponse.json({ faq });
  } catch (error: any) {
    console.error('[GET /api/faqs/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: 'FAQ 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/faqs/[id]
 * FAQ 정보 수정
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

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

    const { id } = await params;

    // FAQ 존재 여부 확인
    const faqRef = doc(db, 'faqs', id);
    const faqSnap = await getDoc(faqRef);

    if (!faqSnap.exists()) {
      return NextResponse.json(
        { error: 'FAQ를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 요청 본문 파싱
    const body: Partial<Omit<FAQ, 'id' | 'createdBy' | 'updatedBy'>> = await request.json();

    // FAQ 수정 (updatedBy 추가)
    await updateDoc(faqRef, removeUndefinedFields({
      ...body,
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: adminId,
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/faqs/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: 'FAQ 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

