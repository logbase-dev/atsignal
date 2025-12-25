'use client';

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Menu, Site } from './types';
import type { PageType } from '@/lib/admin/types';

// 타임아웃 헬퍼 함수
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

// Admin용: 모든 메뉴 조회 (enabled 무관)
export async function getMenus(site: Site): Promise<Menu[]> {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('[getMenus] 시작 - site:', site);
  }
  
  if (!db) {
    console.error('[getMenus] Firestore가 초기화되지 않았습니다.');
    return [];
  }

  try {
    const menusRef = collection(db, 'menus');
    // orderBy를 제거하고 클라이언트 사이드에서 정렬 (인덱스 불필요)
    const q = query(
      menusRef,
      where('site', '==', site)
    );
    
    const startTime = isDev ? Date.now() : 0;
    const querySnapshot = await withTimeout(getDocs(q), 5000);
    const endTime = isDev ? Date.now() : 0;
    
    if (isDev) {
      console.log(`[getMenus] 쿼리 완료 (${endTime - startTime}ms)`);
    }
    
    const menus = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        pageType: data.pageType || 'dynamic', // 기본값만 설정
        // Firestore Timestamp를 Date로 변환
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Menu;
    });
    
    if (isDev) {
      console.log(`[getMenus] ${menus.length}개의 메뉴 로드됨`);
    }
    
    return menus.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error: any) {
    console.error('[getMenus] 에러:', error.message);
    if (error.message?.includes('timed out')) {
      console.error('Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.');
    }
    return [];
  }
}

/**
 * @deprecated API Route로 대체됨. /api/menus (POST) 사용
 */
export async function createMenu(menu: Omit<Menu, 'id'>): Promise<string> {
  throw new Error('createMenu는 더 이상 사용되지 않습니다. API Route를 사용하세요.');
}

/**
 * @deprecated API Route로 대체됨. /api/menus/[id] (PUT) 사용
 */
export async function updateMenu(id: string, menu: Partial<Menu>): Promise<void> {
  throw new Error('updateMenu는 더 이상 사용되지 않습니다. API Route를 사용하세요.');
}

export async function deleteMenu(id: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다. Firebase 환경 변수를 확인하세요.');
  }

  try {
    // 연결된 페이지 확인 및 삭제
    const pagesRef = collection(db, 'pages');
    const pagesQuery = query(pagesRef, where('menuId', '==', id));
    const pagesSnapshot = await getDocs(pagesQuery);
    
    // 연결된 모든 페이지 삭제
    const deletePagePromises = pagesSnapshot.docs.map((pageDoc) => {
      return withTimeout(deleteDoc(doc(db, 'pages', pageDoc.id)), 3000);
    });
    await Promise.all(deletePagePromises);
    
    // 메뉴 삭제
    const menuRef = doc(db, 'menus', id);
    await withTimeout(deleteDoc(menuRef), 3000);
  } catch (error: any) {
    console.error('Error deleting menu:', error);
    if (error.message?.includes('timed out')) {
      throw new Error('메뉴 삭제가 타임아웃되었습니다. 네트워크 연결을 확인하세요.');
    }
    throw error;
  }
}

