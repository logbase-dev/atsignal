import { Request, Response } from "express";
import { getAdmins, createAdmin, checkUsernameExists } from "../../lib/admin/adminService";
import type { CreateAdminData } from "../../lib/admin/adminService";

/**
 * GET /admin/admins
 * 관리자 목록 조회 또는 아이디 중복 체크
 * POST /admin/admins
 * 새 관리자 생성
 */
export async function handle(request: Request, response: Response) {
  try {
    if (request.method === "GET") {
      return await handleGet(request, response);
    } else if (request.method === "POST") {
      return await handlePost(request, response);
    } else {
      response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }
  } catch (error: any) {
    console.error("[Admin API /admins] 에러:", error.message);
    response.status(500).json({
      error: "요청 처리 중 오류가 발생했습니다.",
    });
  }
}

/**
 * GET 요청 처리
 */
async function handleGet(request: Request, response: Response) {
  try {
    const checkUsername = request.query.checkUsername as string | undefined;

    // 아이디 중복 체크 요청인 경우
    if (checkUsername) {
      const exists = await checkUsernameExists(checkUsername);
      response.json({ exists });
      return;
    }

    // 관리자 목록 조회
    const admins = await getAdmins();
    
    // 비밀번호 필드 제거 (보안)
    const safeAdmins = admins.map(({ password, ...admin }) => admin);
    
    response.json({ admins: safeAdmins });
  } catch (error: any) {
    console.error("[GET /admin/admins] 에러:", error.message);
    response.status(500).json({
      error: "관리자 목록을 불러오는 중 오류가 발생했습니다.",
    });
  }
}

/**
 * POST 요청 처리
 */
async function handlePost(request: Request, response: Response) {
  try {
    const body: CreateAdminData = request.body;
    
    // 필수 필드 검증
    if (!body.username || !body.password || !body.name) {
      response.status(400).json({
        error: "아이디, 비밀번호, 이름은 필수 입력 항목입니다.",
      });
      return;
    }

    // 아이디 유효성 검사 (대소문자 모두 허용)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(body.username)) {
      response.status(400).json({
        error: "아이디는 영문, 숫자, 언더스코어만 사용 가능하며 3-20자여야 합니다.",
      });
      return;
    }

    // 비밀번호 길이 검사
    if (body.password.length < 8) {
      response.status(400).json({
        error: "비밀번호는 최소 8자 이상이어야 합니다.",
      });
      return;
    }

    const adminId = await createAdmin({
      username: body.username,
      password: body.password,
      name: body.name,
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdBy: body.createdBy,
    });

    response.json({ success: true, id: adminId });
  } catch (error: any) {
    console.error("[POST /admin/admins] 에러:", error.message);
    
    if (error.message.includes("이미 사용 중인 아이디")) {
      response.status(409).json({
        error: error.message,
      });
      return;
    }

    response.status(500).json({
      error: "관리자 생성 중 오류가 발생했습니다.",
    });
  }
}

/**
 * GET /admin/admins/:id
 * PUT /admin/admins/:id
 * DELETE /admin/admins/:id
 */
export async function handleById(request: Request, response: Response, id: string) {
  // [id].ts 파일에서 처리
  // 이 함수는 라우터에서 호출됨
  response.status(501).json({ error: "Not implemented in index.ts" });
}

/**
 * GET /admin/admins/:id/logs
 */
export async function handleLogs(request: Request, response: Response, id: string) {
  // [id].ts 파일에서 처리
  // 이 함수는 라우터에서 호출됨
  response.status(501).json({ error: "Not implemented in index.ts" });
}