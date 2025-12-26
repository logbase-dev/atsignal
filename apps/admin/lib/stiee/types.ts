/**
 * Stibee API 응답 포맷
 */
export interface StibeeSyncResult<T = unknown> {
    status: number;
    data?: T;
    rawBody: string;
  }
  
  /**
   * Stibee API 호출 실패 시 세부 정보를 함께 전달하기 위한 에러 타입
   */
  export class StibeeApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly body: string
    ) {
      super(`Stibee API Error (${status})`);
    }
  }
  
  /**
   * 구독자 정보 (정규화된 형태)
   */
  export interface NormalizedSubscriber {
    email: string;
    name: string;
    company: string;
    phone: string;
    status: string;
    subscribedAt: string;
  }

/**
 * 발송 이력 정보 (정규화된 형태)
 */
export interface NormalizedEmailHistory {
  id: string;
  subject: string;
  sentAt: string;
  recipientCount: number;
  openRate?: number; // 오픈율 (%)
  clickRate?: number; // 클릭율 (%)
  status?: string;
}

/**
 * 이메일 통계 정보
 */
export interface EmailStatistics {
  emailId: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number; // 오픈율 (%)
  clickRate: number; // 클릭율 (%)
}

