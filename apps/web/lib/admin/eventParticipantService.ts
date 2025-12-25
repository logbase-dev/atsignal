'use client';

import type { EventParticipant } from './types';
import { adminFetch } from './api';

export async function getEventParticipants(options: {
  eventId: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ participants: EventParticipant[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (options?.search) {
    params.append('search', options.search);
  }

  const response = await adminFetch(`event/${options.eventId}/participants?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch event participants: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    participants: (data?.participants || []) as EventParticipant[],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 0,
  };
}

export async function createEventParticipant(participant: Omit<EventParticipant, 'id' | 'createdAt'>): Promise<string> {
  const response = await adminFetch(`event/${participant.eventId}/participants`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: participant.name,
      company: participant.company,
      email: participant.email,
      phone: participant.phone,
      privacyConsent: participant.privacyConsent,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '이벤트 참가 신청에 실패했습니다.');
  }
  const data = await response.json().catch(() => ({}));
  return data.id as string;
}

export async function deleteEventParticipant(eventId: string, participantId: string): Promise<void> {
  const response = await adminFetch(`event/${eventId}/participants/${participantId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || '참가자 정보 삭제에 실패했습니다.');
  }
}

