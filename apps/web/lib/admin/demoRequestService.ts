'use client';

import type { DemoRequest } from './types';
import { adminFetch } from './api';

export async function getDemoRequests(options?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'contacted' | 'completed' | 'cancelled';
  search?: string;
}): Promise<{ demoRequests: DemoRequest[]; total: number; page: number; limit: number; totalPages: number }> {
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

  const response = await adminFetch(`demo-requests?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch demo requests: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    demoRequests: (data?.demoRequests || []) as DemoRequest[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function getDemoRequestById(id: string): Promise<DemoRequest | null> {
  const response = await adminFetch(`demo-requests/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch demo request: ${response.statusText}`);
  }

  const data = await response.json();
  return data.demoRequest as DemoRequest;
}

export async function updateDemoRequest(id: string, updates: Partial<DemoRequest>): Promise<void> {
  const response = await adminFetch(`demo-requests/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '데모신청 정보 업데이트에 실패했습니다.');
  }
}

export async function deleteDemoRequest(id: string): Promise<void> {
  const response = await adminFetch(`demo-requests/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '데모신청 정보 삭제에 실패했습니다.');
  }
}

export async function createDemoRequest(demoRequest: Omit<DemoRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const response = await adminFetch('demo-requests', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoRequest),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '데모신청 생성에 실패했습니다.');
  }

  const data = await response.json().catch(() => ({}));
  return data.id as string;
}