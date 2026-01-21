import { getStibeeConfig } from './config';
import { StibeeApiError, type NormalizedSubscriber } from './types';
import type { NormalizedEmailHistory, EmailStatistics } from './types';

/**
 * Stibee에서 발송 이력 목록을 가져옵니다.
 * @param offset 조회 시작 위치 (기본값: 0)
 * @param limit 한 번에 가져올 최대 개수 (기본값: 20)
 * @returns 정규화된 발송 이력 배열
 */
export async function getEmailHistory(
  offset: number = 0,
  limit: number = 20
): Promise<NormalizedEmailHistory[]> {
  const config = getStibeeConfig();
  
  const validLimit = Math.min(limit, 100);
  const validOffset = Math.max(offset, 0);
  
  const url = `${config.apiBaseUrl}/emails?offset=${validOffset}&limit=${validLimit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'AccessToken': config.apiKey,
    },
  });

  const rawBody = await response.text();
  let parsedBody: any;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    console.error('Stibee API error (emails):', {
      status: response.status,
      statusText: response.statusText,
      body: rawBody,
    });
    throw new StibeeApiError(response.status, rawBody);
  }

  // Stibee API 응답 형식에 따라 이메일 배열 추출
  let emailsArray: any[] = [];
  
  if (Array.isArray(parsedBody)) {
    emailsArray = parsedBody;
  } else if (parsedBody && typeof parsedBody === 'object') {
    if (Array.isArray(parsedBody.value)) {
      emailsArray = parsedBody.value;
    } else if (Array.isArray(parsedBody.emails)) {
      emailsArray = parsedBody.emails;
    } else if (Array.isArray(parsedBody.data)) {
      emailsArray = parsedBody.data;
    }
  }

  // 각 이메일 데이터 정규화
  const normalizedEmails: NormalizedEmailHistory[] = emailsArray.map((email: any) => {
    return {
      id: email.id || email.emailId || '',
      subject: email.subject || email.title || '',
      sentAt: email.sentAt || email.sentTime || email.createdAt || email.createdTime || '',
      recipientCount: email.recipientCount || email.recipientCount || email.totalRecipients || 0,
      status: email.status || email.state || 'unknown',
      // 통계는 별도 API로 조회
    };
  });

  return normalizedEmails;
}

/**
 * Stibee에서 발송 이력 수를 가져옵니다.
 * @returns 발송 이력 수
 */
export async function getEmailHistoryCount(): Promise<number> {
  const config = getStibeeConfig();
  
  // Stibee API에 count 엔드포인트가 없을 수 있으므로, 큰 limit으로 조회하여 개수 확인
  // 또는 첫 페이지만 조회하여 totalCount가 응답에 포함되어 있는지 확인
  const url = `${config.apiBaseUrl}/emails?offset=0&limit=1`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'AccessToken': config.apiKey,
    },
  });

  const rawBody = await response.text();
  let parsedBody: any;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    throw new StibeeApiError(response.status, rawBody);
  }

  // 응답에 totalCount가 포함되어 있는지 확인
  if (parsedBody && typeof parsedBody === 'object') {
    if (typeof parsedBody.totalCount === 'number') {
      return parsedBody.totalCount;
    }
    if (typeof parsedBody.total === 'number') {
      return parsedBody.total;
    }
    if (typeof parsedBody.count === 'number') {
      return parsedBody.count;
    }
  }

  // totalCount가 없으면 -1 반환 (알 수 없음)
  return -1;
}

/**
 * 특정 이메일의 통계를 가져옵니다.
 * @param emailId 이메일 ID
 * @returns 이메일 통계 정보
 */
export async function getEmailStatistics(emailId: string): Promise<EmailStatistics | null> {
  const config = getStibeeConfig();
  
  const url = `${config.apiBaseUrl}/emails/${emailId}/statistics`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'AccessToken': config.apiKey,
    },
  });

  const rawBody = await response.text();
  let parsedBody: any;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    console.error('Stibee API error (statistics):', {
      status: response.status,
      statusText: response.statusText,
      body: rawBody,
    });
    return null;
  }

  // 통계 데이터 정규화
  const stats = parsedBody || {};
  const sentCount = stats.sentCount || stats.totalSent || stats.recipientCount || 0;
  const openCount = stats.openCount || stats.totalOpened || 0;
  const clickCount = stats.clickCount || stats.totalClicked || 0;
  
  const openRate = sentCount > 0 ? (openCount / sentCount) * 100 : 0;
  const clickRate = sentCount > 0 ? (clickCount / sentCount) * 100 : 0;

  return {
    emailId,
    sentCount,
    openCount,
    clickCount,
    openRate: Math.round(openRate * 100) / 100, // 소수점 2자리
    clickRate: Math.round(clickRate * 100) / 100,
  };
}

/**
 * Stibee에서 구독자 수를 가져옵니다.
 * @param statuses 조회할 구독자 상태 목록 (콤마로 구분, 선택사항)
 * @returns 구독자 수
 */
export async function getSubscriberCount(statuses?: string): Promise<number> {
  const config = getStibeeConfig();
  
  let url = `${config.apiBaseUrl}/lists/${config.listId}/subscribers/count`;
  if (statuses) {
    url += `?statuses=${encodeURIComponent(statuses)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'AccessToken': config.apiKey,
    },
  });

  const rawBody = await response.text();
  let parsedBody: any;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    console.error('Stibee API error (count):', {
      status: response.status,
      statusText: response.statusText,
      body: rawBody,
    });
    throw new StibeeApiError(response.status, rawBody);
  }

  // 응답 형식에 따라 count 추출
  // 일반적으로 { count: 123 } 또는 직접 숫자일 수 있음
  if (typeof parsedBody === 'number') {
    return parsedBody;
  } else if (parsedBody && typeof parsedBody === 'object') {
    return parsedBody.count || parsedBody.total || parsedBody.value || 0;
  }

  return 0;
}

