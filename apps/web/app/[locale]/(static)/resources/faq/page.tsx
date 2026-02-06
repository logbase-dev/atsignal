'use client';

import { useEffect, useState, useCallback } from 'react';
import { FAQCardCarousel } from '@/components/resources/faq/FAQCardCarousel';
import { FAQAccordion } from '@/components/resources/faq/FAQAccordion';
import { FAQCardView } from '@/components/resources/faq/FAQCardView';
import { getPublicFAQs, getPublicFAQCategories } from '@/lib/resources/faq/faqService';
import type { FAQ, FAQCategory } from '@/lib/admin/types';
import Image from 'next/image';
// 2/6 오후3:15 김현득 추가
import { sendGAEvent } from '@next/third-parties/google';
// 2/6 오후3:15 김현득 추가 end

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
  // 2/6 오후3:00 김현득 추가
    sendGAEvent(
      "event", 'search', {
      search_term: searchInput,
    });
  // 2/6 오후3:00 김현득 추가 end
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCategoryId('all'); // 카테고리 필터도 초기화
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
            marginTop: '-1rem' // 이미지만 더 위로 올림
          }}>
            <Image
              src="/images/faq_image.jpg"
              alt="atsignal faq"
              width={0}
              height={0}
              sizes="20vw"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              priority
            />
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>atsignal FAQ</h1>
            <p>많은 분들이 atsignal에 대하여 궁금해하는 항목을 정리해두었습니다.</p>
            {/* <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p> */}
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 상단 고정 FAQ 캐러셀 */}
        {!topFaqsLoading && topFaqs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
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

        {/* 검색 및 필터 섹션 */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '1.5rem',
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
            <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                {locale === 'en' ? 'Search' : '검색'}
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={locale === 'en' ? 'Search by question or answer' : '질문이나 답변으로 검색하세요'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#20BDFF';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              />
            </div>

            {/* 카테고리 필터 */}
            <div style={{ flex: '0 1 200px', minWidth: '150px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                {locale === 'en' ? 'Category' : '카테고리'}
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="all">{locale === 'en' ? 'All' : '전체'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {locale === 'en' ? category.name?.en || category.name?.ko : category.name?.ko || category.name?.en}
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
                {locale === 'en' ? 'Search' : '검색'}
              </button>
              <button
                type="button"
                onClick={handleClearSearch}
                disabled={!searchQuery && selectedCategoryId === 'all'}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: (!searchQuery && selectedCategoryId === 'all') ? '#e5e7eb' : '#6b7280',
                  color: (!searchQuery && selectedCategoryId === 'all') ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!searchQuery && selectedCategoryId === 'all') ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {locale === 'en' ? 'Reset' : '초기화'}
              </button>
            </div>
          </div>
        </div>

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

