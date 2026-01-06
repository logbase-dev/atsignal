"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachAdminAuthToRequest = attachAdminAuthToRequest;
exports.getRequestAdminId = getRequestAdminId;
const AUTH_KEY = "__ats_admin_auth";
function attachAdminAuthToRequest(req, auth) {
    req[AUTH_KEY] = auth;
}
function getRequestAdminId(req) {
    const auth = req[AUTH_KEY];
    if (!auth?.adminId) {
        // This should never happen because router enforces requireAdmin() before routing.
        throw new Error("ADMIN_AUTH_MISSING");
    }
    return auth.adminId;
}
//# sourceMappingURL=requestAuth.js.map