"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlogCategories = getBlogCategories;
exports.getBlogCategoryById = getBlogCategoryById;
exports.createBlogCategory = createBlogCategory;
exports.updateBlogCategory = updateBlogCategory;
exports.deleteBlogCategory = deleteBlogCategory;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../../firebase");
function stripUndefinedDeep(value) {
    if (value === undefined)
        return value;
    if (value === null)
        return value;
    if (value instanceof Date)
        return value;
    if (value instanceof firestore_1.Timestamp)
        return value;
    if (Array.isArray(value)) {
        return value.map((v) => stripUndefinedDeep(v));
    }
    if (typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            if (v === undefined)
                continue;
            const next = stripUndefinedDeep(v);
            if (next === undefined)
                continue;
            out[k] = next;
        }
        return out;
    }
    return value;
}
function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
}
function convertTimestamp(value) {
    if (!value)
        return undefined;
    if (value instanceof firestore_1.Timestamp)
        return value.toDate();
    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function")
        return value.toDate();
    if (value instanceof Date)
        return value;
    return undefined;
}
function normalizeLocalizedField(field) {
    if (!field)
        return { ko: "" };
    if (typeof field === "string")
        return { ko: field };
    return {
        ko: field.ko ?? "",
        ...(field.en ? { en: field.en } : {}),
    };
}
function normalizeEnabled(value) {
    if (value && typeof value === "object") {
        return {
            ko: Boolean(value.ko ?? true),
            en: Boolean(value.en ?? true),
        };
    }
    return { ko: true, en: true };
}
function mapCategory(id, data) {
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
async function getBlogCategories() {
    try {
        const ref = firebase_1.firestore.collection("blogCategories");
        let q = ref.orderBy("order", "asc");
        const snap = await withTimeout(q.get(), 5000);
        return snap.docs.map((d) => mapCategory(d.id, d.data()));
    }
    catch (error) {
        console.error("[getBlogCategories] 에러:", error?.message || error);
        return [];
    }
}
async function getBlogCategoryById(id) {
    try {
        const snap = await withTimeout(firebase_1.firestore.collection("blogCategories").doc(id).get(), 5000);
        if (!snap.exists)
            return null;
        return mapCategory(snap.id, (snap.data() || {}));
    }
    catch (error) {
        console.error("[getBlogCategoryById] 에러:", error?.message || error);
        return null;
    }
}
async function slugExists(slug, excludeId) {
    const q = firebase_1.firestore.collection("blogCategories").where("slug", "==", slug).limit(2);
    const snap = await withTimeout(q.get(), 5000);
    for (const d of snap.docs) {
        if (!excludeId || d.id !== excludeId)
            return true;
    }
    return false;
}
async function ensureUniqueSlug(slug, excludeId) {
    const base = String(slug || "").trim();
    if (!base)
        return base;
    if (!(await slugExists(base, excludeId)))
        return base;
    for (let i = 1; i <= 200; i++) {
        const candidate = `${base}-${i}`;
        if (!(await slugExists(candidate, excludeId)))
            return candidate;
    }
    return `${base}-${Date.now()}`;
}
async function createBlogCategory(category) {
    const now = firestore_1.Timestamp.fromDate(new Date());
    const uniqueSlug = await ensureUniqueSlug(category.slug);
    const docRef = await withTimeout(firebase_1.firestore.collection("blogCategories").add({
        ...stripUndefinedDeep(category),
        slug: uniqueSlug,
        enabled: category.enabled ?? { ko: true, en: true },
        createdAt: now,
        updatedAt: now,
    }), 5000);
    return docRef.id;
}
async function updateBlogCategory(id, patch) {
    const now = firestore_1.Timestamp.fromDate(new Date());
    const updateData = { ...stripUndefinedDeep(patch), updatedAt: now };
    if (patch.slug !== undefined) {
        updateData.slug = await ensureUniqueSlug(String(patch.slug), id);
    }
    if (patch.enabled !== undefined)
        updateData.enabled = normalizeEnabled(patch.enabled);
    await withTimeout(firebase_1.firestore.collection("blogCategories").doc(id).update(updateData), 5000);
}
async function deleteBlogCategory(id) {
    await withTimeout(firebase_1.firestore.collection("blogCategories").doc(id).delete(), 5000);
}
//# sourceMappingURL=blogCategoryService.js.map