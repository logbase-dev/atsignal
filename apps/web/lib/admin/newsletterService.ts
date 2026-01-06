'use client';

import { adminFetch } from './api';

export interface NewsletterSubscriber {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  status?: string;
  subscribedAt?: string;
  [key: string]: any;
}

export interface NewsletterEmailHistory {
  id: string;
  subject: string;
  sentAt: string;
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
  status?: string;
}

export async function getNewsletterSubscribers(params: { offset?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  const response = await adminFetch(`newsletter/subscribers?${qs.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '구독자 목록을 불러오는데 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return { subscribers: (data.subscribers || []) as NewsletterSubscriber[] };
}

export async function getNewsletterSubscribersCount() {
  const response = await adminFetch('newsletter/subscribers?count=true');
  if (!response.ok) return { totalCount: 0 };
  const data = await response.json().catch(() => ({}));
  return { totalCount: Number(data.totalCount || 0) };
}

export async function getNewsletterSendHistory(params: { offset?: number; limit?: number; statistics?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (typeof params.offset === 'number') qs.set('offset', String(params.offset));
  if (typeof params.limit === 'number') qs.set('limit', String(params.limit));
  if (params.statistics) qs.set('statistics', 'true');
  const response = await adminFetch(`newsletter/send-history?${qs.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    // Preserve premium-required messaging (402)
    throw new Error(err.message || err.error || '발송 이력을 불러오는데 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return { emails: (data.emails || []) as NewsletterEmailHistory[] };
}

export async function getNewsletterSendHistoryCount() {
  const response = await adminFetch('newsletter/send-history?count=true');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 402) {
      throw new Error(err.message || '프로 요금제가 필요합니다.');
    }
    return { totalCount: 0 };
  }
  const data = await response.json().catch(() => ({}));
  return { totalCount: Number(data.totalCount || 0) };
}


