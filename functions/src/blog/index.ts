import * as functions from 'firebase-functions';
import { firestore, FieldValue } from '../firebase';

// 블로그 좋아요 토글
export const blogLikeApi = functions
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
      const blogRef = firestore.collection('blog').doc(blogId);
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
      const likesRef = firestore.collection('blogLikes');
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
          createdAt: FieldValue.serverTimestamp(),
        });

        // 블로그 포스트의 likes 카운트 증가
        await blogRef.update({
          likes: FieldValue.increment(1),
        });

      } else if (action === 'unlike') {
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
          likes: FieldValue.increment(-1),
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

    } catch (error) {
      console.error('Blog like error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: '좋아요 처리 중 오류가 발생했습니다.' 
      });
    }
  });

// 블로그 좋아요 상태 조회
export const getBlogLikeStatus = functions
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
      const blogRef = firestore.collection('blog').doc(blogId as string);
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
      const likesRef = firestore.collection('blogLikes');
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

    } catch (error) {
      console.error('Get blog like status error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: '좋아요 상태 조회 중 오류가 발생했습니다.' 
      });
    }
  });