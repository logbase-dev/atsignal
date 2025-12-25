import { collection, addDoc, doc, query, where, orderBy, getDocs, Timestamp, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdminLoginLog } from './types';

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

// Firestore 데이터를 AdminLoginLog 객체로 변환
function mapLoginLogData(doc: any): AdminLoginLog {
  const data = doc.data();
  return {
    id: doc.id,
    adminId: data.adminId || '',
    username: data.username || '',
    ipAddress: data.ipAddress || undefined,
    userAgent: data.userAgent || undefined,
    success: data.success !== undefined ? data.success : false,
    failureReason: data.failureReason || undefined,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
  };
}

export interface CreateLoginLogData {
  adminId?: string;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

export interface LoginLogFilters {
  success?: boolean; // 성공/실패 필터
  startDate?: Date; // 시작 날짜
  endDate?: Date; // 종료 날짜
  limit?: number; // 페이지당 항목 수 (기본값: 50)
  lastDoc?: QueryDocumentSnapshot; // 페이지네이션용 마지막 문서
}

export interface LoginLogResult {
  logs: AdminLoginLog[];
  lastDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
}

/**
 * 접속 기록을 생성합니다.
 */
export async function createLoginLog(data: CreateLoginLogData): Promise<string> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  try {
    const logData = removeUndefinedFields({
      adminId: data.adminId || '',
      username: data.username.toLowerCase(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success,
      failureReason: data.failureReason,
      createdAt: Timestamp.fromDate(new Date()),
    });

    const docRef = await addDoc(collection(db, 'adminLoginLogs'), logData);
    return docRef.id;
  } catch (error: any) {
    console.error('[createLoginLog] 에러:', error.message);
    throw error;
  }
}

/**
 * 관리자 ID로 접속 기록을 조회합니다.
 */
export async function getLoginLogsByAdminId(
  adminId: string,
  filters?: LoginLogFilters
): Promise<LoginLogResult> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  try {
    const logsRef = collection(db, 'adminLoginLogs');
    let q = query(logsRef, where('adminId', '==', adminId), orderBy('createdAt', 'desc'));

    // 성공/실패 필터 적용
    if (filters?.success !== undefined) {
      q = query(q, where('success', '==', filters.success), orderBy('createdAt', 'desc'));
    }

    // 날짜 필터 적용
    if (filters?.startDate) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // 페이지네이션
    const pageLimit = filters?.limit || 50;
    if (filters?.lastDoc) {
      q = query(q, startAfter(filters.lastDoc), limit(pageLimit + 1));
    } else {
      q = query(q, limit(pageLimit + 1));
    }

    const querySnapshot = await withTimeout(getDocs(q), 5000);
    const docs = querySnapshot.docs;
    
    // hasMore 확인 (limit + 1개를 가져와서 마지막 항목이 있으면 hasMore = true)
    const hasMore = docs.length > pageLimit;
    const logs = (hasMore ? docs.slice(0, pageLimit) : docs).map(mapLoginLogData);
    const lastDoc = hasMore ? docs[pageLimit - 1] : undefined;

    return {
      logs,
      lastDoc,
      hasMore,
    };
  } catch (error: any) {
    console.error('[getLoginLogsByAdminId] 에러:', error);
    console.error('[getLoginLogsByAdminId] 에러 메시지:', error.message);
    console.error('[getLoginLogsByAdminId] 에러 스택:', error.stack);
    throw error;
  }
}

/**
 * 아이디로 접속 기록을 조회합니다.
 */
export async function getLoginLogsByUsername(
  username: string,
  filters?: LoginLogFilters
): Promise<LoginLogResult> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  try {
    const logsRef = collection(db, 'adminLoginLogs');
    let q = query(logsRef, where('username', '==', username.toLowerCase()), orderBy('createdAt', 'desc'));

    // 성공/실패 필터 적용
    if (filters?.success !== undefined) {
      q = query(q, where('success', '==', filters.success), orderBy('createdAt', 'desc'));
    }

    // 날짜 필터 적용
    if (filters?.startDate) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // 페이지네이션
    const pageLimit = filters?.limit || 50;
    if (filters?.lastDoc) {
      q = query(q, startAfter(filters.lastDoc), limit(pageLimit + 1));
    } else {
      q = query(q, limit(pageLimit + 1));
    }

    const querySnapshot = await withTimeout(getDocs(q), 5000);
    const docs = querySnapshot.docs;
    
    const hasMore = docs.length > pageLimit;
    const logs = (hasMore ? docs.slice(0, pageLimit) : docs).map(mapLoginLogData);
    const lastDoc = hasMore ? docs[pageLimit - 1] : undefined;

    return {
      logs,
      lastDoc,
      hasMore,
    };
  } catch (error: any) {
    console.error('[getLoginLogsByUsername] 에러:', error.message);
    throw error;
  }
}

