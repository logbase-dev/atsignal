import type { LocalizedField } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore";

export function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value?.toDate instanceof Function) return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

export function normalizeLocalizedField(field?: { ko?: string; en?: string }): LocalizedField {
  if (!field) return { ko: "" };
  return { ko: field.ko ?? "", ...(field.en ? { en: field.en } : {}) };
}

export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) cleaned[k] = v;
  });
  return cleaned as Partial<T>;
}


