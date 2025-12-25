'use client';

import { useEffect, useState } from 'react';
import { getBlogPosts, deleteBlogPost } from '@/lib/admin/blogService';
import type { BlogPost } from '@/lib/admin/types';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogPosts();
      setPosts(data);
      
      // 데이터가 없고 에러가 없으면 Firebase 설정 문제일 수 있음
      if (data.length === 0) {
        console.warn('블로그 포스트가 없거나 Firebase 연결에 문제가 있을 수 있습니다.');
      }
    } catch (error: any) {
      console.error('Failed to load blog posts:', error);
      setError(error.message || '블로그 포스트를 불러오는데 실패했습니다. Firebase 환경 변수를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteBlogPost(id);
        await loadPosts();
      } catch (error) {
        console.error('Failed to delete blog post:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>블로그 관리</h1>
        <button 
          onClick={() => {/* TODO: 블로그 포스트 추가 모달 */}}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
        >
          포스트 추가
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: '0.25rem',
          marginBottom: '1rem',
          color: '#856404'
        }}>
          <strong>경고:</strong> {error}
        </div>
      )}

      {posts.length === 0 && !error ? (
        <p style={{ color: '#666' }}>블로그 포스트가 없습니다.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>제목</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>Slug</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>발행 상태</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작성일</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>{post.title}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>{post.slug}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                  {post.published ? (
                    <span style={{ color: '#28a745' }}>발행됨</span>
                  ) : (
                    <span style={{ color: '#666' }}>초안</span>
                  )}
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                  <button 
                    onClick={() => {/* TODO: 수정 */}}
                    style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id!)}
                    style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

