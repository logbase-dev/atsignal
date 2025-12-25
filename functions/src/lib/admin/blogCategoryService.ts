import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "../../firebase";
import type { BlogCategory, LocalizedField } from "./types";

function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null) return value;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value;

  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as any;
  }

  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (v === undefined) continue;
      const next = stripUndefinedDeep(v);
      if (next === undefined) continue;
      out[k] = next;
    }
    return out as any;
  }

  return value;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

function normalizeLocalizedField(field?: { ko?: string; en?: string } | string): LocalizedField {
  if (!field) return { ko: "" };
  if (typeof field === "string") return { ko: field };
  return {
    ko: field.ko ?? "",
    ...(field.en ? { en: field.en } : {}),
  };
}

function normalizeEnabled(value: any): { ko: boolean; en: boolean } {
  if (value && typeof value === "object") {
    return {
      ko: Boolean(value.ko ?? true),
      en: Boolean(value.en ?? true),
    };
  }
  return { ko: true, en: true };
}

function mapCategory(id: string, data: Record<string, any>): BlogCategory {
  return {
    id,
    name: normalizeLocalizedField(data.name),
    description: data.description ? normalizeLocalizedField(data.description) : undefined,
    slug: String(data.slug || ""),
    order: Number(data.order ?? 0),
    enabled: normalizeEnabled(data.enabled),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const ref = firestore.collection("blogCategories");
    let q: FirebaseFirestore.Query = ref.orderBy("order", "asc");
    const snap = await withTimeout(q.get(), 5000);
    return snap.docs.map((d) => mapCategory(d.id, d.data() as Record<string, any>));
  } catch (error: any) {
    console.error("[getBlogCategories] 에러:", error?.message || error);
    return [];
  }
}

export async function getBlogCategoryById(id: string): Promise<BlogCategory | null> {
  try {
    const snap = await withTimeout(firestore.collection("blogCategories").doc(id).get(), 5000);
    if (!snap.exists) return null;
    return mapCategory(snap.id, (snap.data() || {}) as Record<string, any>);
  } catch (error: any) {
    console.error("[getBlogCategoryById] 에러:", error?.message || error);
    return null;
  }
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const q = firestore.collection("blogCategories").where("slug", "==", slug).limit(2);
  const snap = await withTimeout(q.get(), 5000);
  for (const d of snap.docs) {
    if (!excludeId || d.id !== excludeId) return true;
  }
  return false;
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const base = String(slug || "").trim();
  if (!base) return base;
  if (!(await slugExists(base, excludeId))) return base;
  for (let i = 1; i <= 200; i++) {
    const candidate = `${base}-${i}`;
    if (!(await slugExists(candidate, excludeId))) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createBlogCategory(category: Omit<BlogCategory, "id">): Promise<string> {
  const now = Timestamp.fromDate(new Date());
  const uniqueSlug = await ensureUniqueSlug(category.slug);
  const docRef = await withTimeout(
    firestore.collection("blogCategories").add({
      ...stripUndefinedDeep(category),
      slug: uniqueSlug,
      enabled: category.enabled ?? { ko: true, en: true },
      createdAt: now,
      updatedAt: now,
    }),
    5000
  );
  return docRef.id;
}

export async function updateBlogCategory(id: string, patch: Partial<BlogCategory>): Promise<void> {
  const now = Timestamp.fromDate(new Date());
  const updateData: Record<string, any> = { ...stripUndefinedDeep(patch), updatedAt: now };
  if (patch.slug !== undefined) {
    updateData.slug = await ensureUniqueSlug(String(patch.slug), id);
  }
  if (patch.enabled !== undefined) updateData.enabled = normalizeEnabled(patch.enabled);
  await withTimeout(firestore.collection("blogCategories").doc(id).update(updateData), 5000);
}

export async function deleteBlogCategory(id: string): Promise<void> {
  await withTimeout(firestore.collection("blogCategories").doc(id).delete(), 5000);
}


