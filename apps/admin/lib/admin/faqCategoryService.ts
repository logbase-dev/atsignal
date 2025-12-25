'use client';

import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs, getDoc, Timestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FAQCategory, LocalizedField } from './types';

// 타임아웃 헬퍼 함수
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
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

// 카테고리 목록 조회
export async function getFAQCategories(): Promise<FAQCategory[]> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다. Firebase 환경 변수를 확인하세요.');
    return [];
  }

  try {
    const categoriesRef = collection(db, 'faqCategories');
    
    // order 기준으로 정렬
    let q;
    try {
      q = query(categoriesRef, orderBy('order', 'asc'));
    } catch (error) {
      console.warn('orderBy failed, fetching without order:', error);
      q = query(categoriesRef);
    }
    
    const querySnapshot = await withTimeout(getDocs(q), 5000);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      const category: FAQCategory = {
        id: doc.id,
        name: normalizeLocalizedField(data.name),
        description: data.description ? normalizeLocalizedField(data.description) : undefined,
        order: Number(data.order ?? 0),
        enabled: {
          ko: Boolean(data.enabled?.ko ?? true),
          en: Boolean(data.enabled?.en ?? true),
        },
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
      return category;
    });
  } catch (error: any) {
    console.error('Error fetching FAQ categories:', error);
    
    if (error.message?.includes('timed out')) {
      console.error('Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.');
    }
    
    return [];
  }
}

// 카테고리 단건 조회
export async function getFAQCategoryById(id: string): Promise<FAQCategory | null> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return null;
  }

  try {
    const categoryRef = doc(db, 'faqCategories', id);
    const categorySnap = await withTimeout(getDoc(categoryRef), 5000);
    
    if (!categorySnap.exists()) {
      return null;
    }
    
    const data = categorySnap.data() as Record<string, any>;
    const category: FAQCategory = {
      id: categorySnap.id,
      name: normalizeLocalizedField(data.name),
      description: data.description ? normalizeLocalizedField(data.description) : undefined,
      order: Number(data.order ?? 0),
      enabled: {
        ko: Boolean(data.enabled?.ko ?? true),
        en: Boolean(data.enabled?.en ?? true),
      },
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
    return category;
  } catch (error) {
    console.error('Error fetching FAQ category:', error);
    return null;
  }
}

/**
 * @deprecated API Route로 대체됨. /api/faq-categories (POST) 사용
 */
export async function createFAQCategory(category: Omit<FAQCategory, 'id'>): Promise<string> {
  throw new Error('createFAQCategory는 더 이상 사용되지 않습니다. API Route를 사용하세요.');
}

/**
 * @deprecated API Route로 대체됨. /api/faq-categories/[id] (PUT) 사용
 */
export async function updateFAQCategory(id: string, category: Partial<FAQCategory>): Promise<void> {
  throw new Error('updateFAQCategory는 더 이상 사용되지 않습니다. API Route를 사용하세요.');
}

// 카테고리 삭제
export async function deleteFAQCategory(id: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const categoryRef = doc(db, 'faqCategories', id);
  await withTimeout(deleteDoc(categoryRef), 5000);
}

// 카테고리 사용 여부 확인 (FAQ에서 사용 중인지)
export async function isCategoryInUse(categoryId: string): Promise<boolean> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return false;
  }

  try {
    const faqsRef = collection(db, 'faqs');
    const q = query(faqsRef, where('categoryId', '==', categoryId));
    const querySnapshot = await withTimeout(getDocs(q), 5000);
    
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking if category is in use:', error);
    return false;
  }
}

