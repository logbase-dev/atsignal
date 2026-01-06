/**
 * 최소한의 메타 정보를 담은 Stibee API 응답 포맷.
 * - `data`는 파싱 결과(JSON)를 담으며, 실패 시 undefined.
 * - `rawBody`는 추후 디버깅을 위해 원본 문자열을 보관한다.
 */
export interface StibeeSyncResult<T = unknown> {
  status: number;
  data?: T;
  rawBody: string;
}

/**
 * Stibee API 호출 실패 시 세부 정보를 함께 전달하기 위한 에러 타입.
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
 * 내부적으로 사용하는 구독자 페이로드 형태.
 * 클라이언트 요청값을 전처리한 결과를 담는다.
 */
export interface InternalSubscriberPayload {
  email: string;
  name: string;
  company: string;
  phoneNormalized: string;
}

