import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { FAQ } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { getRequestAdminId } from "../_shared/requestAuth";
import { removeUndefinedFields } from "../_shared/firestoreUtils";
import { mapFaqDoc } from "../_shared/mappers";

// GET /api/faqs
async function handleGet(request: Request, response: Response) {
  try {
    // ✅ Express의 request.query 사용 (Firebase Functions에서 안전)
    const categoryId = request.query.categoryId as string | undefined;
    const tags = Array.isArray(request.query.tags) 
      ? request.query.tags as string[] 
      : request.query.tags 
        ? [request.query.tags as string] 
        : [];
    const search = request.query.search as string | undefined;
    const orderBy = request.query.orderBy as 'level' | 'isTop' | 'createdAt' | undefined;
    const orderDirection = request.query.orderDirection as 'asc' | 'desc' | undefined;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    let q: admin.firestore.Query = firestore.collection("faqs");

    // 카테고리 필터링
    if (categoryId && categoryId !== '__no_category__') {
      q = q.where("categoryId", "==", categoryId);
    }

    // 태그 필터링
    if (tags.length > 0) {
      const tagsToQuery = tags.slice(0, 10); // Firestore는 최대 10개까지만 지원
      q = q.where("tags", "array-contains-any", tagsToQuery);
    }

    // 정렬
    try {
      if (orderBy === 'isTop') {
        q = q.orderBy("isTop", orderDirection === 'asc' ? 'asc' : 'desc');
        q = q.orderBy("level", "asc");
        q = q.orderBy("order", "asc");
      } else if (orderBy === 'level') {
        q = q.orderBy("level", orderDirection === 'asc' ? 'asc' : 'desc');
        q = q.orderBy("order", "asc");
      } else {
        q = q.orderBy("createdAt", orderDirection === 'asc' ? 'asc' : 'desc');
      }
    } catch (error) {
      console.warn('[GET /api/faqs] orderBy failed, using default:', error);
      q = q.orderBy("createdAt", "desc");
    }

    const snap = await q.get();
    let faqs = snap.docs.map(mapFaqDoc);

    // 미분류 필터링 (클라이언트 측)
    if (categoryId === '__no_category__') {
      faqs = faqs.filter((faq) => !faq.categoryId || faq.categoryId.trim() === '');
    }

    // 검색 필터링 (클라이언트 측)
    if (search) {
      const searchLower = search.toLowerCase();
      faqs = faqs.filter((faq) => {
        const questionKo = faq.question.ko?.toLowerCase() || '';
        const questionEn = faq.question.en?.toLowerCase() || '';
        const answerKo = faq.answer.ko?.toLowerCase() || '';
        const answerEn = faq.answer.en?.toLowerCase() || '';
        return questionKo.includes(searchLower) || 
               questionEn.includes(searchLower) || 
               answerKo.includes(searchLower) || 
               answerEn.includes(searchLower);
      });
    }

    // 총 개수 계산
    const total = faqs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // 페이지네이션 적용
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFaqs = faqs.slice(startIndex, endIndex);

    console.log('[GET /api/faqs] 페이지네이션 정보:', {
      total,
      page,
      limit,
      totalPages,
      startIndex,
      endIndex,
      paginatedCount: paginatedFaqs.length
    });

    response.json({ 
      faqs: paginatedFaqs,
      total,
      page,
      limit,
      totalPages
    });
  } catch (error: any) {
    console.error("[GET /api/faqs] 에러:", error.message);
    response.status(500).json({ error: "FAQ 목록을 불러오는 중 오류가 발생했습니다." });
  }
}


// POST /api/faqs  (새 FAQ 생성)
async function handlePost(request: Request, response: Response) {
  // ✅ request.method 체크 제거 (handle 함수에서 이미 체크함)
  try {
    const adminId = getRequestAdminId(request);

    // 요청 본문 파싱
    const body = request.body as Omit<FAQ, "id" | "createdBy" | "updatedBy">;

    // 필수 필드 검증
    if (!body.question?.ko) {
      response.status(400).json({ error: "질문(한국어)은 필수 입력 항목입니다." });
      return;
    }
    if (!body.answer?.ko) {
      response.status(400).json({ error: "답변(한국어)은 필수 입력 항목입니다." });
      return;
    }

    const now = Timestamp.fromDate(new Date());
    const faqsRef = firestore.collection("faqs");
    const docRef = await faqsRef.add(
      removeUndefinedFields({
        ...body,
        level: body.level ?? 999,
        isTop: body.isTop ?? false,
        order: body.order ?? 0,
        views: 0, // 생성 시 0으로 초기화
        createdAt: now,
        updatedAt: now,
        createdBy: adminId,
        updatedBy: adminId,
      })
    );

    response.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("[POST /api/faqs] 에러:", error.message);
    response.status(500).json({ error: "FAQ 생성 중 오류가 발생했습니다." });
  }
}

// 라우터에서 호출할 진입점
export async function handle(request: Request, response: Response) {
  if (request.method === "GET") {
    return handleGet(request, response);
  }
  if (request.method === "POST") {
    return handlePost(request, response);
  }
  response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}