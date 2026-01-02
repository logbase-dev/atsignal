'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicWhatsNews } from '@/lib/product/whatsnew/whatsnewService';
import type { WhatsNew } from '@/lib/admin/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

interface PageProps {
  params: Promise<{
    locale: string;
  }> | {
    locale: string;
  };
}

export default function WhatsNewPage({ params }: PageProps) {
  const [locale, setLocale] = useState<string>('ko');
  const [whatsNews, setWhatsNews] = useState<WhatsNew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 검색 및 페이지네이션 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // 아코디언 상태
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    // params가 Promise인지 확인
    if (params && typeof (params as any).then === 'function') {
      (params as Promise<{ locale: string }>)
        .then((p) => {
          setLocale(p.locale);
        })
        .catch((err) => {
          console.error('Failed to get locale from params:', err);
        });
    } else if (params && typeof params === 'object' && 'locale' in params) {
      setLocale((params as { locale: string }).locale);
    }
  }, [params]);

  const loadWhatsNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[WhatsNew] API 호출 시작:', {
        search: searchQuery,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      const result = await getPublicWhatsNews({
        search: searchQuery || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      console.log('[WhatsNew] API 호출 성공:', result);

      // isTop이 true인 항목을 상단에, 나머지는 최신순으로 정렬
      const sortedItems = [...result.items].sort((a, b) => {
        // isTop 우선 정렬
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        
        // 같은 isTop 상태면 최신순 (createdAt 기준)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setWhatsNews(sortedItems);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Failed to load whats new:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || 'What\'s New를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    void loadWhatsNews();
  }, [loadWhatsNews]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      paddingBottom: '2rem'
    }}>

      <div className="hero">
        <div className="hero-container">
          <h1>atsignal What's new</h1>
          <p>설명 문구가 들어가는 곳입니다.</p>
          {/* <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p> */}
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 검색바 */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' }}>
            <input 
              type="text" 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              onKeyDown={handleKeyDown}
              placeholder={locale === 'en' ? 'Search updates...' : '검색...'}
              style={{ 
                flex: 1, 
                padding: '0.75rem 1rem', 
                border: '2px solid #e5e5e5', 
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#20BDFF';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e5e5';
              }}
            />
            <button 
              onClick={handleSearch}
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#20BDFF', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a9de6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#20BDFF';
              }}
            >
              {locale === 'en' ? 'Search' : '검색'}
            </button>
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                style={{ 
                  padding: '0.75rem 1rem', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                {locale === 'en' ? 'Clear' : '초기화'}
              </button>
            )}
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ 
            padding: '3rem 1rem', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <p>{locale === 'en' ? 'Loading updates...' : '업데이트를 불러오는 중...'}</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div style={{ 
            padding: '2rem 1rem', 
            textAlign: 'center', 
            color: '#dc3545',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #dc3545',
          }}>
            <p>{error}</p>
          </div>
        )}

        {/* 결과 개수 표시 */}
        {!loading && !error && (
          <div style={{ 
            marginBottom: '1rem',
            color: '#666',
            fontSize: '0.875rem',
          }}>
            {locale === 'en' 
              ? `Total ${total} What's new (Page ${currentPage} / ${totalPages})`
              : `총 ${total}개의 What's new (페이지 ${currentPage} / ${totalPages})`}
          </div>
        )}

        {/* WhatsNew 아코디언 리스트 */}
        {!loading && !error && (
          <div style={{ marginBottom: '3rem' }}>
            {whatsNews.length === 0 ? (
              <div style={{ 
                padding: '3rem 1rem', 
                textAlign: 'center', 
                color: '#666',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
              }}>
                <p>{searchQuery ? (locale === 'en' ? 'No updates found.' : '검색된 업데이트가 없습니다.') : (locale === 'en' ? 'No updates available.' : '업데이트가 없습니다.')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {whatsNews.map((item) => {
                  const isExpanded = expandedItems.has(item.id!);
                  const title = locale === 'en' && item.title.en ? item.title.en : item.title.ko;
                  const oneLiner = locale === 'en' && item.oneLiner.en ? item.oneLiner.en : item.oneLiner.ko;
                  const content = locale === 'en' && item.content.en ? item.content.en : item.content.ko;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: item.isTop ? '2px solid #20BDFF' : '1px solid #e5e5e5',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* 아코디언 헤더 */}
                      <div
                        onClick={() => toggleExpanded(item.id!)}
                        style={{
                          padding: '1.5rem',
                          cursor: 'pointer',
                          borderBottom: isExpanded ? '1px solid #e5e5e5' : 'none',
                          backgroundColor: item.isTop ? '#f0f9ff' : '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              {item.isTop && (
                                <span style={{
                                  backgroundColor: '#20BDFF',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                }}>
                                  {locale === 'en' ? 'PINNED' : '고정'}
                                </span>
                              )}
                              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                            <h3 style={{
                              fontSize: '1.25rem',
                              fontWeight: '600',
                              color: '#1a1a1a',
                              marginBottom: '0.5rem',
                              margin: 0,
                            }}>
                              {title}
                            </h3>
                            <p style={{
                              color: '#666',
                              fontSize: '1rem',
                              margin: 0,
                              lineHeight: '1.5',
                            }}>
                              {oneLiner}
                            </p>
                          </div>
                          <div style={{
                            fontSize: '1.5rem',
                            color: '#666',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}>
                            ▼
                          </div>
                        </div>
                      </div>

                      {/* 아코디언 내용 */}
                      {isExpanded && (
                        <div style={{
                          padding: '1.5rem',
                          backgroundColor: '#fafafa',
                        }}>
                          <div style={{
                            color: '#444',
                            lineHeight: '1.6',
                            fontSize: '1rem',
                          }}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSlug]}
                              components={{
                                p: ({ children }) => (
                                  <p style={{ margin: '0 0 1rem 0' }}>{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li style={{ margin: '0 0 0.5rem 0' }}>{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <strong style={{ fontWeight: '600', color: '#1a1a1a' }}>{children}</strong>
                                ),
                                code: ({ children }) => (
                                  <code style={{ 
                                    backgroundColor: '#f5f5f5', 
                                    padding: '0.125rem 0.375rem', 
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace'
                                  }}>{children}</code>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote style={{
                                    borderLeft: '4px solid #20BDFF',
                                    paddingLeft: '1rem',
                                    margin: '1rem 0',
                                    fontStyle: 'italic',
                                    color: '#555'
                                  }}>{children}</blockquote>
                                ),
                                table: ({ children }) => (
                                  <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse', 
                                    margin: '1rem 0',
                                    border: '1px solid #e5e5e5'
                                  }}>{children}</table>
                                ),
                                thead: ({ children }) => (
                                  <thead style={{ backgroundColor: '#f8f9fa' }}>{children}</thead>
                                ),
                                th: ({ children }) => (
                                  <th style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #e5e5e5',
                                    fontWeight: '600',
                                    textAlign: 'left',
                                    fontSize: '0.875rem'
                                  }}>{children}</th>
                                ),
                                td: ({ children }) => (
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #e5e5e5',
                                    fontSize: '0.875rem'
                                  }}>{children}</td>
                                ),
                              }}
                            >
                              {content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={loading || currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (loading || currentPage === 1) ? '#e5e7eb' : '#20BDFF',
              color: (loading || currentPage === 1) ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: (loading || currentPage === 1) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {locale === 'en' ? 'Previous' : '이전'}
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              // 현재 페이지 주변의 페이지만 표시
              const startPage = Math.max(1, currentPage - 5);
              const pageNum = startPage + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: pageNum === currentPage ? '#20BDFF' : '#fff',
                    color: pageNum === currentPage ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    minWidth: '2.5rem',
                    fontSize: '0.875rem',
                    fontWeight: pageNum === currentPage ? '600' : '500',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={loading || currentPage >= totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (loading || currentPage >= totalPages) ? '#e5e7eb' : '#20BDFF',
              color: (loading || currentPage >= totalPages) ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: (loading || currentPage >= totalPages) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {locale === 'en' ? 'Next' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}