import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { FAQ, FAQCategory, Glossary, GlossaryCategory, Menu, Page, RelatedLink } from "../../lib/admin/types";
import { convertTimestamp, normalizeLocalizedField } from "./firestoreUtils";

export function mapMenuDoc(docSnap: DocumentSnapshot): Menu {
  const data = (docSnap.data() || {}) as Record<string, any>;
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
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

export function mapPageDoc(docSnap: DocumentSnapshot): Page {
  const data = (docSnap.data() || {}) as Record<string, any>;
  return {
    id: docSnap.id,
    site: data.site,
    menuId: data.menuId,
    slug: data.slug,
    labelsLive: normalizeLocalizedField(data.labelsLive ?? data.labels),
    labelsDraft: data.labelsDraft ? normalizeLocalizedField(data.labelsDraft) : undefined,
    contentLive: normalizeLocalizedField(data.contentLive ?? data.content),
    contentDraft: data.contentDraft ? normalizeLocalizedField(data.contentDraft) : undefined,
    editorType: data.editorType || "toast",
    saveFormat: data.saveFormat || "markdown",
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    draftUpdatedAt: convertTimestamp(data.draftUpdatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

export function mapFaqDoc(docSnap: DocumentSnapshot): FAQ {
  const data = (docSnap.data() || {}) as Record<string, any>;
  return {
    id: docSnap.id,
    question: normalizeLocalizedField(data.question),
    answer: normalizeLocalizedField(data.answer),
    categoryId: data.categoryId && String(data.categoryId).trim() ? String(data.categoryId) : undefined,
    level: Number(data.level ?? 999),
    isTop: Boolean(data.isTop ?? false),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    tags: Array.isArray(data.tags) ? data.tags.filter((tag: any) => typeof tag === "string") : undefined,
    views: typeof data.views === "number" ? data.views : 0,
    editorType: data.editorType || "toast",
    saveFormat: data.saveFormat || "markdown",
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    order: data.order !== undefined ? Number(data.order) : undefined,
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

export function mapFaqCategoryDoc(docSnap: DocumentSnapshot): FAQCategory {
  const data = (docSnap.data() || {}) as Record<string, any>;
  return {
    id: docSnap.id,
    name: normalizeLocalizedField(data.name),
    description: data.description ? normalizeLocalizedField(data.description) : undefined,
    order: Number(data.order ?? 0),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

export function mapGlossaryDoc(docSnap: DocumentSnapshot): Glossary {
  const data = (docSnap.data() || {}) as Record<string, any>;
  
  // RelatedLink 정규화
  const normalizeRelatedLink = (link?: any): RelatedLink | undefined => {
    if (!link || !link.url) return undefined;
    return {
      url: String(link.url),
      title: link.title ? String(link.title) : undefined,
      linkType: link.linkType || "docs",
    };
  };
  
  return {
    id: docSnap.id,
    term: normalizeLocalizedField(data.term),
    description: normalizeLocalizedField(data.description),
    categoryId: String(data.categoryId || ""),
    initialLetter: String(data.initialLetter || "A").toUpperCase(),
    relatedLinks: Array.isArray(data.relatedLinks)
      ? data.relatedLinks.map(normalizeRelatedLink).filter((l): l is RelatedLink => l !== undefined)
      : undefined,
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    views: typeof data.views === "number" ? data.views : 0,
    editorType: data.editorType || "toast",
    saveFormat: data.saveFormat || "markdown",
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

export function mapGlossaryCategoryDoc(docSnap: DocumentSnapshot): GlossaryCategory {
  const data = (docSnap.data() || {}) as Record<string, any>;
  return {
    id: docSnap.id,
    name: normalizeLocalizedField(data.name),
    description: data.description ? normalizeLocalizedField(data.description) : undefined,
    order: Number(data.order ?? 0),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}


