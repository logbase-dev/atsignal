'use client';

import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs, getDoc, Timestamp, where, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FAQ, LocalizedField } from './types';

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

// undefined 값을 제거하는 헬퍼 함수 (Firestore는 undefined 값을 허용하지 않음)
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
function mapFAQData(doc: any): FAQ {
  const data = doc.data() as Record<string, any>;
  return {
    id: doc.id,
    question: normalizeLocalizedField(data.question),
    answer: normalizeLocalizedField(data.answer),
    categoryId: data.categoryId && String(data.categoryId).trim() ? String(data.categoryId) : undefined,
    level: Number(data.level ?? 999),
    isTop: Boolean(data.isTop ?? false),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    tags: Array.isArray(data.tags) ? data.tags.filter((tag: any) => typeof tag === 'string') : undefined, // 추가
    editorType: data.editorType || 'toast',
    saveFormat: data.saveFormat || 'markdown',
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    order: data.order !== undefined ? Number(data.order) : undefined,
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

// FAQ 페이지네이션 옵션
export interface FAQFilters {
  categoryId?: string;
  tags?: string[]; // 추가
  search?: string;
  orderBy?: 'level' | 'isTop' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
  limit?: number; // 페이지당 항목 수 (기본값: 20)
  lastDoc?: QueryDocumentSnapshot; // 페이지네이션용 마지막 문서
}

// FAQ 결과 타입
export interface FAQResult {
  faqs: FAQ[];
  lastDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
}

// FAQ 목록 조회 (페이지네이션 미지원 - 하위 호환성을 위해 유지)
export async function getFAQs(options?: {
  categoryId?: string;
  tags?: string[]; // 추가
  search?: string;
  orderBy?: 'level' | 'isTop' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}): Promise<FAQ[]> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다. Firebase 환경 변수를 확인하세요.');
    return [];
  }

  try {
    const faqsRef = collection(db, 'faqs');
    
    // 기본 쿼리 구성
    let q = query(faqsRef);
    
    // 카테고리 필터링
    if (options?.categoryId && options.categoryId !== '__no_category__') {
      q = query(q, where('categoryId', '==', options.categoryId));
    }
    
    // Firestore에서 기본 정렬 (클라이언트 측에서 추가 정렬 필요)
    try {
      // isTop과 level로 정렬 시도 (인덱스가 필요할 수 있음)
      q = query(q, orderBy('isTop', 'desc'), orderBy('level', 'asc'), orderBy('order', 'asc'));
    } catch (error) {
      console.warn('orderBy failed, fetching without order:', error);
      // 인덱스가 없으면 정렬 없이 조회 후 클라이언트에서 정렬
      try {
        q = query(q, orderBy('createdAt', 'desc'));
      } catch {
        // 정렬 없이 조회
      }
    }
    
    const querySnapshot = await withTimeout(getDocs(q), 5000);
    let faqs = querySnapshot.docs.map(mapFAQData);
    
    // 미분류 필터링 (클라이언트 측)
    if (options?.categoryId === '__no_category__') {
      faqs = faqs.filter((faq) => !faq.categoryId || faq.categoryId.trim() === '');
    }
    
    // 해시태그 필터링 (클라이언트 측) - 추가
    if (options?.tags && options.tags.length > 0) {
      faqs = faqs.filter((faq) => {
        if (!faq.tags || faq.tags.length === 0) return false;
        // 선택한 태그 중 하나라도 FAQ의 tags에 포함되어 있으면 표시
        return options.tags!.some((tag) => faq.tags!.includes(tag));
      });
    }
    
    // 검색 필터링 (클라이언트 측)
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      faqs = faqs.filter((faq) => {
        const questionKo = faq.question.ko?.toLowerCase() || '';
        const questionEn = faq.question.en?.toLowerCase() || '';
        const answerKo = faq.answer.ko?.toLowerCase() || '';
        const answerEn = faq.answer.en?.toLowerCase() || '';
        
        return (
          questionKo.includes(searchLower) ||
          questionEn.includes(searchLower) ||
          answerKo.includes(searchLower) ||
          answerEn.includes(searchLower)
        );
      });
    }
    
    // 클라이언트 측 정렬 (Firestore 정렬이 실패한 경우 또는 추가 정렬 필요 시)
    faqs.sort((a, b) => {
      // 1. isTop 우선 (true가 먼저)
      if (a.isTop !== b.isTop) {
        return a.isTop ? -1 : 1;
      }
      
      // 2. level 오름차순
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      
      // 3. order 오름차순 (둘 다 있으면)
      if (a.order !== undefined && b.order !== undefined) {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
      }
      
      // 4. createdAt 최신순
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      
      return 0;
    });
    
    return faqs;
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    
    if (error.message?.includes('timed out')) {
      console.error('Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.');
    }
    
    return [];
  }
}

