"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = router;
const loginHandler = __importStar(require("./login"));
const logoutHandler = __importStar(require("./logout"));
const authMeHandler = __importStar(require("./auth/me"));
const adminAuth_1 = require("../lib/admin/adminAuth");
const requestAuth_1 = require("./_shared/requestAuth");
const adminsHandler = __importStar(require("./admins"));
const adminsIdHandler = __importStar(require("./admins/[id]"));
const newsletterSubscribersHandler = __importStar(require("./newsletter/subscribers"));
const newsletterSendHistoryHandler = __importStar(require("./newsletter/send-history"));
const menusHandler = __importStar(require("./menus"));
const menusIdHandler = __importStar(require("./menus/[id]"));
const faqsHandler = __importStar(require("./faqs/faqs"));
const faqsIdHandler = __importStar(require("./faqs/[id]"));
const faqCategoriesHandler = __importStar(require("./faq-categories/faq-categories"));
const faqCategoriesIdHandler = __importStar(require("./faq-categories/[id]"));
const glossariesHandler = __importStar(require("./glossaries/glossaries"));
const glossariesIdHandler = __importStar(require("./glossaries/[id]"));
const glossaryCategoriesHandler = __importStar(require("./glossary-categories/glossary-categories"));
const glossaryCategoriesIdHandler = __importStar(require("./glossary-categories/[id]"));
const pagesHandler = __importStar(require("./pages/pages"));
const pagesIdHandler = __importStar(require("./pages/[id]"));
const blogHandler = __importStar(require("./blog"));
const blogIdHandler = __importStar(require("./blog/[id]"));
const blogCategoriesHandler = __importStar(require("./blog/categories"));
const blogCategoriesIdHandler = __importStar(require("./blog/categories/[id]"));
const noticeHandler = __importStar(require("./notice"));
const noticeIdHandler = __importStar(require("./notice/[id]"));
const eventHandler = __importStar(require("./event"));
const eventIdHandler = __importStar(require("./event/[id]"));
const eventParticipantsHandler = __importStar(require("./event/participants/[eventId]"));
const eventParticipantIdHandler = __importStar(require("./event/participants/[eventId]/[participantId]"));
const whatsnewHandler = __importStar(require("./whatsnew"));
const whatsnewIdHandler = __importStar(require("./whatsnew/[id]"));
const imagesUploadHandler = __importStar(require("./images/upload"));
const imagesSignedUrlHandler = __importStar(require("./images/signed-url"));
/**
 * Admin API 통합 라우터
 */
