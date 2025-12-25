"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const firebase_1 = require("../../firebase");
const adminService_1 = require("./adminService");
function getAdminAuthMode() {
    const raw = (process.env.ADMIN_AUTH_MODE || "cookie").toLowerCase();
    return raw === "token" ? "token" : "cookie";
}
function getAdminIdFromCookie(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader)
        return null;
    const map = Object.fromEntries(cookieHeader.split(";").map((c) => {
        const [k, ...rest] = c.trim().split("=");
        return [k, rest.join("=")];
    }));
    const token = map["admin-auth"];
    if (!token)
        return null;
    try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const [id] = decoded.split(":");
        return id || null;
    }
    catch {
        return null;
    }
}
function getBearerToken(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const [type, value] = header.split(" ");
    if (type !== "Bearer" || !value)
        return null;
    return value;
}
/**
 * Authenticate Admin request.
 *
 * - cookie mode: reads admin-auth cookie (existing behavior)
 * - token mode: verifies Firebase Auth ID token (Bearer) and maps uid -> admins(authUid)
 */
async function requireAdmin(req) {
    const mode = getAdminAuthMode();
    // Always try cookie auth first when a cookie exists.
    // This prevents confusing local setups where ADMIN_AUTH_MODE=token but the web app uses cookie login.
    const adminIdFromCookie = getAdminIdFromCookie(req);
    if (adminIdFromCookie) {
        const admin = await (0, adminService_1.getAdminById)(adminIdFromCookie);
        if (admin && admin.enabled)
            return { adminId: adminIdFromCookie };
        // Emulator/dev convenience:
        // When running Functions in the emulator, Firestore is usually also the emulator.
        // If the web app logs in against production Firestore, the admin doc may not exist in the emulator,
        // which would otherwise cause every admin API to 401. In emulator mode, accept the cookie id anyway.
        if (process.env.FUNCTIONS_EMULATOR) {
            return { adminId: adminIdFromCookie };
        }
    }
    // If configured for cookie-only mode, don't fall back to bearer unless explicitly provided.
    // (Dev convenience: bearer token can still be used if sent.)
    if (mode === "cookie" && !req.headers.authorization) {
        return null;
    }
    const token = getBearerToken(req);
    if (!token)
        return null;
    // Lazy import to avoid any circular init issues
    const { admin } = await Promise.resolve().then(() => __importStar(require("../../firebase")));
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded?.uid;
    if (!uid)
        return null;
    const snap = await firebase_1.firestore
        .collection("admins")
        .where("authUid", "==", uid)
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data?.enabled === false)
        return null;
    return { adminId: doc.id };
}
//# sourceMappingURL=adminAuth.js.map