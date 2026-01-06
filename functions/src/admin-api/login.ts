import { Request, Response } from "express";
import { getAdminByUsername, updateLastLoginAt } from "../lib/admin/adminService";
import { comparePassword } from "../lib/utils/password";
import { createLoginLog } from "../lib/admin/adminLoginLogService";

export async function handle(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const { username, password } = request.body;

    if (!username || !password) {
      response.status(400).json({
        error: "사용자명과 비밀번호를 입력해주세요.",
      });
      return;
    }

    // IP 주소 및 User-Agent 추출
    const ipAddress =
      request.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      request.headers["x-real-ip"]?.toString() ||
      "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";

    try {
      // Firestore에서 관리자 조회
      const admin = await getAdminByUsername(username);

      if (!admin) {
        await createLoginLog({
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "존재하지 않는 아이디",
        });

        response.status(401).json({
          error: "사용자명 또는 비밀번호가 올바르지 않습니다.",
        });
        return;
      }

      // 비활성화된 관리자 체크
      if (!admin.enabled) {
        await createLoginLog({
          adminId: admin.id!,
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "비활성화된 계정",
        });

        response.status(403).json({
          error: "비활성화된 계정입니다.",
        });
        return;
      }

      // 비밀번호 검증
      const isPasswordValid = await comparePassword(password, admin.password);

      if (!isPasswordValid) {
        // 비밀번호 불일치 - 실패 기록 생성
        await createLoginLog({
          adminId: admin.id!,
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "비밀번호 오류",
        });

        response.status(401).json({
          error: "사용자명 또는 비밀번호가 올바르지 않습니다.",
        });
        return;
      }

      // 로그인 성공
      // 마지막 로그인 시간 업데이트
      await updateLastLoginAt(admin.id!);

      // 접속 기록 생성
      await createLoginLog({
        adminId: admin.id!,
        username,
        ipAddress,
        userAgent,
        success: true,
      });

      // 쿠키 설정
      const token = Buffer.from(`${admin.id}:${admin.username}`).toString("base64");
      
      const isEmulator =
        process.env.FUNCTIONS_EMULATOR === "true" ||
        process.env.FUNCTIONS_EMULATOR === "1";

      // NOTE:
      // - Emulator/local over HTTP cannot set Secure cookies.
      // - Treat emulator as non-prod even if NODE_ENV=production.
      const isProd = process.env.NODE_ENV === "production" && !isEmulator;

      // ✅ 개발 환경: SameSite=Lax, Secure=false
      // ✅ 프로덕션: SameSite=None, Secure=true (cross-site 쿠키 필요)
      response.cookie("admin-auth", token, {
        httpOnly: true,
        secure: isProd, // 프로덕션에서만 true
        sameSite: isProd ? "none" : "lax", // 프로덕션에서만 "none"
        // Express cookie maxAge is in milliseconds
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // DEBUG: Express가 설정한 Set-Cookie 헤더 확인
      const setCookieHeader = response.getHeader('Set-Cookie');
      console.log('[POST /admin/login] Set-Cookie header:', setCookieHeader);
      console.log('[POST /admin/login] isProd:', isProd, 'secure:', isProd, 'sameSite:', isProd ? 'none' : 'lax');

      response.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
        },
      });
    } catch (error: any) {
      console.error("[POST /admin/login] 인증 처리 중 에러:", error.message);
      response.status(500).json({
        error: "로그인 처리 중 오류가 발생했습니다.",
      });
    }
  } catch (error: any) {
    console.error("[POST /admin/login] 요청 처리 중 에러:", error.message);
    response.status(500).json({
      error: "로그인 처리 중 오류가 발생했습니다.",
    });
  }
}