async function router(request, response, path) {
    // 경로 정규화 (앞뒤 슬래시 제거)
    const normalizedPath = path.replace(/^\/+|\/+$/g, "");
    const pathParts = normalizedPath.split("/").filter(Boolean);
    console.log('[Admin API Router] 경로 정보:', {
        originalPath: path,
        normalizedPath,
        pathParts,
        method: request.method,
    });
    // 경로가 비어있으면 404
    if (pathParts.length === 0) {
        response.status(404).json({ error: "Not Found", path: normalizedPath });
        return;
    }
    try {
        // 라우팅
        if (normalizedPath === "login" && request.method === "POST") {
            return await loginHandler.handle(request, response);
        }
        if (normalizedPath === "logout" && request.method === "POST") {
            return await logoutHandler.handle(request, response);
        }
        if (normalizedPath === "auth/me" && request.method === "GET") {
            return await authMeHandler.handle(request, response);
        }
        // A안 정리: login/logout/auth/me 제외 모든 admin 요청은 여기서 인증 강제
        const authed = await (0, adminAuth_1.requireAdmin)(request);
        if (!authed) {
            response.status(401).json({ error: "Unauthorized" });
            return;
        }
        (0, requestAuth_1.attachAdminAuthToRequest)(request, authed);
        // Admins
        if (pathParts[0] === "admins") {
            if (pathParts.length === 1) {
                // GET/POST /admins
                return await adminsHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET /admins/:id (관리자 정보 조회)
                return await adminsIdHandler.handle(request, response, pathParts[1]);
            }
            else if (pathParts.length === 3 && pathParts[2] === "logs") {
                // GET /admins/:id/logs (로그인 로그 조회)
                return await adminsIdHandler.handleLogs(request, response, pathParts[1]);
            }
        }
        // Newsletter (✅ 중복 제거)
        if (pathParts[0] === "newsletter") {
            if (pathParts.length < 2) {
                response.status(404).json({ error: "Not Found", path: normalizedPath });
                return;
            }
            const section = pathParts[1];
            if (section === "subscribers") {
                return await newsletterSubscribersHandler.handle(request, response);
            }
            if (section === "send-history") {
                return await newsletterSendHistoryHandler.handle(request, response);
            }
        }
        // Menus
        if (pathParts[0] === "menus") {
            if (pathParts.length === 1) {
                // GET/POST /menus
                return await menusHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET/PUT/DELETE /menus/:id
                return await menusIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // FAQs
        if (pathParts[0] === "faqs") {
            if (pathParts.length === 1) {
                // GET/POST /faqs
                return await faqsHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET/PUT/DELETE /faqs/:id
                return await faqsIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // FAQ Categories
        if (pathParts[0] === "faq-categories") {
            if (pathParts.length === 1) {
                // GET/POST /faq-categories
                return await faqCategoriesHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET/PUT/DELETE /faq-categories/:id
                return await faqCategoriesIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Glossaries
        if (pathParts[0] === "glossaries") {
            if (pathParts.length === 1) {
                // GET/POST /glossaries
                return await glossariesHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET/PUT/DELETE /glossaries/:id
                return await glossariesIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Glossary Categories
        if (pathParts[0] === "glossary-categories") {
            if (pathParts.length === 1) {
                // GET/POST /glossary-categories
                return await glossaryCategoriesHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET/PUT/DELETE /glossary-categories/:id
                return await glossaryCategoriesIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Pages
        if (pathParts[0] === "pages") {
            if (pathParts.length === 1) {
                // GET/POST /pages
                return await pagesHandler.handle(request, response);
            }
            else if (pathParts.length === 2) {
                // GET/PUT/DELETE /pages/:id
                return await pagesIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Blog
        if (pathParts[0] === "blog") {
            if (pathParts.length >= 2 && pathParts[1] === "categories") {
                if (pathParts.length === 2) {
                    return await blogCategoriesHandler.handle(request, response);
                }
                if (pathParts.length === 3) {
                    return await blogCategoriesIdHandler.handle(request, response, pathParts[2]);
                }
            }
            if (pathParts.length === 1) {
                return await blogHandler.handle(request, response);
            }
            if (pathParts.length === 2) {
                return await blogIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Notice
        if (pathParts[0] === "notice") {
            if (pathParts.length === 1) {
                return await noticeHandler.handle(request, response);
            }
            if (pathParts.length === 2) {
                return await noticeIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Event
        if (pathParts[0] === "event") {
            if (pathParts.length === 1) {
                return await eventHandler.handle(request, response);
            }
            if (pathParts.length === 2) {
                return await eventIdHandler.handle(request, response, pathParts[1]);
            }
            if (pathParts.length === 3 && pathParts[2] === "participants") {
                // GET/POST /event/:eventId/participants
                return await eventParticipantsHandler.handle(request, response, pathParts[1]);
            }
            if (pathParts.length === 4 && pathParts[2] === "participants") {
                // DELETE /event/:eventId/participants/:participantId
                return await eventParticipantIdHandler.handle(request, response, pathParts[1], pathParts[3]);
            }
        }
        // What's New
        if (pathParts[0] === "whatsnew") {
            if (pathParts.length === 1) {
                return await whatsnewHandler.handle(request, response);
            }
            if (pathParts.length === 2) {
                return await whatsnewIdHandler.handle(request, response, pathParts[1]);
            }
        }
        // Images
        if (pathParts[0] === "images") {
            console.log('[Admin API Router] Images 라우팅:', {
                pathParts,
                method: request.method,
                isSignedUrl: pathParts[1] === "signed-url",
                length: pathParts.length,
            });
            if (pathParts.length < 2) {
                response.status(404).json({ error: "Not Found", path: normalizedPath });
                return;
            }
            if (pathParts[1] === "signed-url" && request.method === "POST") {
                console.log('[Admin API Router] signed-url 핸들러 호출');
                return await imagesSignedUrlHandler.handle(request, response);
            }
            if (pathParts[1] === "upload" && request.method === "POST") {
                // Deprecated: 기존 업로드 엔드포인트 (하위 호환성 유지)
                return await imagesUploadHandler.handle(request, response);
            }
            // images 라우팅에 매치되지 않으면 404
            console.log('[Admin API Router] Images 라우팅 매치 실패:', {
                pathParts,
                method: request.method,
            });
            response.status(404).json({ error: "Not Found", path: normalizedPath });
            return;
        }
        // 404
        response.status(404).json({ error: "Not Found", path: normalizedPath });
    }
    catch (error) {
        console.error("[Admin API Router] Error:", error);
        response.status(500).json({
            error: "Internal Server Error",
            message: error.message,
        });
    }
}
//# sourceMappingURL=index.js.map