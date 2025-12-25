import { Request, Response } from "express";
import { getSubscribers, getSubscriberCount } from "../../lib/stiee/client";
import { StibeeApiError } from "../../lib/stiee/types";

// 쿠키 파싱 헬퍼
function getAuthToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const map = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...rest] = c.trim().split("=");
      return [k, rest.join("=")];
    })
  );
  return map["admin-auth"];
}

export async function handle(request: Request, response: Response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    // ✅ 에뮬레이터에서는 항상 개발 모드로 처리 (쿠키 검증 생략)
    // 프로덕션 배포 시에만 실제 쿠키 검증 수행
    const isProduction = process.env.GCLOUD_PROJECT && 
                         !process.env.FUNCTIONS_EMULATOR;
    
    // 개발 모드면 인증 체크 생략
    if (!isProduction) {
      console.log("[newsletter/subscribers] 개발 모드: 인증 체크 생략");
    } else {
      // 프로덕션: 인증 확인
      const authToken = getAuthToken(request);
      if (!authToken) {
        response.status(401).json({ error: "인증되지 않았습니다." });
        return;
      }
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url, "http://localhost");

    // count만 요청
    if (searchParams.get("count") === "true") {
      const totalCount = await getSubscriberCount();
      response.json({ totalCount });
      return;
    }

    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // 목록 조회
    const subscribers = await getSubscribers(offset, limit);

    response.json({
      subscribers,
      offset,
      limit,
      hasMore: subscribers.length === limit,
    });
  } catch (error: any) {
    console.error("[GET /api/newsletter/subscribers] 에러:", error.message);

    if (error instanceof StibeeApiError) {
      response.status(error.status).json({
        error: "Stibee API 호출에 실패했습니다.",
        details: error.body,
      });
      return;
    }

    response.status(500).json({
      error: error.message || "구독자 목록을 불러오는 중 오류가 발생했습니다.",
    });
  }
}