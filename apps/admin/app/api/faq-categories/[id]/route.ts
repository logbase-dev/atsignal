import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { doc, getDoc, updateDoc, collection, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
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
 * GET /api/faq-categories/[id]
 * FAQ 카테고리 단일 조회
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
    const categoryRef = doc(db, 'faqCategories', id);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      return NextResponse.json(
        { error: 'FAQ 카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const category = mapFAQCategoryData(categorySnap);
    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('[GET /api/faq-categories/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: 'FAQ 카테고리 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/faq-categories/[id]
 * FAQ 카테고리 정보 수정 (순서 재조정 포함)
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
    const adminId = await getAdminIdFromCookie();

    const { id } = await params;

    // 카테고리 존재 여부 확인
    const categoryRef = doc(db, 'faqCategories', id);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      return NextResponse.json(
        { error: 'FAQ 카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentData = categorySnap.data() as Record<string, any>;
    const oldOrder = currentData.order;

    // 요청 본문 파싱
    const body: Partial<Omit<FAQCategory, 'id' | 'createdBy'>> = await request.json();

    // 순서가 변경되는 경우 다른 카테고리들의 순서도 재조정
    if (body.order !== undefined && body.order !== oldOrder) {
      const allCategoriesRef = collection(db, 'faqCategories');
      const allCategoriesSnap = await getDocs(allCategoriesRef);
      
      const batch = writeBatch(db);
      const newOrder = body.order;
      
      if (newOrder > oldOrder) {
        // 순서가 증가한 경우 (4 → 8): 5~8번이 4~7번으로 당겨짐
        allCategoriesSnap.docs.forEach((docSnap) => {
          if (docSnap.id === id) return; // 현재 수정 중인 카테고리는 제외
          
          const data = docSnap.data();
          const order = data.order;
          
          if (order > oldOrder && order <= newOrder) {
            // oldOrder < order <= newOrder 범위의 카테고리들을 1씩 감소
            batch.update(docSnap.ref, { order: order - 1 });
          }
        });
      } else {
        // 순서가 감소한 경우 (8 → 4): 4~7번이 5~8번으로 밀려남
        allCategoriesSnap.docs.forEach((docSnap) => {
          if (docSnap.id === id) return; // 현재 수정 중인 카테고리는 제외
          
          const data = docSnap.data();
          const order = data.order;
          
          if (order >= newOrder && order < oldOrder) {
            // newOrder <= order < oldOrder 범위의 카테고리들을 1씩 증가
            batch.update(docSnap.ref, { order: order + 1 });
          }
        });
      }
      
      // 배치 업데이트 실행
      await batch.commit();
    }

    // 카테고리 정보 업데이트
    const now = Timestamp.fromDate(new Date());
    await updateDoc(categoryRef, removeUndefinedFields({
      ...body,
      updatedAt: now,
      updatedBy: adminId,
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/faq-categories/[id]] 에러:', error.message);
    
    if (error.message.includes('인증')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'FAQ 카테고리 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

