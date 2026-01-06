'use client';

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { LocalizedField, Page, Site } from './types';

function getDb() {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다. Firebase 환경 변수를 확인하세요.');
  }
  return db;
}

const EMPTY_LOCALIZED: LocalizedField = { ko: '', en: '' };

function normalizeLocalizedField(field?: { ko?: string; en?: string }): LocalizedField {
  if (!field) {
    return { ...EMPTY_LOCALIZED };
  }
  return {
    ko: field.ko ?? '',
    ...(field.en ? { en: field.en } : {}),
  };
}

function normalizeTimestamp(value: any) {
  return value?.toDate?.() || value || undefined;
}

function mapPageData(snapshot: any): Page {
  const data = snapshot.data();
  const labelsLive = normalizeLocalizedField(data.labelsLive ?? data.labels);
  const contentLive = normalizeLocalizedField(data.contentLive ?? data.content);
  const labelsDraft = data.labelsDraft ? normalizeLocalizedField(data.labelsDraft) : undefined;
  const contentDraft = data.contentDraft ? normalizeLocalizedField(data.contentDraft) : undefined;

  return {
    id: snapshot.id,
    site: data.site,
    menuId: data.menuId,
    slug: data.slug,
    labelsLive,
    contentLive,
    labelsDraft,
    contentDraft,
    editorType: data.editorType || 'toast',
    saveFormat: data.saveFormat || 'markdown',
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    draftUpdatedAt: normalizeTimestamp(data.draftUpdatedAt),
  };
}

export async function getPages(site: Site): Promise<Page[]> {
  const database = getDb();
  const pagesRef = collection(database, 'pages');
  const q = query(pagesRef, where('site', '==', site));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(mapPageData);
}

export async function getPageById(id: string): Promise<Page | null> {
  const database = getDb();
  const pageRef = doc(database, 'pages', id);
  const pageSnap = await getDoc(pageRef);

  if (!pageSnap.exists()) {
    return null;
  }

  return mapPageData(pageSnap);
}

export interface PageDraftPayload {
  menuId: string;
  slug: string;
  labels: LocalizedField;
  content: LocalizedField;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
}

/**
 * @deprecated API Route로 대체됨. /api/pages (POST), /api/pages/[id] (PUT) 사용
 */
export async function savePageDraft(
  site: Site,
  payload: PageDraftPayload,
  pageId?: string,
): Promise<string> {
  throw new Error('savePageDraft는 더 이상 사용되지 않습니다. API Route를 사용하세요.');
}

/**
 * @deprecated API Route로 대체됨. /api/pages/[id] (PUT with action: "publish") 사용
 */
export async function publishPage(
  pageId: string,
  payload: PageDraftPayload,
): Promise<void> {
  throw new Error('publishPage는 더 이상 사용되지 않습니다. API Route를 사용하세요.');
}

export async function getPagesByMenuId(menuId: string): Promise<Page[]> {
  const database = getDb();
  const pagesRef = collection(database, 'pages');
  const q = query(pagesRef, where('menuId', '==', menuId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(mapPageData);
}

/**
 * 페이지 콘텐츠에서 이미지 URL 추출
 */
function extractImageUrls(content: string): string[] {
  const urls: string[] = [];
  
  // HTML img 태그에서 src 추출
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = htmlImgRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  // Markdown 이미지 문법에서 URL 추출
  const markdownImgRegex = /!\[.*?\]\((.*?)\)/gi;
  while ((match = markdownImgRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

/**
 * Firebase Storage URL에서 파일명 추출
 */
function extractFileNameFromUrl(url: string): string | null {
  try {
    // Firebase Storage URL 형식: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/images%2F{size}%2F{fileName}?alt=media&token=...
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/images%2F(?:thumbnail|medium|large|original)%2F(.+?)(?:\?|$)/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Storage에서 이미지 파일 삭제
 */
async function deleteImageFromStorage(fileName: string): Promise<void> {
  if (!storage) {
    console.warn('[Page Delete] Storage가 초기화되지 않았습니다.');
    return;
  }

  const sizes = ['thumbnail', 'medium', 'large', 'original'];
  const deletePromises = sizes.map(async (size) => {
    try {
      const imageRef = ref(storage, `images/${size}/${fileName}`);
      await deleteObject(imageRef);
      console.log(`[Page Delete] 이미지 삭제 완료: images/${size}/${fileName}`);
    } catch (error: any) {
      // 파일이 없으면 무시 (이미 삭제되었거나 존재하지 않음)
      if (error?.code !== 'storage/object-not-found') {
        console.warn(`[Page Delete] 이미지 삭제 실패: images/${size}/${fileName}`, error);
      }
    }
  });

  await Promise.all(deletePromises);
}

export async function deletePage(id: string): Promise<void> {
  const database = getDb();
  
  // 페이지 데이터 가져오기 (이미지 URL 추출을 위해)
  const pageRef = doc(database, 'pages', id);
  const pageSnap = await getDoc(pageRef);
  
  if (pageSnap.exists()) {
    const pageData = pageSnap.data();
    
    // 콘텐츠에서 이미지 URL 추출
    const contentSources = [
      pageData.contentLive?.ko,
      pageData.contentLive?.en,
      pageData.contentDraft?.ko,
      pageData.contentDraft?.en,
    ].filter(Boolean) as string[];
    
    // 모든 콘텐츠에서 이미지 URL 수집
    const allImageUrls = new Set<string>();
    contentSources.forEach((content) => {
      const urls = extractImageUrls(content);
      urls.forEach((url) => allImageUrls.add(url));
    });
    
    // 각 이미지 URL에서 파일명 추출하여 삭제
    const deleteImagePromises = Array.from(allImageUrls).map(async (url) => {
      const fileName = extractFileNameFromUrl(url);
      if (fileName) {
        await deleteImageFromStorage(fileName);
      }
    });
    
    // 이미지 삭제 (실패해도 페이지 삭제는 계속 진행)
    try {
      await Promise.all(deleteImagePromises);
    } catch (error) {
      console.error('[Page Delete] 이미지 삭제 중 오류 발생:', error);
      // 이미지 삭제 실패해도 페이지 삭제는 계속 진행
    }
  }
  
  // Firestore에서 페이지 삭제
  await deleteDoc(pageRef);
}

