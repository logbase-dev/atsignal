import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가
import { firestore } from "../../firebase";
import type { AdminLoginLog } from "./types";

// 추가: 타임아웃 헬퍼
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value?.toDate instanceof Function) return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

function mapLoginLogData(doc: admin.firestore.DocumentSnapshot): AdminLoginLog {
  const data = doc.data() as any;
  return {
    id: doc.id,
    adminId: data.adminId || "",
    username: data.username || "",
    ipAddress: data.ipAddress || undefined,
    userAgent: data.userAgent || undefined,
    success: data.success ?? false,
    failureReason: data.failureReason || undefined,
    createdAt: convertTimestamp(data.createdAt),
  };
}

export interface LoginLogFilters {
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  lastDoc?: admin.firestore.DocumentSnapshot;
}

export async function createLoginLog(log: {
  adminId?: string;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}): Promise<string> {
  const now = Timestamp.fromDate(new Date()); // ✅ 변경
  const docRef = await firestore.collection("adminLoginLogs").add({
    ...log,
    createdAt: now,
  });
  return docRef.id;
}

export async function getLoginLogsByAdminId(
  adminId: string,
  filters: LoginLogFilters = {}
): Promise<{ logs: AdminLoginLog[]; hasMore: boolean }> {
  let q: admin.firestore.Query = firestore
    .collection("adminLoginLogs")
    .where("adminId", "==", adminId)
    .orderBy("createdAt", "desc");

  if (filters.success !== undefined) {
    q = q.where("success", "==", filters.success);
  }
  if (filters.startDate) {
    q = q.where("createdAt", ">=", Timestamp.fromDate(filters.startDate));
  }
  if (filters.endDate) {
    q = q.where("createdAt", "<=", Timestamp.fromDate(filters.endDate));
  }
  if (filters.lastDoc) {
    q = q.startAfter(filters.lastDoc);
  }
  const pageSize = filters.limit ?? 20;
  q = q.limit(pageSize + 1);

  const snap = await q.get();
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const docsToUse = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    logs: docsToUse.map(mapLoginLogData),
    hasMore,
  };
}

export interface LoginLogResult {
  logs: AdminLoginLog[];
  lastDoc?: admin.firestore.DocumentSnapshot;
  hasMore: boolean;
}

/**
 * 아이디로 접속 기록을 조회합니다.
 */
export async function getLoginLogsByUsername(
  username: string,
  filters?: LoginLogFilters
): Promise<LoginLogResult> {
  try {
    let q: admin.firestore.Query = firestore
      .collection("adminLoginLogs")
      .where("username", "==", username.toLowerCase())
      .orderBy("createdAt", "desc");

    // 성공/실패 필터
    if (filters?.success !== undefined) {
      q = q.where("success", "==", filters.success);
    }

    // 날짜 필터
    if (filters?.startDate) {
      q = q.where("createdAt", ">=", Timestamp.fromDate(filters.startDate));
    }
    if (filters?.endDate) {
      q = q.where("createdAt", "<=", Timestamp.fromDate(filters.endDate));
    }

    // 페이지네이션
    const pageLimit = filters?.limit || 50;
    if (filters?.lastDoc) {
      q = q.startAfter(filters.lastDoc);
    }
    q = q.limit(pageLimit + 1);

    const snap = await withTimeout(q.get(), 5000);
    const docs = snap.docs;

    const hasMore = docs.length > pageLimit;
    const logs = (hasMore ? docs.slice(0, pageLimit) : docs).map(mapLoginLogData);
    const lastDoc = hasMore ? docs[pageLimit - 1] : undefined;

    return { logs, lastDoc, hasMore };
  } catch (error: any) {
    console.error("[getLoginLogsByUsername] 에러:", error.message);
    throw error;
  }
}

