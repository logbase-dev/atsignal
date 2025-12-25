import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Menu, LocalizedField } from '@/lib/admin/types';

// undefined 값을 제거하는 헬퍼 함수
function removeUndefinedFields(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // 중첩된 객체도 undefined 값 제거
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Timestamp)) {
        const cleanNested: Record<string, any> = {};
        Object.keys(value).forEach(nestedKey => {
          if (value[nestedKey] !== undefined) {
            cleanNested[nestedKey] = value[nestedKey];
          }
        });
        cleaned[key] = cleanNested;
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
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

// Menu 데이터 매핑 함수
function mapMenuData(docSnap: any): Menu {
  const data = docSnap.data() as Record<string, any>;
  
  return {
    id: docSnap.id,
    site: data.site,
    labels: data.labels || { ko: '', en: '' },
    path: data.path || '',
    pageType: data.pageType || 'dynamic',
    depth: data.depth || 0,
    parentId: data.parentId || '0',
    order: data.order || 0,
    enabled: data.enabled || { ko: true, en: false },
    description: data.description,
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
 * GET /api/menus/[id]
 * 메뉴 단일 조회
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
    const menuRef = doc(db, 'menus', id);
    const menuSnap = await getDoc(menuRef);

    if (!menuSnap.exists()) {
      return NextResponse.json(
        { error: '메뉴를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const menu = mapMenuData(menuSnap);
    return NextResponse.json({ menu });
  } catch (error: any) {
    console.error('[GET /api/menus/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: '메뉴 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/menus/[id]
 * 메뉴 정보 수정
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

    // 메뉴 존재 여부 확인
    const menuRef = doc(db, 'menus', id);
    const menuSnap = await getDoc(menuRef);

    if (!menuSnap.exists()) {
      return NextResponse.json(
        { error: '메뉴를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingMenu = menuSnap.data() as Menu;

    // 요청 본문 파싱
    const body: Partial<Omit<Menu, 'id' | 'createdBy'>> = await request.json();

    // path가 변경되는 경우, 연결된 페이지의 slug도 업데이트 (외부 링크가 아닌 경우만)
    if (body.path !== undefined && body.path !== existingMenu.path && existingMenu.pageType !== 'links') {
      const pagesRef = collection(db, 'pages');
      const pagesQuery = query(pagesRef, where('menuId', '==', id));
      const pagesSnapshot = await getDocs(pagesQuery);
      
      // 연결된 모든 페이지의 slug 업데이트
      const updatePromises = pagesSnapshot.docs.map((pageDoc) => {
        return updateDoc(doc(db, 'pages', pageDoc.id), {
          slug: body.path,
        });
      });
      
      await Promise.all(updatePromises);
    }

    // 메뉴 업데이트
    const now = Timestamp.fromDate(new Date());
    await updateDoc(menuRef, removeUndefinedFields({
      ...body,
      updatedAt: now,
      updatedBy: adminId,
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/menus/[id]] 에러:', error.message);
    
    if (error.message.includes('인증')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '메뉴 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

