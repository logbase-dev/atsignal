import * as functions from "firebase-functions";

/**
 * Firebase Functions runtime config 혹은 환경변수에서
 * Stibee 연동에 필요한 기본 정보를 불러온다.
 * - 로컬 개발 시 .env / process.env 사용
 * - 배포 환경에서는 `firebase functions:config:set` 값 우선
 */
const runtimeConfig = functions.config?.() ?? {};

export interface StibeeConfig {
  apiKey: string;
  listId: string;
  apiBaseUrl: string;
  subscribersCollection: string;
}

/**
 * Stibee API 호출에 필요한 핵심 설정 값 모음.
 */
export const stibeeConfig: StibeeConfig = {
  apiKey:
    process.env.STIBEE_API_KEY ?? runtimeConfig.stibee?.api_key ?? "",
  listId:
    process.env.STIBEE_LIST_ID ?? runtimeConfig.stibee?.list_id ?? "",
  apiBaseUrl:
    process.env.STIBEE_API_BASE_URL ??
    runtimeConfig.stibee?.api_base_url ??
    "https://api.stibee.com/v2",
  subscribersCollection:
    process.env.SUBSCRIBERS_COLLECTION ?? "subscribers",
};

/**
 * 필수 설정이 누락된 경우 함수를 즉시 종료시켜
 * 잘못된 구성으로 API를 호출하는 상황을 방지한다.
 */
export const requireStibeeConfig = (): void => {
  if (!stibeeConfig.apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "STIBEE_API_KEY is not configured."
    );
  }

  if (!stibeeConfig.listId) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "STIBEE_LIST_ID is not configured."
    );
  }
};

