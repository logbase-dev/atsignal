import type { Request } from "express";
import type { AuthenticatedAdmin } from "../../lib/admin/adminAuth";

const AUTH_KEY = "__ats_admin_auth";

export function attachAdminAuthToRequest(req: Request, auth: AuthenticatedAdmin) {
  (req as any)[AUTH_KEY] = auth;
}

export function getRequestAdminId(req: Request): string {
  const auth = (req as any)[AUTH_KEY] as AuthenticatedAdmin | undefined;
  if (!auth?.adminId) {
    // This should never happen because router enforces requireAdmin() before routing.
    throw new Error("ADMIN_AUTH_MISSING");
  }
  return auth.adminId;
}