// FAQ 목록 조회 (페이지네이션 지원)
export async function getFAQsWithPagination(filters?: FAQFilters): Promise<FAQResult> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다. Firebase 환경 변수를 확인하세요.');
    return { faqs: [], hasMore: false };
  }

  try {
    const faqsRef = collection(db, 'faqs');
    
    // 모든 제약 조건을 배열로 수집 (where 절 먼저, 그 다음 orderBy, 마지막에 limit/startAfter)
    const whereConstraints: any[] = [];
    const orderByConstraints: any[] = [];
    const paginationConstraints: any[] = [];
    
    // 카테고리 필터링
    if (filters?.categoryId && filters.categoryId !== '__no_category__') {
      whereConstraints.push(where('categoryId', '==', filters.categoryId));
    }
    
    // 태그 필터링 (서버 측) - array-contains-any 사용
    if (filters?.tags && filters.tags.length > 0) {
      // Firestore의 array-contains-any는 최대 10개까지만 지원
      const tagsToQuery = filters.tags.slice(0, 10);
      whereConstraints.push(where('tags', 'array-contains-any', tagsToQuery));
    }
    
    // Firestore에서 기본 정렬 시도
    try {
      // isTop과 level로 정렬 시도 (인덱스가 필요할 수 있음)
      orderByConstraints.push(
        orderBy('isTop', 'desc'),
        orderBy('level', 'asc'),
        orderBy('order', 'asc')
      );
    } catch (error) {
      console.warn('orderBy failed, trying alternative order:', error);
      // 인덱스가 없으면 다른 정렬 시도
      try {
        orderByConstraints.push(orderBy('createdAt', 'desc'));
      } catch {
        // 정렬 없이 조회
        console.warn('All orderBy attempts failed, fetching without order');
      }
    }
    
    // 페이지네이션 적용
    const pageLimit = filters?.limit || 20;
    if (filters?.lastDoc) {
      paginationConstraints.push(startAfter(filters.lastDoc));
    }
    paginationConstraints.push(limit(pageLimit + 1));
    
    // 모든 제약 조건을 한 번에 적용 (where -> orderBy -> pagination 순서)
    const q = query(
      faqsRef,
      ...whereConstraints,
      ...orderByConstraints,
      ...paginationConstraints
    );
    
    const querySnapshot = await withTimeout(getDocs(q), 5000);
    const docs = querySnapshot.docs;
    
    // hasMore 확인 (limit + 1개를 가져와서 마지막 항목이 있으면 hasMore = true)
    const hasMore = docs.length > pageLimit;
    const docsToProcess = hasMore ? docs.slice(0, pageLimit) : docs;
    
    let faqs = docsToProcess.map(mapFAQData);
    
    // 미분류 필터링 (클라이언트 측)
    if (filters?.categoryId === '__no_category__') {
      faqs = faqs.filter((faq) => !faq.categoryId || faq.categoryId.trim() === '');
    }
    
    // 추가 태그 필터링 (클라이언트 측) - array-contains-any는 OR 조건이므로 AND 조건이 필요할 수 있음
    if (filters?.tags && filters.tags.length > 0) {
      faqs = faqs.filter((faq) => {
        if (!faq.tags || faq.tags.length === 0) return false;
        // 선택한 태그 중 하나라도 FAQ의 tags에 포함되어 있으면 표시
        return filters.tags!.some((tag) => faq.tags!.includes(tag));
      });
    }
    
    // 검색 필터링 (클라이언트 측 - Firestore는 기본 텍스트 검색 미지원)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      faqs = faqs.filter((faq) => {
        const questionKo = faq.question.ko?.toLowerCase() || '';
        const questionEn = faq.question.en?.toLowerCase() || '';
        const answerKo = faq.answer.ko?.toLowerCase() || '';
        const answerEn = faq.answer.en?.toLowerCase() || '';
        
        return (
          questionKo.includes(searchLower) ||
          questionEn.includes(searchLower) ||
          answerKo.includes(searchLower) ||
          answerEn.includes(searchLower)
        );
      });
    }
    
    // 클라이언트 측 정렬 (Firestore 정렬이 실패한 경우 또는 추가 정렬 필요 시)
    faqs.sort((a, b) => {
      // 1. isTop 우선 (true가 먼저)
      if (a.isTop !== b.isTop) {
        return a.isTop ? -1 : 1;
      }
      
      // 2. level 오름차순
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      
      // 3. order 오름차순 (둘 다 있으면)
      if (a.order !== undefined && b.order !== undefined) {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
      }
      
      // 4. createdAt 최신순
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      
      return 0;
    });
    
    // lastDoc 계산 (페이지네이션용)
    const lastDoc = hasMore && docs.length > 0 ? docs[pageLimit - 1] : undefined;
    
    return {
      faqs,
      lastDoc,
      hasMore,
    };
  } catch (error: any) {
    console.error('Error fetching FAQs with pagination:', error);
    
    if (error.message?.includes('timed out')) {
      console.error('Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.');
    }
    
    return { faqs: [], hasMore: false };
  }
}