/**
 * Stibee에서 구독자 목록을 가져옵니다.
 * @param offset 조회 시작 위치 (기본값: 0)
 * @param limit 한 번에 가져올 최대 개수 (기본값: 100, 최대: 1000)
 * @returns 정규화된 구독자 배열
 */
export async function getSubscribers(
  offset: number = 0,
  limit: number = 100
): Promise<NormalizedSubscriber[]> {
  const config = getStibeeConfig();
  
  // limit는 최대 1000까지 가능
  const validLimit = Math.min(limit, 1000);
  const validOffset = Math.max(offset, 0);
  
  const url = `${config.apiBaseUrl}/lists/${config.listId}/subscribers?offset=${validOffset}&limit=${validLimit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'AccessToken': config.apiKey,
    },
  });

  const rawBody = await response.text();
  let parsedBody: any;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    console.error('Stibee API error:', {
      status: response.status,
      statusText: response.statusText,
      body: rawBody,
    });
    throw new StibeeApiError(response.status, rawBody);
  }

  // Stibee API 응답 형식에 따라 구독자 배열 추출
  let subscribersArray: any[] = [];
  
  if (Array.isArray(parsedBody)) {
    subscribersArray = parsedBody;
  } else if (parsedBody && typeof parsedBody === 'object') {
    if (Array.isArray(parsedBody.value)) {
      subscribersArray = parsedBody.value;
    } else if (Array.isArray(parsedBody.subscribers)) {
      subscribersArray = parsedBody.subscribers;
    } else if (Array.isArray(parsedBody.data)) {
      subscribersArray = parsedBody.data;
    }
  }

  // 각 구독자 데이터 정규화
  const normalizedSubscribers: NormalizedSubscriber[] = subscribersArray.map((sub: any) => {
    const fields = sub.fields || {};
    
    return {
      email: sub.email || sub.Email || '',
      name: fields.name || fields.Name || sub.name || '',
      company: fields.company || fields.Company || sub.company || '',
      phone: fields.phone || fields.Phone || sub.phone || '',
      status: sub.status || sub.Status || 'unknown',
      // ✅ createdTime을 우선 사용 (Stibee API의 실제 필드명)
      subscribedAt: sub.createdTime || '',
    };
  });

  return normalizedSubscribers;
}