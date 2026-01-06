"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPreviewUrl = buildPreviewUrl;
exports.buildPublishedUrl = buildPublishedUrl;
// Functions 환경: 배포용 환경 변수 사용
const WEB_ORIGIN = process.env.WEB_PREVIEW_ORIGIN || process.env.NEXT_PUBLIC_WEB_PREVIEW_ORIGIN || "http://localhost:3000";
const DOCS_ORIGIN = process.env.DOCS_PREVIEW_ORIGIN || process.env.NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN || "http://localhost:3001";
const PREVIEW_SECRET = process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_PREVIEW_SECRET || "atsignal-preview";
const ORIGIN_MAP = {
    web: WEB_ORIGIN,
    docs: DOCS_ORIGIN,
};
function buildPreviewUrl(site, slug, locale, draftId) {
    const base = ORIGIN_MAP[site];
    const sanitizedSlug = slug.replace(/^\/+/, "");
    const previewUrl = new URL("/api/preview", base);
    previewUrl.searchParams.set("secret", PREVIEW_SECRET);
    previewUrl.searchParams.set("slug", sanitizedSlug);
    previewUrl.searchParams.set("locale", locale);
    previewUrl.searchParams.set("draftId", draftId);
    previewUrl.searchParams.set("preview", "1");
    return previewUrl.toString();
}
function buildPublishedUrl(site, slug, locale = "ko") {
    const base = ORIGIN_MAP[site];
    const sanitizedSlug = slug.replace(/^\/+/, "").replace(/\/+$/, "");
    // (dynamic)은 route group이므로 실제 URL에 포함되지 않음
    return `${base}/${locale}/${sanitizedSlug}`;
}
//# sourceMappingURL=preview.js.map