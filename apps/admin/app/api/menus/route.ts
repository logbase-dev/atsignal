import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Menu, Site, LocalizedField } from '@/lib/admin/types';

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
 * GET /api/menus
 * 메뉴 목록 조회
 */
export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site') as Site | null;

    if (!site || (site !== 'web' && site !== 'docs')) {
      return NextResponse.json(
        { error: '유효한 site 파라미터가 필요합니다 (web 또는 docs).' },
        { status: 400 }
      );
    }

    const menusRef = collection(db, 'menus');
    const q = query(menusRef, where('site', '==', site));
    const querySnapshot = await getDocs(q);
    
    const menus = querySnapshot.docs.map(mapMenuData);
    // order로 정렬
    menus.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return NextResponse.json({ menus });
  } catch (error: any) {
    console.error('[GET /api/menus] 에러:', error.message);
    return NextResponse.json(
      { error: '메뉴 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menus
 * 새 메뉴 생성
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
    const body: Omit<Menu, 'id' | 'createdBy' | 'updatedBy'> = await request.json();

    if (!body.site || (body.site !== 'web' && body.site !== 'docs')) {
      return NextResponse.json(
        { error: '유효한 site가 필요합니다 (web 또는 docs).' },
        { status: 400 }
      );
    }

    if (!body.labels?.ko) {
      return NextResponse.json(
        { error: '메뉴 이름(한국어)은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (!body.path) {
      return NextResponse.json(
        { error: '경로(path)는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    const now = Timestamp.fromDate(new Date());
    const menuData = removeUndefinedFields({
      ...body,
      parentId: body.parentId || '0',
      enabled: body.enabled || { ko: true, en: false },
      pageType: body.pageType || 'dynamic',
      createdAt: now,
      updatedAt: now,
      createdBy: adminId,
      updatedBy: adminId,
    });

    const menusRef = collection(db, 'menus');
    const docRef = await addDoc(menusRef, menuData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('[POST /api/menus] 에러:', error.message);
    
    if (error.message.includes('인증')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '메뉴 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

