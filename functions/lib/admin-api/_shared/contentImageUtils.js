"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractImageUrls = extractImageUrls;
exports.extractFileNameFromUrl = extractFileNameFromUrl;
function extractImageUrls(content) {
    const urls = [];
    const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const markdownImgRegex = /!\[.*?\]\((.*?)\)/gi;
    let m;
    while ((m = htmlImgRegex.exec(content)) !== null)
        urls.push(m[1]);
    while ((m = markdownImgRegex.exec(content)) !== null)
        urls.push(m[1]);
    return urls;
}
function extractFileNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const match = urlObj.pathname.match(/images%2F(?:thumbnail|medium|large|original)%2F(.+?)(?:\?|$)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=contentImageUtils.js.map