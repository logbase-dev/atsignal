'use client';

import type { SalesInquiry } from './types';
import { adminFetch } from './api';

export async function getSalesInquiries(options?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'contacted' | 'completed' | 'cancelled';
  search?: string;
}): Promise<{ salesInquiries: SalesInquiry[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  
  if (options?.status) {
    params.append('status', options.status);
  }
  if (options?.search) {
    params.append('search', options.search);
  }

  const response = await adminFetch(`sales-inquiries?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch sales inquiries: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    salesInquiries: (data?.salesInquiries || []) as SalesInquiry[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function getSalesInquiryById(id: string): Promise<SalesInquiry | null> {
  const response = await adminFetch(`sales-inquiries/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch sales inquiry: ${response.statusText}`);
  }

  const data = await response.json();
  return data.salesInquiry as SalesInquiry;
}

export async function updateSalesInquiry(id: string, updates: Partial<SalesInquiry>): Promise<void> {
  const response = await adminFetch(`sales-inquiries/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '구입문의 정보 업데이트에 실패했습니다.');
  }
}

export async function deleteSalesInquiry(id: string): Promise<void> {
  const response = await adminFetch(`sales-inquiries/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '구입문의 정보 삭제에 실패했습니다.');
  }
}

export async function createSalesInquiry(salesInquiry: Omit<SalesInquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const response = await adminFetch('sales-inquiries', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(salesInquiry),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '구입문의 생성에 실패했습니다.');
  }

  const data = await response.json().catch(() => ({}));
  return data.id as string;
}