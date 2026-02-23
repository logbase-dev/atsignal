'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogPosts, deleteBlogPost, getFeaturedBlogPosts } from '@/lib/admin/blogService';
import { getBlogCategories } from '@/lib/admin/blogCategoryService';
import type { BlogPost, BlogCategory } from '@/lib/admin/types';
import { BlogCategoryModal } from '@/components/admin/blog/BlogCategoryModal';
import { getAdminApiUrl } from '@/lib/admin/api';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
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
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

  useEffect(() => {
    void loadCategories();
    void loadAdmins();
    void loadFeaturedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1); // 검색 조건 변경 시 첫 페이지로 이동
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCategoryId, searchText, searchPublished, itemsPerPage]);

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchCategoryId, searchText, searchPublished, itemsPerPage]);

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

  const loadFeaturedPosts = async () => {
    try {
      const featured = await getFeaturedBlogPosts(50); // 최대 50개까지 가져오기
      setFeaturedPosts(featured);
    } catch (err) {
      console.error('Failed to load featured posts:', err);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogPosts({ 
        page: currentPage, 
        limit: itemsPerPage,
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

  /** HTML·마크다운 제거 후 요약용 평문 반환 (목록 미리보기용) */
  const toPlainTextForPreview = (raw: string, maxLen: number = 80): string => {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw
      .replace(/<[^>]*>/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^\s*>\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (s.length <= maxLen) return s;
    return s.substring(0, maxLen) + '...';
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteBlogPost(id);
        await loadPosts();
        await loadFeaturedPosts(); // 추천 블로그도 다시 로드
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

      {/* 추천 블로그 카드 */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '1rem',
        }}>
          추천 블로그
        </h2>
        
        {/* 추천 블로그를 3개씩 행으로 나누어 표시 */}
        {(() => {
          const rows = [];
          const totalSlots = Math.max(3, Math.ceil(featuredPosts.length / 3) * 3); // 최소 3개, 3의 배수로 맞춤
          
          for (let i = 0; i < totalSlots; i += 3) {
            const rowPosts = [];
            for (let j = 0; j < 3; j++) {
              const post = featuredPosts[i + j];
              rowPosts.push(post || null);
            }
            
            rows.push(
              <div
                key={`row-${i / 3}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: i + 3 < totalSlots ? '1rem' : '0', // 마지막 행이 아니면 여백 추가
                }}
              >
                {rowPosts.map((post, index) => {
                  const cardIndex = i + index;
                  
                  if (post) {
                    // 실제 블로그 카드
                    return (
                      <div
                        key={post.id}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        {/* 썸네일 이미지 */}
                        <Link href={`/admin/blog/${post.id}/view`}>
                          <div style={{
                            width: '100%',
                            height: '160px',
                            backgroundImage: post.thumbnail ? `url(${post.thumbnail})` : 'none',
                            backgroundColor: post.thumbnail ? 'transparent' : '#f3f4f6',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          >
                            {!post.thumbnail && (
                              <span style={{
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                              }}>
                                썸네일 없음
                              </span>
                            )}
                          </div>
                        </Link>
                        
                        <div style={{ padding: '1rem' }}>
                          {/* 제목 */}
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1a1a1a',
                            marginBottom: '0.5rem',
                            lineHeight: '1.4',
                          }}>
                            <Link
                              href={`/admin/blog/${post.id}`}
                              style={{
                                color: 'inherit',
                                textDecoration: 'none',
                              }}
                            >
                              {post.title?.ko || post.title?.en || '제목 없음'}
                            </Link>
                          </h3>

                          {/* 요약 */}
                          <p style={{
                            color: '#666',
                            fontSize: '0.875rem',
                            lineHeight: '1.4',
                            marginBottom: '0.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {post.excerpt?.ko || post.excerpt?.en || 
                             (post.content?.ko || post.content?.en 
                              ? toPlainTextForPreview(post.content?.ko || post.content?.en || '', 80) 
                              : '내용이 없습니다.')}
                          </p>

                          {/* 메타 정보 */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                          }}>
                            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}</span>
                            <span>{post.published ? '발행' : '초안'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // 빈 카드 플레이스홀더
                    return (
                      <div
                        key={`empty-${cardIndex}`}
                        style={{
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '2px dashed #e9ecef',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '180px',
                          padding: '1rem',
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.5rem',
                        }}>
                          <svg 
                            width="16" 
                            height="16" 
                            fill="none" 
                            stroke="#adb5bd" 
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M12 4.5v15m7.5-7.5h-15" 
                            />
                          </svg>
                        </div>
                        <p style={{
                          color: '#adb5bd',
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          margin: 0,
                          fontWeight: '500',
                        }}>
                          추천 블로그가 없습니다
                        </p>
                      </div>
                    );
                  }
                })}
              </div>
            );
          }
          
          return rows;
        })()}
      </div>

      {/* 총 항목 수 표시 및 페이지당 표시 - 상단 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '0.875rem',
            color: '#666',
          }}
        >
          총 {total}개의 포스트 (페이지 {currentPage} / {Math.max(1, totalPages)})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>페이지당 표시:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '0.375rem 0.5rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
            }}
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}개
              </option>
            ))}
          </select>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>제목</th>
            {/* <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>Slug</th> */}
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>발행 상태</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>추천포스트</th>
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
              <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
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
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', textAlign: 'center' }}>
                    {post.isFeatured ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                      }}>
                        추천
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '0.875rem' }}>-</span>
                    )}
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
      
      {/* 페이지네이션 - 항상 표시 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || totalPages <= 1}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: currentPage === 1 || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
            color: currentPage === 1 || totalPages <= 1 ? '#999' : 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: currentPage === 1 || totalPages <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          이전
        </button>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              disabled={totalPages <= 1}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: page === currentPage ? '#0070f3' : totalPages <= 1 ? '#e5e7eb' : '#fff',
                color: page === currentPage ? 'white' : totalPages <= 1 ? '#999' : '#333',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                cursor: totalPages <= 1 ? 'not-allowed' : 'pointer',
                minWidth: '2.5rem',
              }}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages || totalPages <= 1}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: currentPage >= totalPages || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
            color: currentPage >= totalPages || totalPages <= 1 ? '#999' : 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: currentPage >= totalPages || totalPages <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          다음
        </button>
      </div>

      <BlogCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </div>
  );
}


