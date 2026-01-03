import { firestore as db } from "../../firebase";
import type { SalesInquiry } from "./types";
import { COLLECTIONS } from "./types";

export async function getSalesInquiries(options?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'contacted' | 'completed' | 'cancelled';
  search?: string;
}): Promise<{ salesInquiries: SalesInquiry[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  let query = db.collection(COLLECTIONS.SALES_INQUIRIES).orderBy('createdAt', 'desc');

  // 상태 필터
  if (options?.status) {
    query = query.where('status', '==', options.status);
  }

  // 검색 (이름, 회사명, 이메일)
  if (options?.search) {
    const searchTerm = options.search.toLowerCase();
    // Firestore는 부분 문자열 검색을 직접 지원하지 않으므로,
    // 모든 데이터를 가져와서 클라이언트에서 필터링
    const allDocs = await query.get();
    const filteredDocs = allDocs.docs.filter(doc => {
      const data = doc.data() as SalesInquiry;
      return (
        data.name?.toLowerCase().includes(searchTerm) ||
        data.company?.toLowerCase().includes(searchTerm) ||
        data.email?.toLowerCase().includes(searchTerm)
      );
    });

    const total = filteredDocs.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedDocs = filteredDocs.slice(offset, offset + limit);

    const salesInquiries = paginatedDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      contactedAt: doc.data().contactedAt?.toDate(),
    })) as SalesInquiry[];

    return { salesInquiries, total, page, limit, totalPages };
  }

  // 검색이 없는 경우 일반적인 페이지네이션
  const countQuery = options?.status 
    ? db.collection(COLLECTIONS.SALES_INQUIRIES).where('status', '==', options.status)
    : db.collection(COLLECTIONS.SALES_INQUIRIES);
  
  const [snapshot, countSnapshot] = await Promise.all([
    query.limit(limit).offset(offset).get(),
    countQuery.get()
  ]);

  const total = countSnapshot.size;
  const totalPages = Math.ceil(total / limit);

  const salesInquiries = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    contactedAt: doc.data().contactedAt?.toDate(),
  })) as SalesInquiry[];

  return { salesInquiries, total, page, limit, totalPages };
}

export async function getSalesInquiryById(id: string): Promise<SalesInquiry | null> {
  const doc = await db.collection(COLLECTIONS.SALES_INQUIRIES).doc(id).get();
  
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
  } as SalesInquiry;
}

export async function createSalesInquiry(salesInquiry: Omit<SalesInquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date();
  const docRef = await db.collection(COLLECTIONS.SALES_INQUIRIES).add({
    ...salesInquiry,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateSalesInquiry(id: string, updates: Partial<SalesInquiry>): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };

  // Date 객체들을 Firestore Timestamp로 변환
  if (updateData.contactedAt) {
    updateData.contactedAt = updateData.contactedAt;
  }

  await db.collection(COLLECTIONS.SALES_INQUIRIES).doc(id).update(updateData);
}

export async function deleteSalesInquiry(id: string): Promise<void> {
  await db.collection(COLLECTIONS.SALES_INQUIRIES).doc(id).delete();
}