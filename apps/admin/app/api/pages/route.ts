import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Page, PageDraftPayload, Site, LocalizedField } from '@/lib/admin/types';

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

// Page 데이터 매핑 함수
function mapPageData(docSnap: any): Page {
  const data = docSnap.data() as Record<string, any>;
  const EMPTY_LOCALIZED: LocalizedField = { ko: '', en: '' };
  
  return {
    id: docSnap.id,
    site: data.site,
    menuId: data.menuId,
    slug: data.slug,
    labelsLive: normalizeLocalizedField(data.labelsLive ?? data.labels),
    labelsDraft: data.labelsDraft ? normalizeLocalizedField(data.labelsDraft) : undefined,
    contentLive: normalizeLocalizedField(data.contentLive ?? data.content),
    contentDraft: data.contentDraft ? normalizeLocalizedField(data.contentDraft) : undefined,
    editorType: data.editorType || 'toast',
    saveFormat: data.saveFormat || 'markdown',
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    draftUpdatedAt: convertTimestamp(data.draftUpdatedAt),
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
 * GET /api/pages
 * 페이지 목록 조회
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

    const pagesRef = collection(db, 'pages');
    const q = query(pagesRef, where('site', '==', site));
    const querySnapshot = await getDocs(q);
    
    const pages = querySnapshot.docs.map(mapPageData);
    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('[GET /api/pages] 에러:', error.message);
    return NextResponse.json(
      { error: '페이지 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pages
 * 새 페이지 드래프트 생성
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
    const body: { site: Site; payload: PageDraftPayload } = await request.json();

    if (!body.site || (body.site !== 'web' && body.site !== 'docs')) {
      return NextResponse.json(
        { error: '유효한 site가 필요합니다 (web 또는 docs).' },
        { status: 400 }
      );
    }

    if (!body.payload?.menuId || !body.payload?.slug) {
      return NextResponse.json(
        { error: 'menuId와 slug는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    const normalizedLabels = normalizeLocalizedField(body.payload.labels);
    const normalizedContent = normalizeLocalizedField(body.payload.content);
    const EMPTY_LOCALIZED: LocalizedField = { ko: '', en: '' };
    const now = Timestamp.fromDate(new Date());

    // 페이지 생성
    const pagesRef = collection(db, 'pages');
    const docRef = await addDoc(pagesRef, removeUndefinedFields({
      site: body.site,
      menuId: body.payload.menuId,
      slug: body.payload.slug,
      labelsLive: EMPTY_LOCALIZED,
      contentLive: EMPTY_LOCALIZED,
      labelsDraft: normalizedLabels,
      contentDraft: normalizedContent,
      editorType: body.payload.editorType || 'toast',
      saveFormat: body.payload.saveFormat || 'markdown',
      createdAt: now,
      updatedAt: null,
      draftUpdatedAt: now,
      createdBy: adminId,
      updatedBy: adminId,
    }));

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('[POST /api/pages] 에러:', error.message);
    
    if (error.message.includes('인증')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '페이지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

