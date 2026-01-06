import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Page, PageDraftPayload, LocalizedField } from '@/lib/admin/types';

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
 * GET /api/pages/[id]
 * 페이지 단일 조회
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
    const pageRef = doc(db, 'pages', id);
    const pageSnap = await getDoc(pageRef);

    if (!pageSnap.exists()) {
      return NextResponse.json(
        { error: '페이지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const page = mapPageData(pageSnap);
    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('[GET /api/pages/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: '페이지 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pages/[id]
 * 페이지 드래프트 업데이트 또는 발행
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

    // 페이지 존재 여부 확인
    const pageRef = doc(db, 'pages', id);
    const pageSnap = await getDoc(pageRef);

    if (!pageSnap.exists()) {
      return NextResponse.json(
        { error: '페이지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 요청 본문 파싱
    const body: { action: 'draft' | 'publish'; payload: PageDraftPayload } = await request.json();

    if (!body.action || (body.action !== 'draft' && body.action !== 'publish')) {
      return NextResponse.json(
        { error: 'action은 "draft" 또는 "publish"여야 합니다.' },
        { status: 400 }
      );
    }

    const normalizedLabels = normalizeLocalizedField(body.payload.labels);
    const normalizedContent = normalizeLocalizedField(body.payload.content);
    const now = Timestamp.fromDate(new Date());

    if (body.action === 'draft') {
      // 드래프트 업데이트
      await updateDoc(pageRef, removeUndefinedFields({
        menuId: body.payload.menuId,
        slug: body.payload.slug,
        labelsDraft: normalizedLabels,
        contentDraft: normalizedContent,
        editorType: body.payload.editorType || 'toast',
        saveFormat: body.payload.saveFormat || 'markdown',
        draftUpdatedAt: now,
        updatedBy: adminId,
      }));
    } else {
      // 발행 (라이브로 복사)
      await updateDoc(pageRef, removeUndefinedFields({
        menuId: body.payload.menuId,
        slug: body.payload.slug,
        labelsLive: normalizedLabels,
        contentLive: normalizedContent,
        labelsDraft: normalizedLabels,
        contentDraft: normalizedContent,
        editorType: body.payload.editorType || 'toast',
        saveFormat: body.payload.saveFormat || 'markdown',
        updatedAt: now,
        draftUpdatedAt: now,
        updatedBy: adminId,
      }));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/pages/[id]] 에러:', error.message);
    
    if (error.message.includes('인증')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '페이지 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

