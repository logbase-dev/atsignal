import * as functions from "firebase-functions"; // ← 추가
import { stibeeConfig, requireStibeeConfig } from "../config/stibee";
import type {
  StibeeSyncResult,
  InternalSubscriberPayload,
} from "./types";
import { StibeeApiError } from "./types";

/**
 * Stibee 구독자 API에 단일 구독자를 추가한다.
 * - 구성된 payload는 `subscribers` 배열로 감싸 전송.
 * - 성공/실패 여부를 StibeeSyncResult 또는 StibeeApiError로 구분한다.
 */
export const syncSubscriber = async (
  payload: InternalSubscriberPayload
): Promise<StibeeSyncResult> => {
  requireStibeeConfig();

  // 디버깅: payload 확인
  functions.logger.info("syncSubscriber payload:", {
    email: payload.email,
    name: payload.name,
    company: payload.company,
    phoneNormalized: payload.phoneNormalized,
  });

  // 이메일 검증
  if (!payload.email || payload.email.trim() === "") {
    throw new Error("Email is required but was empty or undefined");
  }

  const url = `${stibeeConfig.apiBaseUrl}/lists/${stibeeConfig.listId}/subscribers`;

  // Stibee API 실제 형식에 맞게 수정
  const requestBody = {
    subscriber: {
      email: payload.email.trim(),
      status: "subscribed",
      marketingAllowed: true,
      fields: {
        name: payload.name,
        company: payload.company,
        phone: payload.phoneNormalized,
      },
    },
    updateEnabled: false, // ✅ 변경: 이미 구독 중인 경우 업데이트하지 않음
  };

  // 디버깅: 요청 본문 확인
  // functions.logger.info("Stibee API request body:", JSON.stringify(requestBody, null, 2));
  // functions.logger.info("Stibee API URL:", url);
  // functions.logger.info("Stibee API Key (first 10 chars):", stibeeConfig.apiKey?.substring(0, 10));
  // functions.logger.info("Stibee List ID:", stibeeConfig.listId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AccessToken: stibeeConfig.apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const rawBody = await response.text();
  
  // 디버깅: 응답 확인
  // functions.logger.info("Stibee API response status:", response.status);
  // functions.logger.info("Stibee API response body:", rawBody);
  
  let parsedBody: unknown;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    // 에러 응답 상세 로깅
    functions.logger.error("Stibee API error:", {
      status: response.status,
      statusText: response.statusText,
      body: rawBody,
      parsedBody: parsedBody,
    });
    throw new StibeeApiError(response.status, rawBody);
  }

  return {
    status: response.status,
    data: parsedBody,
    rawBody,
  };
};

