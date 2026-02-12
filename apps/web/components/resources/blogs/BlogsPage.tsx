'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/lib/admin/types';
import { getPublicBlogs, getPublicFeaturedBlogs } from '@/lib/public/blogService';
// 2/6 3:28 김현득 추가
import { sendGAEvent } from '@next/third-parties/google';
// 2/6 3:28 김현득 추가 end

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
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const texts = {
    ko: {
      title: 'atsignal blogs',
      subtitle: 'atsignal 블로그에서 Product Analytics와 관련된 구축사례, 주요 개념, 업계 트렌드를 확인하세요.',
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
      featured: '추천 블로그',
    },
    en: {
      title: 'atsignal blog',
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
      featured: 'Featured Blogs',
    },
  };

  const t = texts[locale];

  // Featured 블로그 로드
  useEffect(() => {
    const loadFeaturedBlogs = async () => {
      try {
        const featured = await getPublicFeaturedBlogs(50); // 최대 50개까지 가져오기
        setFeaturedBlogs(featured);
      } catch (error) {
        console.error('Failed to load featured blogs:', error);
      }
    };

    loadFeaturedBlogs();
  }, []);

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
// 2/6 오후 3:28에 김현득 추가
    sendGAEvent(
      "event", 'search', {
      search_term: searchText,
      page_path: window.location.pathname, // 추가 라인 2/9
    });
// 2/6 오후 3:28에 김현득 추가 end    
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
      paddingBottom: '2rem'
    }}>

      <div className="hero-page">
        <div className="hero-page-container" style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '2rem',
          flexWrap: 'wrap',
          padding: '8rem 1rem', // padding 줄여서 위로 올림
          paddingTop: '8rem' // 상단 padding 줄임
        }}>
          <div style={{ 
            flexShrink: 0,
            maxWidth: '20%',
            minWidth: '150px',
            position: 'relative',
            marginTop: '-1rem', // 이미지만 더 위로 올림
// 2/12 김현득 마진 조정. 오른 쪽으로 조금 이동
            marginLeft: '1rem'            
          }}>
            <Image
              src="/images/blog_image.jpg"
              alt="atsignal blogs"
              width={0}
              height={0}
              sizes="20vw"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              priority
            />
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>atsignal blogs</h1>
            <p>atsignal 블로그에서 Product Analytics와 관련된 구축사례, 주요 개념, 업계 트렌드를 확인하세요.</p>
            {/* <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p> */}
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* Featured 블로그 카드 */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '1.5rem',
          }}>
            {t.featured}
          </h2>
          
          {/* 추천 블로그를 3개씩 행으로 나누어 표시 */}
          {(() => {
            const rows = [];
            const totalSlots = Math.max(3, Math.ceil(featuredBlogs.length / 3) * 3); // 최소 3개, 3의 배수로 맞춤
            
            for (let i = 0; i < totalSlots; i += 3) {
              const rowBlogs = [];
              for (let j = 0; j < 3; j++) {
                const blog = featuredBlogs[i + j];
                rowBlogs.push(blog || null);
              }
              
              rows.push(
                <div
                  key={`row-${i / 3}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1.5rem',
                    marginBottom: i + 3 < totalSlots ? '1.5rem' : '0', // 마지막 행이 아니면 여백 추가
                  }}
                >
                  {rowBlogs.map((blog, index) => {
                    const cardIndex = i + index;
                    
                    if (blog) {
                      // 실제 블로그 카드
                      return (
                        <div
                          key={blog.id}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          {/* 썸네일 이미지 */}
                          <Link href={`/${locale}/resources/blogs/${blog.slug || blog.id}`}>
                            <div style={{
                              width: '100%',
                              height: '200px',
                              backgroundImage: blog.thumbnail ? `url(${blog.thumbnail})` : 'none',
                              backgroundColor: blog.thumbnail ? 'transparent' : '#f3f4f6',
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
                              {!blog.thumbnail && (
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
                            {/* 카테고리 */}
                            {blog.categoryId && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                }}>
                                  {getCategoryName(blog.categoryId)}
                                </span>
                              </div>
                            )}

                            {/* 제목 */}
                            <h3 style={{
                              fontSize: '1.125rem',
                              fontWeight: '600',
                              color: '#1a1a1a',
                              marginBottom: '0.5rem',
                              lineHeight: '1.4',
                            }}>
                              <Link
                                href={`/${locale}/resources/blogs/${blog.slug || blog.id}`}
                                style={{
                                  color: 'inherit',
                                  textDecoration: 'none',
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
                            </h3>

                            {/* 요약 */}
                            <p style={{
                              color: '#666',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                              marginBottom: '0.75rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {getLocalizedText(blog.excerpt) || 
                               (getLocalizedText(blog.content) ? 
                                getLocalizedText(blog.content).replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 
                                '내용이 없습니다.')}
                            </p>

                            {/* 메타 정보 */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                            }}>
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                {blog.authorName && (
                                  <span>{blog.authorName}</span>
                                )}
                                <span>{formatDate(blog.createdAt)}</span>
                              </div>
                              <span>{(blog.views || 0).toLocaleString()} views</span>
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
                            borderRadius: '12px',
                            border: '2px dashed #e9ecef',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '220px',
                            padding: '1.5rem',
                          }}
                        >
                          <div style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.75rem',
                          }}>
                            <svg 
                              width="20"
                              height="20"
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
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            margin: 0,
                            fontWeight: '500',
                          }}>
                            {locale === 'ko' ? '추천 블로그가 없습니다' : 'No featured blog'}
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
            <div style={{ flex: '1 1 400px', minWidth: '300px' }}>
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
// 2/9 추가
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') {
// 2/6 중복이벤트 방지 코드 반영 by 김현득
                    e.preventDefault();
// 2/6 중복이벤트 방지 코드 반영 by 김현득 end
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
            <div style={{ flex: '1 1 100px', minWidth: '200px' }}>
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
                        href={`/${locale}/resources/blogs/${blog.slug || blog.id}`}
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