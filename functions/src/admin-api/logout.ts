import { Request, Response } from "express";

export async function handle(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  // ✅ admin-auth 쿠키 제거 (로그인 시 설정과 동일한 옵션 사용)
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FUNCTIONS_EMULATOR === "1";
  const isProd = process.env.NODE_ENV === "production" && !isEmulator;
  
  // 쿠키 제거: Max-Age=0으로 설정하고, 로그인 시와 동일한 SameSite/Secure 설정 사용
  const cookieOptions = [
    "admin-auth=",
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    isProd ? "SameSite=None" : "SameSite=Lax",
    isProd ? "Secure" : "",
  ].filter(Boolean).join("; ");

  response.setHeader("Set-Cookie", cookieOptions);

  response.json({ success: true });
}