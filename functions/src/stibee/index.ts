import * as functions from "firebase-functions";
import {
  // createSyncedSubscription, // ✅ Firestore 저장하지 않으므로 주석 처리(2025.12.15)
  normalizePhone,
  parseSubscribeRequest,
} from "../services/subscriptionStore";
import { syncSubscriber } from "./client";
import { StibeeApiError } from "./types";

// CORS 헤더 설정 헬퍼 함수 (Express Response 메서드 사용)
const setCorsHeaders = (res: any, origin?: string | string[]): void => {
  // Origin이 배열이면 첫 번째 값 사용
  const originValue = Array.isArray(origin) ? origin[0] : origin;
  const allowedOrigin = originValue || '*';
  
  // Express의 header() 메서드 사용
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '3600');
};

/**
 * 뉴스레터 구독 HTTP 엔드포인트.
 *  1. 요청 값을 검증하여 Firestore에 pending 문서를 생성
 *  2. Stibee API 호출 후 성공/실패 결과를 Firestore에 반영
 *  3. 상황에 맞는 HTTP 상태코드와 메시지를 클라이언트에 응답
 */
// functions/src/stibee/index.ts 수정안

export const subscribeNewsletter = async (
  req: any,
  res: any
): Promise<void> => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    // 1) 요청 검증 (Firestore 저장 전)
    const payload = parseSubscribeRequest(req.body);

    try {
      // 2) ✅ Stibee API 먼저 호출 (기준이 되는 시스템)
      const result = await syncSubscriber({
        email: payload.email,
        name: payload.name,
        company: payload.company,
        phoneNormalized: normalizePhone(payload.phone),
      });

      // ✅ Stibee API 응답 구조 확인
      // 응답 형식: { Ok: true, Error: null, Value: { failExistEmail: [], success: [], update: [] } }
      const responseValue = (result.data as Record<string, any> | undefined)?.Value;
      
      // 이미 구독 중인 이메일인지 확인
      const failExistEmail = responseValue?.failExistEmail || [];
      if (Array.isArray(failExistEmail) && failExistEmail.length > 0) {
        // 이미 구독 중인 이메일이 있는 경우
        res.status(409).json({
          error: "ALREADY_SUBSCRIBED",
          message: "이미 구독 중인 이메일입니다.",
        });
        return;
      }

      // ✅ 성공적으로 추가된 경우만 처리
      const successSubscribers = responseValue?.success || [];
      if (Array.isArray(successSubscribers) && successSubscribers.length === 0) {
        // 성공한 구독자가 없는 경우 (예상치 못한 상황)
        functions.logger.warn("Stibee API: No successful subscribers", {
          responseValue,
          email: payload.email,
        });
        res.status(400).json({
          error: "SUBSCRIPTION_FAILED",
          message: "구독 신청에 실패했습니다.",
        });
        return;
      }

      // 성공한 구독자의 subscriberId 추출 (현재 사용하지 않음 - Firestore 저장 주석 처리)
      // const subscriberId =
      //   successSubscribers[0]?.subscriberId ?? null;

      // 3) ✅ Stibee 성공 후에만 Firestore에 저장 - 주석 처리(2025.12.15)
      // const { id } = await createSyncedSubscription(payload, {
      //   subscriberId,
      //   statusCode: result.status,
      //   message: "OK",
      // });

      res.status(201).json({
        // id, // ✅ Firestore 저장하지 않으므로 id 주석 처리(2025.12.15)
        status: "subscribed",
      });
    } catch (error) {
      if (error instanceof StibeeApiError) {
        // ✅ Stibee API 에러 상세 정보 파싱
        let errorDetail: any = null;
        try {
          errorDetail = error.body ? JSON.parse(error.body) : null;
        } catch {
          // JSON 파싱 실패 시 그대로 사용
        }

        // ✅ 이미 존재하는 이메일인 경우 409 Conflict로 변환
        if (
          error.status === 400 &&
          (errorDetail?.code === 'Errors.List.AlreadyExistEmail' ||
           errorDetail?.message?.includes('이미 존재하는 이메일') ||
           error.body?.includes('AlreadyExistEmail'))
        ) {
          res.status(409).json({
            error: "ALREADY_SUBSCRIBED",
            message: errorDetail?.message || "이미 구독 중인 이메일입니다.",
          });
          return;
        }

        // 기타 Stibee 에러는 502로 반환
        res.status(502).json({
          error: "STIBEE_SYNC_FAILED",
          statusCode: error.status,
          detail: error.body,
        });
        return;
      }

      res.status(500).json({
        error: "UNEXPECTED_ERROR",
      });
    }
  } catch (error) {
    // 검증 에러 등
    if (error instanceof functions.https.HttpsError) {
      res.status(400).json({
        error: error.code,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Stibee 뉴스레터 구독 API 엔드포인트
 * 직접 CORS 헤더 설정 (Emulator 호환성)
 * 
 * Note: Express 앱에서는 subscribeNewsletter를 직접 사용하므로,
 * 이 함수는 별도 배포용으로만 사용됩니다.
 */
export const subscribeNewsletterApi = functions.region("asia-northeast3").https.onRequest(
  async (req, res) => {
    // Origin 헤더에서 요청 출처 가져오기
    const origin = req.headers.origin;
    
    // CORS 헤더 설정 (모든 요청에 대해) - 가장 먼저 실행
    setCorsHeaders(res, origin);

    // OPTIONS 요청 처리 (preflight) - 가장 먼저 처리
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // 실제 요청 처리
    await subscribeNewsletter(req, res);
  }
);

