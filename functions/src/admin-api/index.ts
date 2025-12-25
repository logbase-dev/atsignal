import { Request, Response } from "express";
import * as loginHandler from "./login";
import * as logoutHandler from "./logout";
import * as authMeHandler from "./auth/me";
import { requireAdmin } from "../lib/admin/adminAuth";
import { attachAdminAuthToRequest } from "./_shared/requestAuth";
import * as adminsHandler from "./admins";
import * as adminsIdHandler from "./admins/[id]"; 
import * as newsletterSubscribersHandler from "./newsletter/subscribers";
import * as newsletterSendHistoryHandler from "./newsletter/send-history";
import * as menusHandler from "./menus";
import * as menusIdHandler from "./menus/[id]";
import * as faqsHandler from "./faqs/faqs";
import * as faqsIdHandler from "./faqs/[id]";
import * as faqCategoriesHandler from "./faq-categories/faq-categories";
import * as faqCategoriesIdHandler from "./faq-categories/[id]";
import * as glossariesHandler from "./glossaries/glossaries";
import * as glossariesIdHandler from "./glossaries/[id]";
import * as glossaryCategoriesHandler from "./glossary-categories/glossary-categories";
import * as glossaryCategoriesIdHandler from "./glossary-categories/[id]";
import * as pagesHandler from "./pages/pages";
import * as pagesIdHandler from "./pages/[id]";
import * as blogHandler from "./blog";
import * as blogIdHandler from "./blog/[id]";
import * as blogCategoriesHandler from "./blog/categories";
import * as blogCategoriesIdHandler from "./blog/categories/[id]";
import * as noticeHandler from "./notice";
import * as noticeIdHandler from "./notice/[id]";
import * as eventHandler from "./event";
import * as eventIdHandler from "./event/[id]";
import * as eventParticipantsHandler from "./event/participants/[eventId]";
import * as eventParticipantIdHandler from "./event/participants/[eventId]/[participantId]";
import * as whatsnewHandler from "./whatsnew";
import * as whatsnewIdHandler from "./whatsnew/[id]";
import * as imagesUploadHandler from "./images/upload";
import * as imagesSignedUrlHandler from "./images/signed-url";


/**
 * Admin API 통합 라우터
 */
export async function router(request: Request, response: Response, path: string) {
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
    const authed = await requireAdmin(request);
    if (!authed) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }
    attachAdminAuthToRequest(request, authed);

    // Admins
    if (pathParts[0] === "admins") {
      if (pathParts.length === 1) {
        // GET/POST /admins
        return await adminsHandler.handle(request, response);
      } else if (pathParts.length === 2) {
        // GET /admins/:id (관리자 정보 조회)
        return await adminsIdHandler.handle(request, response, pathParts[1]);
      } else if (pathParts.length === 3 && pathParts[2] === "logs") {
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
      } else if (pathParts.length === 2) {
        // GET/PUT/DELETE /menus/:id
        return await menusIdHandler.handle(request, response, pathParts[1]);
      }
    }

    // FAQs
    if (pathParts[0] === "faqs") {
      if (pathParts.length === 1) {
        // GET/POST /faqs
        return await faqsHandler.handle(request, response);
      } else if (pathParts.length === 2) {
        // GET/PUT/DELETE /faqs/:id
        return await faqsIdHandler.handle(request, response, pathParts[1]);
      }
    }

    // FAQ Categories
    if (pathParts[0] === "faq-categories") {
      if (pathParts.length === 1) {
        // GET/POST /faq-categories
        return await faqCategoriesHandler.handle(request, response);
      } else if (pathParts.length === 2) {
        // GET/PUT/DELETE /faq-categories/:id
        return await faqCategoriesIdHandler.handle(request, response, pathParts[1]);
      }
    }

    // Glossaries
    if (pathParts[0] === "glossaries") {
      if (pathParts.length === 1) {
        // GET/POST /glossaries
        return await glossariesHandler.handle(request, response);
      } else if (pathParts.length === 2) {
        // GET/PUT/DELETE /glossaries/:id
        return await glossariesIdHandler.handle(request, response, pathParts[1]);
      }
    }

    // Glossary Categories
    if (pathParts[0] === "glossary-categories") {
      if (pathParts.length === 1) {
        // GET/POST /glossary-categories
        return await glossaryCategoriesHandler.handle(request, response);
      } else if (pathParts.length === 2) {
        // GET/PUT/DELETE /glossary-categories/:id
        return await glossaryCategoriesIdHandler.handle(request, response, pathParts[1]);
      }
    }

    // Pages
    if (pathParts[0] === "pages") {
      if (pathParts.length === 1) {
        // GET/POST /pages
        return await pagesHandler.handle(request, response);
      } else if (pathParts.length === 2) {
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
  } catch (error: any) {
    console.error("[Admin API Router] Error:", error);
    response.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
}