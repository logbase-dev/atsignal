"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
exports.handleById = handleById;
exports.handleLogs = handleLogs;
const adminService_1 = require("../../lib/admin/adminService");
/**
 * GET /admin/admins
 * 관리자 목록 조회 또는 아이디 중복 체크
 * POST /admin/admins
 * 새 관리자 생성
 */
async function handle(request, response) {
    console.log('[Admins API] 요청 시작:', {
        method: request.method,
        query: request.query,
    });
    try {
        if (request.method === "GET") {
            console.log('[Admins API] GET 요청 처리');
            return await handleGet(request, response);
        }
        else if (request.method === "POST") {
            console.log('[Admins API] POST 요청 처리');
            return await handlePost(request, response);
        }
        else {
            console.log('[Admins API] 지원하지 않는 메소드:', request.method);
            response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
            return;
        }
    }
    catch (error) {
        console.error("[Admin API /admins] 에러:", error.message);
        console.error("[Admin API /admins] 스택:", error.stack);
        response.status(500).json({
            error: "요청 처리 중 오류가 발생했습니다.",
        });
    }
}
/**
 * GET 요청 처리
 */
async function handleGet(request, response) {
    console.log('[Admins API] handleGet 시작');
    try {
        const checkUsername = request.query.checkUsername;
        console.log('[Admins API] checkUsername:', checkUsername);
        // 아이디 중복 체크 요청인 경우
        if (checkUsername) {
            console.log('[Admins API] 아이디 중복 체크 요청');
            const exists = await (0, adminService_1.checkUsernameExists)(checkUsername);
            console.log('[Admins API] 중복 체크 결과:', exists);
            response.json({ exists });
            return;
        }
        // 관리자 목록 조회
        console.log('[Admins API] 관리자 목록 조회 시작');
        const admins = await (0, adminService_1.getAdmins)();
        console.log('[Admins API] 관리자 목록 조회 완료, 개수:', admins.length);
        // 비밀번호 필드 제거 (보안)
        const safeAdmins = admins.map(({ password, ...admin }) => admin);
        console.log('[Admins API] 응답 전송');
        response.json({ admins: safeAdmins });
    }
    catch (error) {
        console.error("[GET /admin/admins] 에러:", error.message);
        console.error("[GET /admin/admins] 스택:", error.stack);
        response.status(500).json({
            error: "관리자 목록을 불러오는 중 오류가 발생했습니다.",
        });
    }
}
/**
 * POST 요청 처리
 */
async function handlePost(request, response) {
    try {
        const body = request.body;
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
        const adminId = await (0, adminService_1.createAdmin)({
            username: body.username,
            password: body.password,
            name: body.name,
            enabled: body.enabled !== undefined ? body.enabled : true,
            createdBy: body.createdBy,
        });
        response.json({ success: true, id: adminId });
    }
    catch (error) {
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
async function handleById(request, response, id) {
    // [id].ts 파일에서 처리
    // 이 함수는 라우터에서 호출됨
    response.status(501).json({ error: "Not implemented in index.ts" });
}
/**
 * GET /admin/admins/:id/logs
 */
async function handleLogs(request, response, id) {
    // [id].ts 파일에서 처리
    // 이 함수는 라우터에서 호출됨
    response.status(501).json({ error: "Not implemented in index.ts" });
}
//# sourceMappingURL=index.js.map