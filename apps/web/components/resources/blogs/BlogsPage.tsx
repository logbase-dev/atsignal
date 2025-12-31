'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/lib/admin/types';
import { getPublicBlogs } from '@/lib/public/blogService';

interface Props {
  locale: 'ko' | 'en';
  initialBlogs: BlogPost[];
  initialTotal: number;
  categories: any[];
}

export default function BlogsPage({
  locale,
  initialBlogs,
  initialTotal,
  categories,
}: Props) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const texts = {
    ko: {
      title: '블로그',
      subtitle: 'AtSignal의 최신 기술 블로그와 인사이트를 확인하세요',
      search: '검색',
      searchPlaceholder: '제목이나 내용을 검색하세요',
      category: '카테고리',
      allCategories: '전체',
      reset: '초기화',
      noBlogs: '블로그가 없습니다.',
      loading: '블로그를 불러오는 중...',
      readMore: '자세히 보기',
      author: '작성자',
      date: '작성일',
      views: '조회수',
      previous: '이전',
      next: '다음',
    },
    en: {
      title: 'Blog',
      subtitle: 'Check out the latest tech blog and insights from AtSignal',
      search: 'Search',
      searchPlaceholder: 'Search by title or content',
      category: 'Category',
      allCategories: 'All',
      reset: 'Reset',
      noBlogs: 'No blogs available.',
      loading: 'Loading blogs...',
      readMore: 'Read More',
      author: 'Author',
      date: 'Date',
      views: 'Views',
      previous: 'Previous',
      next: 'Next',
    },
  };

  const t = texts[locale];

  const loadBlogs = async (targetPage: number = 1, search?: string, categoryId?: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await getPublicBlogs({ 
        page: targetPage, 
        limit: 20,
        search: search || undefined,
        categoryId: categoryId || undefined,
      });
      setBlogs(response.blogs);
      setPage(targetPage);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadBlogs(1, searchText, selectedCategory);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedCategory('');
    setPage(1);
    loadBlogs(1, '', '');
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    // Handle Firestore Timestamp objects
    let dateObj: Date;
    if (date && typeof date === 'object' && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const getLocalizedText = (field: { ko: string; en?: string } | undefined) => {
    if (!field) return '';
    return field[locale] || field.ko || '';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return getLocalizedText(category?.name) || '미분류';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      padding: '2rem 1rem',
      paddingTop: '6rem',
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
      }}>
        {/* 헤더 */}
        <div style={{ 
          marginBottom: '3rem',
          textAlign: 'center',
        }}>
          {/* <p style={{
            fontSize: '1.125rem',
            color: '#666',
            margin: '0 0 2rem 0',
          }}>
            {t.subtitle}
          </p> */}
        </div>

        {/* 검색 및 필터 */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            alignItems: 'flex-end' 
          }}>
            {/* 검색 */}
            <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                {t.search}
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
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* 카테고리 */}
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                {t.category}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">{t.allCategories}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getLocalizedText(category.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#20BDFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {t.search}
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {t.reset}
              </button>
            </div>
          </div>
        </div>

        {/* 블로그 목록 */}
        {loading ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              color: '#9ca3af',
              fontSize: '1.125rem',
            }}>
              {t.loading}
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              color: '#9ca3af',
              fontSize: '1.125rem',
              marginBottom: '1rem',
            }}>
              <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.noBlogs}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse' 
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    제목
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    카테고리
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    {t.author}
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    {t.date}
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'right', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    {t.views}
                  </th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id} style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <Link
                        href={`/${locale}/resources/blogs/${blog.id}`}
                        style={{
                          color: '#1a1a1a',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '1rem',
                          lineHeight: '1.4',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#20BDFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#1a1a1a';
                        }}
                      >
                        {getLocalizedText(blog.title)}
                      </Link>
                      {blog.excerpt && (
                        <div style={{
                          color: '#666',
                          fontSize: '0.875rem',
                          marginTop: '0.25rem',
                          lineHeight: '1.4',
                        }}>
                          {getLocalizedText(blog.excerpt)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {getCategoryName(blog.categoryId || '')}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: '#666',
                      fontSize: '0.875rem',
                    }}>
                      {blog.authorName || '-'}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: '#666',
                      fontSize: '0.875rem',
                    }}>
                      {formatDate(blog.createdAt)}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: '#666',
                      fontSize: '0.875rem',
                      textAlign: 'right',
                    }}>
                      {(blog.views || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginTop: '2rem' 
        }}>
          <button
            type="button"
            onClick={() => loadBlogs(page - 1, searchText, selectedCategory)}
            disabled={loading || page === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (loading || page === 1) ? '#e5e7eb' : '#20BDFF',
              color: (loading || page === 1) ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: (loading || page === 1) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {t.previous}
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.max(1, Math.ceil(total / 20)) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => loadBlogs(pageNum, searchText, selectedCategory)}
                disabled={loading}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: pageNum === page ? '#20BDFF' : '#fff',
                  color: pageNum === page ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minWidth: '2.5rem',
                  fontSize: '0.875rem',
                  fontWeight: pageNum === page ? '600' : '500',
                }}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadBlogs(page + 1, searchText, selectedCategory)}
            disabled={loading || page >= Math.ceil(total / 20)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (loading || page >= Math.ceil(total / 20)) ? '#e5e7eb' : '#20BDFF',
              color: (loading || page >= Math.ceil(total / 20)) ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: (loading || page >= Math.ceil(total / 20)) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}