// FAQ 단건 조회
export async function getFAQById(id: string): Promise<FAQ | null> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return null;
  }

  try {
    const faqRef = doc(db, 'faqs', id);
    const faqSnap = await withTimeout(getDoc(faqRef), 5000);
    
    if (!faqSnap.exists()) {
      return null;
    }
    
    return mapFAQData(faqSnap);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return null;
  }
}

// FAQ 생성 (API Route 호출)
export async function createFAQ(faq: Omit<FAQ, 'id' | 'createdBy' | 'updatedBy'>): Promise<string> {
  try {
    const response = await fetch('/api/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(faq),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'FAQ 생성에 실패했습니다.');
    }

    const result = await response.json();
    return result.id;
  } catch (error: any) {
    console.error('Failed to create FAQ:', error);
    throw error;
  }
}

// FAQ 수정 (API Route 호출)
export async function updateFAQ(id: string, faq: Partial<Omit<FAQ, 'id' | 'createdBy' | 'updatedBy'>>): Promise<void> {
  try {
    const response = await fetch(`/api/faqs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(faq),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'FAQ 수정에 실패했습니다.');
    }
  } catch (error: any) {
    console.error('Failed to update FAQ:', error);
    throw error;
  }
}

// FAQ 삭제
export async function deleteFAQ(id: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const faqRef = doc(db, 'faqs', id);
  await withTimeout(deleteDoc(faqRef), 5000);
}

// FAQ 순서 변경
export async function updateFAQOrder(id: string, order: number): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const faqRef = doc(db, 'faqs', id);
  await withTimeout(updateDoc(faqRef, {
    order,
    updatedAt: new Date(),
  }), 5000);
}

// 모든 해시태그 목록 조회 (자동완성용)
export async function getAllTags(): Promise<string[]> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return [];
  }

  try {
    const faqsRef = collection(db, 'faqs');
    const querySnapshot = await withTimeout(getDocs(faqsRef), 5000);
    
    const allTags = new Set<string>();
    
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          if (typeof tag === 'string' && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
    });
    
    // 알파벳 순으로 정렬하여 반환
    return Array.from(allTags).sort();
  } catch (error: any) {
    console.error('Error fetching all tags:', error);
    return [];
  }
}

