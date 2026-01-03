import { firestore as db } from "../../firebase";
import type { DemoRequest } from "./types";
import { COLLECTIONS } from "./types";

export interface GetDemoRequestsOptions {
  page?: number;
  limit?: number;
  status?: 'pending' | 'contacted' | 'completed' | 'cancelled';
  search?: string;
}

export interface GetDemoRequestsResult {
  demoRequests: DemoRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getDemoRequests(options: GetDemoRequestsOptions = {}): Promise<GetDemoRequestsResult> {
  const { page = 1, limit = 20, status, search } = options;
  const offset = (page - 1) * limit;

  let query = db.collection(COLLECTIONS.DEMO_REQUESTS).orderBy('createdAt', 'desc');

  // 상태 필터
  if (status) {
    query = query.where('status', '==', status);
  }

  // 검색 필터 (이름, 회사명, 이메일)
  if (search) {
    // Firestore는 full-text search를 지원하지 않으므로 클라이언트 사이드에서 필터링
    // 실제 프로덕션에서는 Algolia나 Elasticsearch 등을 사용하는 것이 좋습니다.
  }

  const snapshot = await query.get();
  let allDemoRequests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    contactedAt: doc.data().contactedAt?.toDate(),
  })) as DemoRequest[];

  // 클라이언트 사이드 검색 필터링
  if (search) {
    const searchLower = search.toLowerCase();
    allDemoRequests = allDemoRequests.filter(request =>
      request.name.toLowerCase().includes(searchLower) ||
      request.company.toLowerCase().includes(searchLower) ||
      request.email.toLowerCase().includes(searchLower)
    );
  }

  const total = allDemoRequests.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedRequests = allDemoRequests.slice(offset, offset + limit);

  return {
    demoRequests: paginatedRequests,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getDemoRequestById(id: string): Promise<DemoRequest | null> {
  const doc = await db.collection(COLLECTIONS.DEMO_REQUESTS).doc(id).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    contactedAt: data.contactedAt?.toDate(),
  } as DemoRequest;
}

export async function createDemoRequest(demoRequest: Omit<DemoRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date();
  const docRef = await db.collection(COLLECTIONS.DEMO_REQUESTS).add({
    ...demoRequest,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateDemoRequest(id: string, updates: Partial<DemoRequest>): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };

  // Date 객체들을 Firestore Timestamp로 변환
  if (updateData.contactedAt) {
    updateData.contactedAt = updateData.contactedAt;
  }

  await db.collection(COLLECTIONS.DEMO_REQUESTS).doc(id).update(updateData);
}

export async function deleteDemoRequest(id: string): Promise<void> {
  await db.collection(COLLECTIONS.DEMO_REQUESTS).doc(id).delete();
}