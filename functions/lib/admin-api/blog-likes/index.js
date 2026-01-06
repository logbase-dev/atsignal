"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
/**
 * POST /api/admin/blog-likes - 블로그 좋아요/좋아요 취소
 * GET /api/admin/blog-likes/:blogId - 블로그 좋아요 상태 조회
 */
async function handle(request, response) {
    console.log("[Blog Likes API] handle 함수 호출됨, method:", request.method);
    try {
        if (request.method === "POST") {
            return await handleLikeToggle(request, response);
        }
        if (request.method === "GET") {
            return await handleGetLikeStatus(request, response);
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /blog-likes] 에러:", error);
        response.status(500).json({ error: "블로그 좋아요 처리 중 오류가 발생했습니다." });
    }
}
/**
 * 블로그 좋아요 상태 조회
 */
async function handleGetLikeStatus(request, response) {
    const { blogId, sessionId, ipAddress, userAgent } = request.query;
    console.log("[Blog Likes API] 좋아요 상태 조회:", { blogId, sessionId });
    if (!blogId) {
        response.status(400).json({
            error: "blogId는 필수입니다."
        });
        return;
    }
    // 블로그 포스트 존재 확인
    const blogRef = firebase_1.firestore.collection('blog').doc(String(blogId));
    const blogDoc = await blogRef.get();
    if (!blogDoc.exists) {
        response.status(404).json({
            error: 'Blog not found',
            message: '블로그를 찾을 수 없습니다.'
        });
        return;
    }
    const blogData = blogDoc.data();
    const likesCount = blogData?.likes || 0;
    // 사용자 좋아요 여부 확인
    let userLiked = false;
    if (sessionId) {
        // 세션 ID로 확인
        const sessionLikeQuery = await firebase_1.firestore.collection('blogLikes')
            .where('blogId', '==', String(blogId))
            .where('sessionId', '==', String(sessionId))
            .limit(1)
            .get();
        userLiked = !sessionLikeQuery.empty;
    }
    else if (ipAddress && userAgent) {
        // IP + UserAgent로 확인 (익명 사용자)
        const ipLikeQuery = await firebase_1.firestore.collection('blogLikes')
            .where('blogId', '==', String(blogId))
            .where('ipAddress', '==', String(ipAddress))
            .where('userAgent', '==', String(userAgent))
            .where('sessionId', '==', null)
            .limit(1)
            .get();
        userLiked = !ipLikeQuery.empty;
    }
    response.json({
        success: true,
        likes: likesCount,
        userLiked,
    });
}
/**
 * 블로그 좋아요/좋아요 취소
 */
async function handleLikeToggle(request, response) {
    const body = (request.body || {});
    const { blogId, action, sessionId, ipAddress, userAgent } = body;
    console.log("[Blog Likes API] 좋아요 토글:", { blogId, action, sessionId });
    // 필수 필드 검증
    if (!blogId || !action) {
        response.status(400).json({
            error: "blogId, action은 필수입니다."
        });
        return;
    }
    // action 검증
    if (!['like', 'unlike'].includes(action)) {
        response.status(400).json({
            error: '잘못된 액션입니다.'
        });
        return;
    }
    // 세션 ID 또는 IP+UserAgent 중 하나는 있어야 함
    if (!sessionId && (!ipAddress || !userAgent)) {
        response.status(400).json({
            error: 'sessionId 또는 ipAddress+userAgent가 필요합니다.'
        });
        return;
    }
    // 블로그 포스트 존재 확인
    const blogRef = firebase_1.firestore.collection('blog').doc(blogId);
    const blogDoc = await blogRef.get();
    if (!blogDoc.exists) {
        response.status(404).json({
            error: 'Blog not found',
            message: '블로그를 찾을 수 없습니다.'
        });
        return;
    }
    // 기존 좋아요 확인
    let existingLikeQuery;
    if (sessionId) {
        // 세션 ID로 확인
        existingLikeQuery = await firebase_1.firestore.collection('blogLikes')
            .where('blogId', '==', blogId)
            .where('sessionId', '==', sessionId)
            .limit(1)
            .get();
    }
    else {
        // IP + UserAgent로 확인 (익명 사용자)
        existingLikeQuery = await firebase_1.firestore.collection('blogLikes')
            .where('blogId', '==', blogId)
            .where('ipAddress', '==', ipAddress)
            .where('userAgent', '==', userAgent)
            .where('sessionId', '==', null)
            .limit(1)
            .get();
    }
    const existingLike = !existingLikeQuery.empty ? existingLikeQuery.docs[0] : null;
    if (action === 'like') {
        if (existingLike) {
            response.status(409).json({
                error: 'Already liked',
                message: '이미 좋아요를 누르셨습니다.'
            });
            return;
        }
        // 좋아요 추가
        const likeData = {
            blogId,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            createdAt: firebase_1.FieldValue.serverTimestamp(),
        };
        if (sessionId) {
            likeData.sessionId = sessionId;
        }
        else {
            likeData.sessionId = null;
        }
        await firebase_1.firestore.collection('blogLikes').add(likeData);
        // 블로그 포스트의 likes 카운트 증가
        await blogRef.update({
            likes: firebase_1.FieldValue.increment(1),
        });
    }
    else if (action === 'unlike') {
        if (!existingLike) {
            response.status(409).json({
                error: 'Not liked yet',
                message: '아직 좋아요를 누르지 않으셨습니다.'
            });
            return;
        }
        // 좋아요 제거
        await existingLike.ref.delete();
        // 블로그 포스트의 likes 카운트 감소
        await blogRef.update({
            likes: firebase_1.FieldValue.increment(-1),
        });
    }
    // 업데이트된 좋아요 수 가져오기
    const updatedBlogDoc = await blogRef.get();
    const updatedBlog = updatedBlogDoc.data();
    const likesCount = updatedBlog?.likes || 0;
    response.json({
        success: true,
        likes: likesCount,
        userLiked: action === 'like',
    });
}
//# sourceMappingURL=index.js.map