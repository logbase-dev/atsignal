'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogPosts, deleteBlogPost } from '@/lib/admin/blogService';
import { getBlogCategories } from '@/lib/admin/blogCategoryService';
import type { BlogPost, BlogCategory } from '@/lib/admin/types';
import { BlogCategoryModal } from '@/components/admin/blog/BlogCategoryModal';
import { getAdminApiUrl } from '@/lib/admin/api';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [searchCategoryId, setSearchCategoryId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [searchPublished, setSearchPublished] = useState<boolean | undefined>(undefined);
  const limit = 20;

  useEffect(() => {
    void loadCategories();
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1); // 검색 조건 변경 시 첫 페이지로 이동
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCategoryId, searchText, searchPublished]);

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchCategoryId, searchText, searchPublished]);

  const loadCategories = async () => {
    try {
      const cats = await getBlogCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await fetch(getAdminApiUrl('admins'), { credentials: 'include' });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const adminMap = new Map<string, { name: string; username: string }>();
        (data.admins || []).forEach((admin: { id?: string; name: string; username: string }) => {
          if (admin.id) adminMap.set(admin.id, { name: admin.name, username: admin.username });
        });
        setAdmins(adminMap);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogPosts({ 
        page: currentPage, 
        limit,
        categoryId: searchCategoryId && searchCategoryId.trim() ? searchCategoryId.trim() : undefined,
        search: searchText && searchText.trim() ? searchText.trim() : undefined,
        published: searchPublished,
      });
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      if (data.posts.length === 0 && data.total === 0) {
        console.warn('블로그 포스트가 없거나 API/Firestore 연결에 문제가 있을 수 있습니다.');
      }
    } catch (e: any) {
      console.error('Failed to load blog posts:', e);
      setError(e.message || '블로그 포스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    void loadPosts();
  };

  const handleReset = () => {
    setSearchCategoryId('');
    setSearchText('');
    setSearchPublished(undefined);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteBlogPost(id);
        await loadPosts();
      } catch (e) {
        console.error('Failed to delete blog post:', e);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>블로그 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            카테고리 관리
          </button>
          <Link
            href="/admin/blog/new"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            포스트 추가
          </Link>
        </div>
      </div>

      {/* 검색 필터 */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          {/* 카테고리 검색 */}
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              카테고리
            </label>
            <select
              value={searchCategoryId}
              onChange={(e) => setSearchCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="">전체</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name?.ko || cat.name?.en || '이름 없음'}
                </option>
              ))}
            </select>
          </div>

          {/* 제목/내용 검색 */}
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              제목/내용 검색
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="검색어를 입력하세요"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* 발행 상태 검색 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              발행 상태
            </label>
            <select
              value={searchPublished === undefined ? '' : searchPublished ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value;
                setSearchPublished(value === '' ? undefined : value === 'true');
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="">전체</option>
              <option value="true">발행</option>
              <option value="false">초안</option>
            </select>
          </div>

          {/* 검색 버튼 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSearch}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            color: '#856404',
          }}
        >
          <strong>경고:</strong> {error}
        </div>
      ) : null}

      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
        총 {total}개의 포스트 {totalPages > 0 && `(페이지 ${currentPage} / ${totalPages})`}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>제목</th>
            {/* <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>Slug</th> */}
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>발행 상태</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작성자</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>수정자</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>조회수</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작성일</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                블로그 포스트가 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.id}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    <Link
                      href={`/admin/blog/${post.id}/view`}
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {post.title?.ko || '-'}
                    </Link>
                  </td>
                  {/* <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    <Link
                      href={`/admin/blog/${post.id}/view`}
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {post.slug}
                    </Link>
                  </td> */}
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    {post.published ? <span style={{ color: '#28a745' }}>발행</span> : <span style={{ color: '#666' }}>초안</span>}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem' }}>
                    {post.createdBy ? admins.get(post.createdBy)?.name || '알 수 없음' : '-'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem' }}>
                    {post.updatedBy ? admins.get(post.updatedBy)?.name || '알 수 없음' : '-'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', textAlign: 'right' }}>
                    {post.views !== undefined ? post.views.toLocaleString() : '0'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    <Link
                      href={`/admin/blog/${post.id}`}
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id!)}
                      style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                      type="button"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
      
      {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === 1 ? '#e5e5e5' : '#0070f3',
                  color: currentPage === 1 ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                이전
              </button>
              
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: currentPage === pageNum ? '#0070f3' : '#fff',
                        color: currentPage === pageNum ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        minWidth: '2.5rem',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === totalPages ? '#e5e5e5' : '#0070f3',
                  color: currentPage === totalPages ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                다음
              </button>
            </div>
          )}

      <BlogCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </div>
  );
}


