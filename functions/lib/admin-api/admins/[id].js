"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
exports.handleLogs = handleLogs;
const adminService_1 = require("../../lib/admin/adminService");
const adminLoginLogService_1 = require("../../lib/admin/adminLoginLogService");
const requestAuth_1 = require("../_shared/requestAuth");
/**
 * GET /api/admin/admins/:id
 * 관리자 정보 조회
 */
async function handleGetAdmin(request, response, id) {
    try {
        const admin = await (0, adminService_1.getAdminById)(id);
        if (!admin) {
            response.status(404).json({ error: "관리자를 찾을 수 없습니다." });
            return;
        }
        // 비밀번호 필드 제거 (보안)
        const { password, ...safeAdmin } = admin;
        response.json({ admin: safeAdmin });
    }
    catch (error) {
        console.error("[GET /api/admins/[id]] 에러:", error.message);
        response.status(500).json({
            error: "관리자 정보를 불러오는 중 오류가 발생했습니다.",
        });
    }
}
/**
 * GET /api/admin/admins/:id/logs
 * 관리자 로그인 로그 조회
 */
async function handleGetLogs(request, response, id) {
    try {
        // 관리자 존재 여부 확인
        const admin = await (0, adminService_1.getAdminById)(id);
        if (!admin) {
            response.status(404).json({ error: "관리자를 찾을 수 없습니다." });
            return;
        }
        const filters = {};
        // 성공/실패 필터
        const successParam = request.query.success;
        if (successParam !== undefined) {
            filters.success = successParam === "true";
        }
        // 날짜 필터
        const startDateParam = request.query.startDate;
        if (startDateParam) {
            filters.startDate = new Date(startDateParam);
        }
        const endDateParam = request.query.endDate;
        if (endDateParam) {
            filters.endDate = new Date(endDateParam);
        }
        // 페이지네이션
        const limitParam = request.query.limit;
        if (limitParam) {
            filters.limit = parseInt(limitParam, 10);
        }
        const result = await (0, adminLoginLogService_1.getLoginLogsByAdminId)(id, filters);
        response.json({
            logs: result.logs,
            hasMore: result.hasMore,
        });
    }
    catch (error) {
        console.error("[GET /api/admins/[id]/logs] 에러:", error);
        // Firestore 인덱스 에러 안내
        if (error.message && error.message.includes("index")) {
            response.status(500).json({
                error: "Firestore 인덱스가 필요합니다. 에러 메시지의 링크를 클릭하여 인덱스를 생성해주세요.",
                details: error.message,
                requiresIndex: true,
            });
            return;
        }
        response.status(500).json({
            error: "접속 기록을 불러오는 중 오류가 발생했습니다.",
            details: error.message || "알 수 없는 오류",
        });
    }
}
/**
 * PUT /api/admin/admins/:id
 * 관리자 정보 수정
 */
async function handlePut(request, response, id) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(request);
        const existing = await (0, adminService_1.getAdminById)(id);
        if (!existing) {
            response.status(404).json({ error: "관리자를 찾을 수 없습니다." });
            return;
        }
        const body = (request.body || {});
        await (0, adminService_1.updateAdmin)(id, { password: body.password, name: body.name, enabled: body.enabled });
        response.json({ success: true, updatedBy: adminId });
    }
    catch (error) {
        console.error("[PUT /api/admin/admins/:id] 에러:", error.message);
        response.status(500).json({ error: "관리자 수정 중 오류가 발생했습니다." });
    }
}
/**
 * DELETE /api/admin/admins/:id
 * 관리자 비활성화 (enabled:false)
 */
async function handleDelete(request, response, id) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(request);
        const existing = await (0, adminService_1.getAdminById)(id);
        if (!existing) {
            response.status(404).json({ error: "관리자를 찾을 수 없습니다." });
            return;
        }
        await (0, adminService_1.deleteAdmin)(id);
        response.json({ success: true, updatedBy: adminId });
    }
    catch (error) {
        console.error("[DELETE /api/admin/admins/:id] 에러:", error.message);
        response.status(500).json({ error: "관리자 비활성화 중 오류가 발생했습니다." });
    }
}
/**
 * 라우터에서 호출할 진입점
 * GET /api/admin/admins/:id - 관리자 정보 조회
 * GET /api/admin/admins/:id/logs - 로그인 로그 조회 (라우터에서 별도 처리)
 */
async function handle(request, response, id) {
    if (request.method === "GET")
        return await handleGetAdmin(request, response, id);
    if (request.method === "PUT")
        return await handlePut(request, response, id);
    if (request.method === "DELETE")
        return await handleDelete(request, response, id);
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
/**
 * 로그인 로그 조회 (라우터에서 /admins/:id/logs 경로로 호출)
 */
async function handleLogs(request, response, id) {
    if (request.method !== "GET") {
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
        return;
    }
    return await handleGetLogs(request, response, id);
}
//# sourceMappingURL=%5Bid%5D.js.map