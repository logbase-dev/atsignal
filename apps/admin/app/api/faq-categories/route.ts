import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { collection, addDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FAQCategory, LocalizedField } from '@/lib/admin/types';

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

// FAQCategory 데이터 매핑 함수
function mapFAQCategoryData(docSnap: any): FAQCategory {
  const data = docSnap.data() as Record<string, any>;
  
  return {
    id: docSnap.id,
    name: normalizeLocalizedField(data.name),
    description: data.description ? normalizeLocalizedField(data.description) : undefined,
    order: Number(data.order ?? 0),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

// 관리자 ID 추출 헬퍼 함수
async function getAdminIdFromCookie(): Promise<string> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('admin-auth')?.value;

  if (!authToken) {
    throw new Error('인증되지 않았습니다.');
  }

  try {
    const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
    const [id] = decoded.split(':');
    if (!id) {
      throw new Error('유효하지 않은 인증 토큰입니다.');
    }
    return id;
  } catch (error) {
    throw new Error('인증 토큰 처리 중 오류가 발생했습니다.');
  }
}

/**
 * GET /api/faq-categories
 * FAQ 카테고리 목록 조회
 */
export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    const categoriesRef = collection(db, 'faqCategories');
    
    // order 기준으로 정렬 시도
    let q;
    try {
      q = query(categoriesRef, orderBy('order', 'asc'));
    } catch (error) {
      console.warn('orderBy failed, fetching without order:', error);
      q = query(categoriesRef);
    }
    
    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map(mapFAQCategoryData);
    
    // orderBy가 실패한 경우 클라이언트에서 정렬
    if (!q || !q['_query']?.orderBy) {
      categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('[GET /api/faq-categories] 에러:', error.message);
    return NextResponse.json(
      { error: 'FAQ 카테고리 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faq-categories
 * 새 FAQ 카테고리 생성
 */
export async function POST(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 인증 확인
    const adminId = await getAdminIdFromCookie();

    // 요청 본문 파싱
    const body: Omit<FAQCategory, 'id' | 'createdBy' | 'updatedBy'> = await request.json();

    if (!body.name?.ko) {
      return NextResponse.json(
        { error: '카테고리 이름(한국어)은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (body.order === undefined) {
      return NextResponse.json(
        { error: '순서(order)는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    const now = Timestamp.fromDate(new Date());
    const categoryData = removeUndefinedFields({
      ...body,
      enabled: body.enabled || { ko: true, en: true },
      createdAt: now,
      updatedAt: now,
      createdBy: adminId,
      updatedBy: adminId,
    });

    const categoriesRef = collection(db, 'faqCategories');
    const docRef = await addDoc(categoriesRef, categoryData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('[POST /api/faq-categories] 에러:', error.message);
    
    if (error.message.includes('인증')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'FAQ 카테고리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

