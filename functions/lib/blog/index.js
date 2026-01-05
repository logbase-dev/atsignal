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
exports.getBlogLikeStatus = exports.blogLikeApi = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../firebase");
// 블로그 좋아요 토글
exports.blogLikeApi = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { blogId, action, sessionId, ipAddress, userAgent } = req.body;
        console.log('Blog like request:', { blogId, action, sessionId });
        // 필수 필드 검증
        if (!blogId || !action || !sessionId) {
            res.status(400).json({
                error: 'Missing required fields',
                message: '필수 항목이 누락되었습니다.'
            });
            return;
        }
        // action 검증
        if (!['like', 'unlike'].includes(action)) {
            res.status(400).json({
                error: 'Invalid action',
                message: '잘못된 액션입니다.'
            });
            return;
        }
        // 블로그 포스트 존재 확인
        const blogRef = firebase_1.firestore.collection('blog').doc(blogId);
        const blogDoc = await blogRef.get();
        if (!blogDoc.exists) {
            console.error('Blog not found:', blogId);
            res.status(404).json({
                error: 'Blog not found',
                message: '블로그를 찾을 수 없습니다.'
            });
            return;
        }
        console.log('Blog found:', blogId);
        const blogData = blogDoc.data();
        console.log('Current likes value:', blogData?.likes || 0);
        // 기존 좋아요 확인 (sessionId 기준)
        const likesRef = firebase_1.firestore.collection('blogLikes');
        const existingLikeQuery = await likesRef
            .where('blogId', '==', blogId)
            .where('sessionId', '==', sessionId)
            .limit(1)
            .get();
        const existingLike = !existingLikeQuery.empty ? existingLikeQuery.docs[0] : null;
        if (action === 'like') {
            if (existingLike) {
                res.status(409).json({
                    error: 'Already liked',
                    message: '이미 좋아요를 누르셨습니다.'
                });
                return;
            }
            // 좋아요 추가
            await likesRef.add({
                blogId,
                sessionId,
                ipAddress,
                userAgent,
                createdAt: firebase_1.FieldValue.serverTimestamp(),
            });
            // 블로그 포스트의 likes 카운트 증가
            await blogRef.update({
                likes: firebase_1.FieldValue.increment(1),
            });
        }
        else if (action === 'unlike') {
            if (!existingLike) {
                res.status(409).json({
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
        console.log('Blog like success:', { blogId, action, likesCount });
        res.json({
            success: true,
            likes: likesCount,
            userLiked: action === 'like',
        });
    }
    catch (error) {
        console.error('Blog like error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: '좋아요 처리 중 오류가 발생했습니다.'
        });
    }
});
// 블로그 좋아요 상태 조회
exports.getBlogLikeStatus = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    try {
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { blogId, sessionId } = req.query;
        if (!blogId || !sessionId) {
            res.status(400).json({
                error: 'Missing required parameters',
                message: '필수 파라미터가 누락되었습니다.'
            });
            return;
        }
        // 블로그 포스트 정보 가져오기
        const blogRef = firebase_1.firestore.collection('blog').doc(blogId);
        const blogDoc = await blogRef.get();
        if (!blogDoc.exists) {
            console.error('Blog not found:', blogId);
            res.status(404).json({
                error: 'Blog not found',
                message: '블로그를 찾을 수 없습니다.'
            });
            return;
        }
        console.log('Blog found:', blogId);
        const blogData = blogDoc.data();
        const likesCount = blogData?.likes || 0;
        console.log('Current likes value:', likesCount);
        // 사용자 좋아요 여부 확인
        const likesRef = firebase_1.firestore.collection('blogLikes');
        const userLikeQuery = await likesRef
            .where('blogId', '==', blogId)
            .where('sessionId', '==', sessionId)
            .limit(1)
            .get();
        const userLiked = !userLikeQuery.empty;
        res.json({
            success: true,
            likes: likesCount,
            userLiked,
        });
    }
    catch (error) {
        console.error('Get blog like status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: '좋아요 상태 조회 중 오류가 발생했습니다.'
        });
    }
});
//# sourceMappingURL=index.js.map