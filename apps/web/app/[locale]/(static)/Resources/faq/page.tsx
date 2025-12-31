'use client';

import { useEffect, useState, useCallback } from 'react';
import { FAQCardCarousel } from '@/components/Resources/faq/FAQCardCarousel';
import { FAQAccordion } from '@/components/Resources/faq/FAQAccordion';
import { FAQCardView } from '@/components/Resources/faq/FAQCardView';
import { getPublicFAQs, getPublicFAQCategories } from '@/lib/resources/faq/faqService';
import type { FAQ, FAQCategory } from '@/lib/admin/types';

interface PageProps {
  params: Promise<{
    locale: string;
  }> | {
    locale: string;
  };
}

export default function FAQPage({ params }: PageProps) {
  const [locale, setLocale] = useState<string>('ko');
  
  // 상단 고정 FAQ (캐러셀용)
  const [topFaqs, setTopFaqs] = useState<FAQ[]>([]);
  const [topFaqsLoading, setTopFaqsLoading] = useState(true);
  
  // 일반 FAQ (하단 리스트용)
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 및 필터
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // 입력값과 실제 검색값 분리
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'accordion'>('accordion');
  const itemsPerPage = 12;

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

  // 상단 고정 FAQ 로드 (isTop: true이면서 level이 낮은 순으로 4개)
  const loadTopFAQs = useCallback(async () => {
    setTopFaqsLoading(true);
    console.log('[loadTopFAQs] 시작, locale:', locale);
    try {
      const enabled = {
        ko: locale === 'ko',
        en: locale === 'en',
      };

      console.log('[loadTopFAQs] API 호출 시작, enabled:', enabled);
      const result = await getPublicFAQs({
        orderBy: 'isTop',
        orderDirection: 'desc', // isTop: true가 먼저 오도록
        page: 1,
        limit: 4, // 정확히 4개만 가져오기
        enabled,
      });

      console.log('[loadTopFAQs] API 호출 성공!');
      console.log('All FAQs loaded:', result.faqs.length);
      console.log('FAQs with isTop:', result.faqs.filter(faq => faq.isTop === true).length);

      // API에서 이미 isTop DESC, level ASC 순으로 정렬되어 옴
      // 상위 4개만 선택 (이미 limit: 4로 설정했지만 안전장치)
      const topFaqsFiltered = result.faqs.slice(0, 4);
      
      console.log('Final top FAQs:', topFaqsFiltered.length);
      console.log('Top FAQs data:', topFaqsFiltered);
      setTopFaqs(topFaqsFiltered);
    } catch (err: any) {
      console.error('[loadTopFAQs] API 호출 실패:', err);
      console.error('Error details:', err.message, err.stack);
      setTopFaqs([]);
    } finally {
      setTopFaqsLoading(false);
      console.log('[loadTopFAQs] 완료');
    }
  }, [locale]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getPublicFAQCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadFAQs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const enabled = {
        ko: locale === 'ko',
        en: locale === 'en',
      };

      const result = await getPublicFAQs({
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        search: searchQuery || undefined,
        orderBy: 'isTop',
        orderDirection: 'desc',
        page: currentPage,
        limit: itemsPerPage,
        enabled,
      });

      setFaqs(result.faqs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Failed to load FAQs:', err);
      setFaqs([]);
      setTotal(0);
      setTotalPages(1);
      setError(err.message || 'FAQ를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [locale, selectedCategoryId, searchQuery, currentPage, itemsPerPage]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadTopFAQs();
  }, [loadTopFAQs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId, locale]);

  useEffect(() => {
    void loadFAQs();
  }, [loadFAQs]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          {/* <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#1a1a1a',
            margin: '0 0 1rem 0',
          }}>
            FAQ
          </h1> */}
          {/* <p style={{
            fontSize: '1.125rem',
            color: '#666',
            margin: '0 0 2rem 0',
          }}>
            {locale === 'en' 
              ? 'Find answers to frequently asked questions' 
              : '자주 묻는 질문에 대한 답변을 찾아보세요'
            }
          </p> */}
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
              placeholder={locale === 'en' ? 'Search FAQs...' : 'FAQ 검색...'}
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
        </div>

        {/* 상단 고정 FAQ 캐러셀 */}
        {!topFaqsLoading && topFaqs.length > 0 && (
          <div style={{ marginBottom: '4rem' }}>
            {/* <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              {locale === 'en' ? 'Featured FAQs' : '주요 FAQ'}
            </h2> */}
            <FAQCardCarousel faqs={topFaqs} locale={locale} />
          </div>
        )}

        {/* 뷰 모드 전환 버튼 */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0,
          }}>
            {locale === 'en' ? 'All FAQs' : '전체 FAQ'}
            {!loading && !error && (
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '400',
                color: '#666',
                marginLeft: '0.5rem',
              }}>
                {locale === 'en' 
                  ? `${total} items, Page ${currentPage}/${totalPages}`
                  : `총 ${total}개의 FAQ (${currentPage}/${totalPages} 페이지)`
                }
              </span>
            )}
          </h3>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setViewMode('accordion')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'accordion' ? '#0070f3' : '#f5f5f5',
                color: viewMode === 'accordion' ? 'white' : '#666',
                border: '1px solid',
                borderColor: viewMode === 'accordion' ? '#0070f3' : '#ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: viewMode === 'accordion' ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              {locale === 'en' ? 'List View' : '리스트뷰'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'card' ? '#0070f3' : '#f5f5f5',
                color: viewMode === 'card' ? 'white' : '#666',
                border: '1px solid',
                borderColor: viewMode === 'card' ? '#0070f3' : '#ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: viewMode === 'card' ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              {locale === 'en' ? 'Card View' : '카드뷰'}
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && faqs.length === 0 && (
          <div style={{ 
            padding: '3rem 1rem', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <p>{locale === 'en' ? 'Loading FAQs...' : 'FAQ를 불러오는 중...'}</p>
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

        {/* FAQ 리스트 */}
        {!loading && !error && (
          <div style={{ marginBottom: '3rem' }}>
            {viewMode === 'accordion' ? (
              <FAQAccordion faqs={faqs} locale={locale} />
            ) : (
              <FAQCardView faqs={faqs} locale={locale} />
            )}
          </div>
        )}

        {/* FAQ가 없을 때 */}
        {!loading && !error && faqs.length === 0 && (
          <div style={{ 
            padding: '3rem 1rem', 
            textAlign: 'center', 
            color: '#666',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
          }}>
            <p>{searchQuery ? (locale === 'en' ? 'No FAQs found.' : '검색된 FAQ가 없습니다.') : (locale === 'en' ? 'No FAQs available.' : 'FAQ가 없습니다.')}</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && !error && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '3rem' 
          }}>
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: currentPage === 1 || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
                color: currentPage === 1 || totalPages <= 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentPage === 1 || totalPages <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                minWidth: '80px',
              }}
            >
              {locale === 'en' ? 'Previous' : '이전'}
            </button>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {/* 첫 페이지 */}
              {currentPage > 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      minWidth: '45px',
                      fontSize: '0.875rem',
                    }}
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span style={{ 
                      padding: '0.75rem 0.5rem', 
                      color: '#666',
                      fontSize: '0.875rem',
                    }}>
                      ...
                    </span>
                  )}
                </>
              )}

              {/* 현재 페이지 주변 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page >= Math.max(1, currentPage - 2) && 
                  page <= Math.min(totalPages, currentPage + 2)
                )
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: page === currentPage ? '#0070f3' : '#fff',
                      color: page === currentPage ? 'white' : '#333',
                      border: '1px solid',
                      borderColor: page === currentPage ? '#0070f3' : '#ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      minWidth: '45px',
                      fontSize: '0.875rem',
                      fontWeight: page === currentPage ? '600' : '400',
                    }}
                  >
                    {page}
                  </button>
                ))}

              {/* 마지막 페이지 */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span style={{ 
                      padding: '0.75rem 0.5rem', 
                      color: '#666',
                      fontSize: '0.875rem',
                    }}>
                      ...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      minWidth: '45px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || totalPages <= 1}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: currentPage >= totalPages || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
                color: currentPage >= totalPages || totalPages <= 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentPage >= totalPages || totalPages <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                minWidth: '80px',
              }}
            >
              {locale === 'en' ? 'Next' : '다음'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

