import type { Request } from "express";
import { firestore } from "../../firebase";
import { getAdminById } from "./adminService";

export type AdminAuthMode = "cookie" | "token";

export type AuthenticatedAdmin = {
  adminId: string;
};

function getAdminAuthMode(): AdminAuthMode {
  const raw = (process.env.ADMIN_AUTH_MODE || "cookie").toLowerCase();
  return raw === "token" ? "token" : "cookie";
}

function getAdminIdFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const map = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...rest] = c.trim().split("=");
      return [k, rest.join("=")];
    })
  );
  const token = map["admin-auth"];
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [id] = decoded.split(":");
    return id || null;
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, value] = header.split(" ");
  if (type !== "Bearer" || !value) return null;
  return value;
}

/**
 * Authenticate Admin request.
 *
 * - cookie mode: reads admin-auth cookie (existing behavior)
 * - token mode: verifies Firebase Auth ID token (Bearer) and maps uid -> admins(authUid)
 */
export async function requireAdmin(req: Request): Promise<AuthenticatedAdmin | null> {
  const mode = getAdminAuthMode();

  // Always try cookie auth first when a cookie exists.
  // This prevents confusing local setups where ADMIN_AUTH_MODE=token but the web app uses cookie login.
  const adminIdFromCookie = getAdminIdFromCookie(req);
  if (adminIdFromCookie) {
    const admin = await getAdminById(adminIdFromCookie);
    if (admin && admin.enabled) return { adminId: adminIdFromCookie };

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
  if (!token) return null;

  // Lazy import to avoid any circular init issues
  const { admin } = await import("../../firebase");
  const decoded = await admin.auth().verifyIdToken(token);
  const uid = decoded?.uid;
  if (!uid) return null;

  const snap = await firestore
    .collection("admins")
    .where("authUid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as any;
  if (data?.enabled === false) return null;

  return { adminId: doc.id };
}


