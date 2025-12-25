"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlogPosts = getBlogPosts;
exports.getBlogPostById = getBlogPostById;
exports.createBlogPost = createBlogPost;
exports.updateBlogPost = updateBlogPost;
exports.incrementBlogPostViews = incrementBlogPostViews;
exports.deleteBlogPost = deleteBlogPost;
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
function normalizeLocalizedField(value) {
    if (!value)
        return { ko: "" };
    if (typeof value === "string")
        return { ko: value };
    if (typeof value === "object") {
        return {
            ko: typeof value.ko === "string" ? value.ko : "",
            en: typeof value.en === "string" ? value.en : undefined,
        };
    }
    return { ko: String(value) };
}
function normalizeEnabled(value) {
    if (value && typeof value === "object") {
        return {
            ko: Boolean(value.ko ?? true),
            // en is optional for many records; default true to match existing patterns
            en: Boolean(value.en ?? true),
        };
    }
    return { ko: true, en: true };
}
async function slugExists(slug, excludeId) {
    const q = firebase_1.firestore.collection("blog").where("slug", "==", slug).limit(2);
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
    // Try base-1, base-2, ... up to 200
    for (let i = 1; i <= 200; i++) {
        const candidate = `${base}-${i}`;
        if (!(await slugExists(candidate, excludeId)))
            return candidate;
    }
    // Fallback: make it unique-ish
    return `${base}-${Date.now()}`;
}
function mapPost(id, data) {
    return {
        id,
        title: normalizeLocalizedField(data.title),
        slug: String(data.slug || ""),
        content: normalizeLocalizedField(data.content),
        excerpt: data.excerpt ? normalizeLocalizedField(data.excerpt) : undefined,
        categoryId: data.categoryId ? String(data.categoryId) : undefined,
        published: Boolean(data.published),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        publishedAt: convertTimestamp(data.publishedAt),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
        thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
        featuredImage: data.featuredImage ? String(data.featuredImage) : undefined,
        authorName: data.authorName ? String(data.authorName) : undefined,
        authorImage: data.authorImage ? String(data.authorImage) : undefined,
        editorType: data.editorType === "toast" || data.editorType === "nextra" ? data.editorType : undefined,
        saveFormat: data.saveFormat === "markdown" || data.saveFormat === "html" ? data.saveFormat : undefined,
        enabled: normalizeEnabled(data.enabled),
        metaTitle: data.metaTitle ? normalizeLocalizedField(data.metaTitle) : undefined,
        metaDescription: data.metaDescription ? normalizeLocalizedField(data.metaDescription) : undefined,
        metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords.map(String) : undefined,
        isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : undefined,
        order: typeof data.order === "number" ? data.order : undefined,
        views: typeof data.views === "number" ? data.views : undefined,
        createdBy: data.createdBy ? String(data.createdBy) : undefined,
        updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
    };
}
async function getBlogPosts(options) {
    try {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const offset = (page - 1) * limit;
        let postsRef = firebase_1.firestore.collection("blog");
        // 카테고리 필터
        if (options?.categoryId && options.categoryId.trim()) {
            postsRef = postsRef.where("categoryId", "==", options.categoryId.trim());
            console.log("[getBlogPosts] 카테고리 필터 적용:", options.categoryId);
        }
        // 발행 상태 필터
        if (options?.published !== undefined) {
            postsRef = postsRef.where("published", "==", options.published);
            console.log("[getBlogPosts] 발행 상태 필터 적용:", options.published);
        }
        // 검색어 필터링을 위해 더 많은 데이터를 가져와서 필터링
        // (Firestore에서 텍스트 검색은 복잡하므로 클라이언트 측 필터링 사용)
        let posts = [];
        let total = 0;
        if (options?.search && options.search.trim()) {
            // 검색어가 있으면 더 많은 데이터를 가져와서 필터링
            console.log("[getBlogPosts] 검색어 필터 적용:", options.search);
            const searchSnap = await withTimeout(postsRef.orderBy("createdAt", "desc").limit(1000).get(), 10000);
            let allPosts = searchSnap.docs.map((d) => mapPost(d.id, d.data()));
            const searchLower = options.search.toLowerCase().trim();
            allPosts = allPosts.filter((post) => {
                const titleKo = (post.title?.ko || "").toLowerCase();
                const titleEn = (post.title?.en || "").toLowerCase();
                const contentKo = (post.content?.ko || "").toLowerCase();
                const contentEn = (post.content?.en || "").toLowerCase();
                return (titleKo.includes(searchLower) ||
                    titleEn.includes(searchLower) ||
                    contentKo.includes(searchLower) ||
                    contentEn.includes(searchLower));
            });
            // 검색 필터링 후 총 개수 재계산
            total = allPosts.length;
            // 페이지네이션 적용
            const startIdx = offset;
            const endIdx = offset + limit;
            posts = allPosts.slice(startIdx, endIdx);
        }
        else {
            // 검색어가 없으면 기존 방식 사용
            // 총 개수 조회 (count()가 지원되지 않을 수 있으므로 전체 조회로 대체)
            try {
                const countSnap = await withTimeout(postsRef.count().get(), 5000);
                total = countSnap.data().count;
            }
            catch (countError) {
                // count()가 지원되지 않으면 전체 문서를 가져와서 개수 계산 (성능상 비효율적이지만 작동함)
                console.warn("[getBlogPosts] count() not supported, using fallback method");
                const allSnap = await withTimeout(postsRef.get(), 10000);
                total = allSnap.size;
            }
            const q = postsRef.orderBy("createdAt", "desc").limit(limit).offset(offset);
            const snap = await withTimeout(q.get(), 5000);
            posts = snap.docs.map((d) => mapPost(d.id, d.data()));
        }
        return {
            posts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    catch (error) {
        console.error("[getBlogPosts] 에러:", error?.message || error);
        return {
            posts: [],
            total: 0,
            page: options?.page || 1,
            limit: options?.limit || 20,
            totalPages: 0,
        };
    }
}
async function getBlogPostById(id) {
    try {
        const docSnap = await withTimeout(firebase_1.firestore.collection("blog").doc(id).get(), 5000);
        if (!docSnap.exists)
            return null;
        return mapPost(docSnap.id, (docSnap.data() || {}));
    }
    catch (error) {
        console.error("[getBlogPostById] 에러:", error?.message || error);
        return null;
    }
}
async function createBlogPost(post) {
    const now = firestore_1.Timestamp.fromDate(new Date());
    const uniqueSlug = await ensureUniqueSlug(post.slug);
    const data = {
        ...stripUndefinedDeep(post),
        slug: uniqueSlug,
        enabled: post.enabled ?? { ko: true, en: true },
        isTop: false, // 블로그는 항상 false로 저장
        views: 0, // 조회수는 0으로 초기화 (웹앱에서 실제 사용자가 방문할 때만 증가)
        createdAt: now,
        updatedAt: now,
        publishedAt: post.published ? now : null,
    };
    console.log('[createBlogPost] 저장할 데이터:', {
        authorName: data.authorName,
        authorImage: data.authorImage,
        hasAuthorName: 'authorName' in data,
        hasAuthorImage: 'authorImage' in data,
    });
    const docRef = await withTimeout(firebase_1.firestore.collection("blog").add(data), 5000);
    return docRef.id;
}
async function updateBlogPost(id, patch) {
    const now = firestore_1.Timestamp.fromDate(new Date());
    const updateData = { ...stripUndefinedDeep(patch), updatedAt: now };
    // views는 수정 시 변경하지 않음 (웹앱에서만 증가)
    delete updateData.views;
    // createdBy는 수정 시 변경하지 않음 (생성 시에만 설정)
    delete updateData.createdBy;
    if (patch.slug !== undefined) {
        updateData.slug = await ensureUniqueSlug(String(patch.slug), id);
    }
    if (patch.published !== undefined)
        updateData.publishedAt = patch.published ? now : null;
    console.log('[updateBlogPost] 업데이트할 데이터:', {
        authorName: updateData.authorName,
        authorImage: updateData.authorImage,
        hasAuthorName: 'authorName' in updateData,
        hasAuthorImage: 'authorImage' in updateData,
    });
    await withTimeout(firebase_1.firestore.collection("blog").doc(id).update(updateData), 5000);
}
async function incrementBlogPostViews(id) {
    try {
        const docRef = firebase_1.firestore.collection("blog").doc(id);
        await withTimeout(docRef.update({
            views: firestore_1.FieldValue.increment(1),
        }), 5000);
    }
    catch (error) {
        console.error("[incrementBlogPostViews] 에러:", error?.message || error);
        throw error;
    }
}
async function deleteBlogPost(id) {
    await withTimeout(firebase_1.firestore.collection("blog").doc(id).delete(), 5000);
}
//# sourceMappingURL=blogService.js.map