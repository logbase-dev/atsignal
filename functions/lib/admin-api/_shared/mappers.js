"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMenuDoc = mapMenuDoc;
exports.mapPageDoc = mapPageDoc;
exports.mapFaqDoc = mapFaqDoc;
exports.mapFaqCategoryDoc = mapFaqCategoryDoc;
exports.mapGlossaryDoc = mapGlossaryDoc;
exports.mapGlossaryCategoryDoc = mapGlossaryCategoryDoc;
const firestoreUtils_1 = require("./firestoreUtils");
function mapMenuDoc(docSnap) {
    const data = (docSnap.data() || {});
    return {
        id: docSnap.id,
        site: data.site,
        labels: data.labels || { ko: "", en: "" },
        path: data.path || "",
        pageType: data.pageType || "dynamic",
        depth: data.depth || 0,
        parentId: data.parentId || "0",
        order: data.order || 0,
        enabled: data.enabled || { ko: true, en: false },
        description: data.description,
        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
function mapPageDoc(docSnap) {
    const data = (docSnap.data() || {});
    return {
        id: docSnap.id,
        site: data.site,
        menuId: data.menuId,
        slug: data.slug,
        labelsLive: (0, firestoreUtils_1.normalizeLocalizedField)(data.labelsLive ?? data.labels),
        labelsDraft: data.labelsDraft ? (0, firestoreUtils_1.normalizeLocalizedField)(data.labelsDraft) : undefined,
        contentLive: (0, firestoreUtils_1.normalizeLocalizedField)(data.contentLive ?? data.content),
        contentDraft: data.contentDraft ? (0, firestoreUtils_1.normalizeLocalizedField)(data.contentDraft) : undefined,
        editorType: data.editorType || "toast",
        saveFormat: data.saveFormat || "markdown",
        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
        draftUpdatedAt: (0, firestoreUtils_1.convertTimestamp)(data.draftUpdatedAt),
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
function mapFaqDoc(docSnap) {
    const data = (docSnap.data() || {});
    return {
        id: docSnap.id,
        question: (0, firestoreUtils_1.normalizeLocalizedField)(data.question),
        answer: (0, firestoreUtils_1.normalizeLocalizedField)(data.answer),
        categoryId: data.categoryId && String(data.categoryId).trim() ? String(data.categoryId) : undefined,
        level: Number(data.level ?? 999),
        isTop: Boolean(data.isTop ?? false),
        enabled: {
            ko: Boolean(data.enabled?.ko ?? true),
            en: Boolean(data.enabled?.en ?? true),
        },
        tags: Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === "string") : undefined,
        views: typeof data.views === "number" ? data.views : 0,
        editorType: data.editorType || "toast",
        saveFormat: data.saveFormat || "markdown",
        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
        order: data.order !== undefined ? Number(data.order) : undefined,
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
function mapFaqCategoryDoc(docSnap) {
    const data = (docSnap.data() || {});
    return {
        id: docSnap.id,
        name: (0, firestoreUtils_1.normalizeLocalizedField)(data.name),
        description: data.description ? (0, firestoreUtils_1.normalizeLocalizedField)(data.description) : undefined,
        order: Number(data.order ?? 0),
        enabled: {
            ko: Boolean(data.enabled?.ko ?? true),
            en: Boolean(data.enabled?.en ?? true),
        },
        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
function mapGlossaryDoc(docSnap) {
    const data = (docSnap.data() || {});
    // RelatedLink 정규화
    const normalizeRelatedLink = (link) => {
        if (!link || !link.url)
            return undefined;
        return {
            url: String(link.url),
            title: link.title ? String(link.title) : undefined,
            linkType: link.linkType || "docs",
        };
    };
    return {
        id: docSnap.id,
        term: (0, firestoreUtils_1.normalizeLocalizedField)(data.term),
        description: (0, firestoreUtils_1.normalizeLocalizedField)(data.description),
        categoryId: String(data.categoryId || ""),
        initialLetter: String(data.initialLetter || "A").toUpperCase(),
        relatedLinks: Array.isArray(data.relatedLinks)
            ? data.relatedLinks.map(normalizeRelatedLink).filter((l) => l !== undefined)
            : undefined,
        enabled: {
            ko: Boolean(data.enabled?.ko ?? true),
            en: Boolean(data.enabled?.en ?? true),
        },
        views: typeof data.views === "number" ? data.views : 0,
        editorType: data.editorType || "toast",
        saveFormat: data.saveFormat || "markdown",
        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
function mapGlossaryCategoryDoc(docSnap) {
    const data = (docSnap.data() || {});
    return {
        id: docSnap.id,
        name: (0, firestoreUtils_1.normalizeLocalizedField)(data.name),
        description: data.description ? (0, firestoreUtils_1.normalizeLocalizedField)(data.description) : undefined,
        order: Number(data.order ?? 0),
        enabled: {
            ko: Boolean(data.enabled?.ko ?? true),
            en: Boolean(data.enabled?.en ?? true),
        },
        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
//# sourceMappingURL=mappers.js.map