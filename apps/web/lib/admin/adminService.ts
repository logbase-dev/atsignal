'use client';

import type { Admin, AdminLoginLog } from './types';
import { adminFetch } from './api';

export async function getAdmins(params?: { checkUsername?: string }): Promise<{ admins: Admin[]; exists?: boolean }> {
  const qs = new URLSearchParams();
  if (params?.checkUsername) qs.set('checkUsername', params.checkUsername);
  const response = await adminFetch(`admins${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (!response.ok) throw new Error('관리자 목록을 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return { admins: data.admins || [], exists: data.exists };
}

export async function getAdminById(id: string): Promise<Admin> {
  const response = await adminFetch(`admins/${id}`);
  if (!response.ok) throw new Error('관리자 정보를 불러오는데 실패했습니다.');
  const data = await response.json().catch(() => ({}));
  return data.admin as Admin;
}

export async function createAdmin(data: { username?: string; password?: string; name: string; enabled: boolean }): Promise<string> {
  const response = await adminFetch('admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '관리자 생성에 실패했습니다.');
  }
  const result = await response.json().catch(() => ({}));
  return result.id as string;
}

export async function updateAdmin(id: string, data: { password?: string; name: string; enabled: boolean }): Promise<void> {
  const response = await adminFetch(`admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '관리자 수정에 실패했습니다.');
  }
}

export async function toggleAdminEnabled(id: string): Promise<void> {
  const response = await adminFetch(`admins/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '관리자 비활성화에 실패했습니다.');
  }
}

export async function getAdminLoginLogs(adminId: string, filters?: { success?: string; startDate?: string }): Promise<{ logs: AdminLoginLog[]; hasMore?: boolean }> {
  const qs = new URLSearchParams();
  if (filters?.success) qs.set('success', filters.success);
  if (filters?.startDate) qs.set('startDate', filters.startDate);
  const response = await adminFetch(`admins/${adminId}/logs?${qs.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '접속 기록을 불러오는데 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return { logs: data.logs || [], hasMore: data.hasMore };
}
