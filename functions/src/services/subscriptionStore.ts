import * as functions from "firebase-functions";
import { firestore } from "../firebase";
import { FieldValue } from "firebase-admin/firestore"; // ← 추가
import { stibeeConfig } from "../config/stibee";
import type {
  SubscribeRequestPayload,
  SubscriberRecord,
  SubscriptionStatus,
} from "../types/subscriber";
type SubscriberDocRef = FirebaseFirestore.DocumentReference;

/**
 * 기본적인 이메일/휴대폰 검증을 위해 사용하는 정규식.
 * 서비스 정책에 따라 세부 규칙을 확장할 수 있다.
 */
const EMAIL_REGEX =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_REGEX =
  /^010-?\d{4}-?\d{4}$/;

export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();

export const normalizePhone = (value: string): string =>
  value.replace(/[^\d]/g, "");

/**
 * HTTP 요청 본문을 검증하고 유효한 구독 요청으로 변환한다.
 */
export const parseSubscribeRequest = (
  body: any
): SubscribeRequestPayload => {
  if (!body || typeof body !== "object") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "요청 본문이 올바르지 않습니다."
    );
  }

  const { name, company, email, phone, privacyConsent } =
    body;

  if (typeof name !== "string" || name.trim().length < 2) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "성함을 정확히 입력해 주세요."
    );
  }

  if (
    typeof company !== "string" ||
    company.trim().length < 2
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "소속/회사명을 정확히 입력해 주세요."
    );
  }

  if (
    typeof email !== "string" ||
    !EMAIL_REGEX.test(email)
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "이메일 형식이 올바르지 않습니다."
    );
  }

  if (
    typeof phone !== "string" ||
    !PHONE_REGEX.test(phone)
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "휴대폰 번호 형식이 올바르지 않습니다."
    );
  }

  if (privacyConsent !== true) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "개인정보 처리방침에 동의해야 합니다."
    );
  }

  return {
    name: name.trim(),
    company: company.trim(),
    email: normalizeEmail(email),
    phone,
    privacyConsent: true,
  };
};

/**
 * 구독 요청을 Firestore에 `pending` 상태로 기록한다.
 * Stibee 동기화 결과는 이후 업데이트 단계에서 덮어쓴다.
 */
export const createPendingSubscription = async (
  payload: SubscribeRequestPayload
): Promise<{
  id: string;
  ref: SubscriberDocRef;
}> => {
  const docRef = firestore
    .collection(stibeeConfig.subscribersCollection)
    .doc();

  const now = FieldValue.serverTimestamp(); // ← 수정: admin.firestore.FieldValue → FieldValue

  await docRef.set({
    ...payload,
    emailNormalized: payload.email,
    phoneNormalized: normalizePhone(payload.phone),
    status: "pending",
    stibee: {
      listId: stibeeConfig.listId,
      subscriberId: null,
      lastSyncedAt: null,
      lastResult: null,
    },
    consent: {
      agreedAt: now as FirebaseFirestore.Timestamp | null,
      source: "website:newsletter",
    },
    createdAt: now,
    updatedAt: now,
  } as SubscriberRecord);

  return { id: docRef.id, ref: docRef };
};

/**
 * 공통적인 상태 업데이트 로직. 추가 필드를 함께 변경할 때 재사용한다.
 */
export const updateSubscriptionStatus = async (
  docRef: SubscriberDocRef,
  status: SubscriptionStatus,
  data: Partial<SubscriberRecord>
): Promise<void> => {
  await docRef.update({
    status,
    ...data,
    updatedAt: FieldValue.serverTimestamp(), // ← 수정
  });
};

/**
 * Stibee 동기화 성공 시 호출되어 `subscribed` 상태로 전환한다.
 */
export const markSubscriptionSynced = async (
  docRef: SubscriberDocRef,
  options: {
    subscriberId?: string | null;
    statusCode: number;
    message?: string;
  }
): Promise<void> => {
  await updateSubscriptionStatus(docRef, "subscribed", {
    stibee: {
      listId: stibeeConfig.listId,
      subscriberId: options.subscriberId ?? null,
      lastSyncedAt: FieldValue.serverTimestamp(), // ← 수정
      lastResult: {
        code: options.statusCode,
        message: options.message ?? "OK",
      },
    },
  } as Partial<SubscriberRecord>);
};

/**
 * 외부 API 실패 등의 사유를 Firestore에 기록한다.
 * 필요 시 별도의 재시도 프로세스에서 이 정보를 활용할 수 있다.
 */
export const markSubscriptionFailed = async (
  docRef: SubscriberDocRef,
  options: {
    statusCode: number;
    message: string;
  }
): Promise<void> => {
  await updateSubscriptionStatus(docRef, "error", {
    stibee: {
      listId: stibeeConfig.listId,
      subscriberId: null,
      lastSyncedAt: FieldValue.serverTimestamp(), // ← 수정
      lastResult: {
        code: options.statusCode,
        message: options.message,
      },
    },
  } as Partial<SubscriberRecord>);
};

/**
 * ✅ Stibee 동기화 성공 후 Firestore에 저장 (새 함수)
 * 기존 createPendingSubscription 대신 사용
 */
export const createSyncedSubscription = async (
  payload: SubscribeRequestPayload,
  stibeeResult: {
    subscriberId?: string | null;
    statusCode: number;
    message?: string;
  }
): Promise<{ id: string }> => {
  const docRef = firestore
    .collection(stibeeConfig.subscribersCollection)
    .doc();

  const now = FieldValue.serverTimestamp();

  await docRef.set({
    ...payload,
    emailNormalized: payload.email,
    phoneNormalized: normalizePhone(payload.phone),
    status: "subscribed", // ✅ 바로 subscribed 상태
    stibee: {
      listId: stibeeConfig.listId,
      subscriberId: stibeeResult.subscriberId ?? null,
      lastSyncedAt: now as FirebaseFirestore.Timestamp | null,
      lastResult: {
        code: stibeeResult.statusCode,
        message: stibeeResult.message ?? "OK",
      },
    },
    consent: {
      agreedAt: now as FirebaseFirestore.Timestamp | null,
      source: "website:newsletter",
    },
    createdAt: now,
    updatedAt: now,
  } as SubscriberRecord);

  return { id: docRef.id };
};

