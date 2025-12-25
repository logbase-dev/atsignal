import type { FieldValue, Timestamp } from "firebase-admin/firestore";

/**
 * Firestore 타임스탬프 필드를 표현할 때 사용되는 공통 타입.
 */
type FirestoreDateValue = Timestamp | FieldValue | null;

/**
 * 클라이언트가 구독을 요청할 때 전달해야 하는 필드 정의.
 */
export interface SubscribeRequestPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  privacyConsent: boolean;
}

/**
 * 구독 워크플로우 진행 단계.
 */
export type SubscriptionStatus = "pending" | "subscribed" | "error";

/**
 * Firestore `subscribers` 문서 구조.
 * - 입력값(원본) + 정규화 필드 + 동기화 상태를 모두 포함한다.
 */
export interface SubscriberRecord extends SubscribeRequestPayload {
  status: SubscriptionStatus;
  phoneNormalized: string;
  emailNormalized: string;
  stibee: {
    listId: string;
    subscriberId?: string | null;
    lastSyncedAt?: FirestoreDateValue;
    lastResult?: {
      code: number;
      message: string;
    } | null;
  };
  consent: {
    agreedAt: FirestoreDateValue;
    source: string;
  };
  createdAt: FirestoreDateValue;
  updatedAt: FirestoreDateValue;
}

