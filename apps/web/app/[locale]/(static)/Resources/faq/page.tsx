'use client';

import { useEffect, useState, useCallback } from 'react';
import { FAQCardCarousel } from '@/components/Resources/faq/FAQCardCarousel';
import { FAQAccordion } from '@/components/Resources/faq/FAQAccordion';
import { FAQSearchBar } from '@/components/Resources/faq/FAQSearchBar';
import { getPublicFAQs, getPublicFAQCategories } from '@/lib/faq/faqService';
import type { FAQ, FAQCategory } from '@/lib/admin/types';
import { getLocaleFromPath } from '@/lib/i18n/getLocale';

interface PageProps {
  params: Promise<{
    locale: string;
  }> | {
    locale: string;
  };
}

export default function FAQPage({ params }: PageProps) {
  const [locale, setLocale] = useState<string>('ko');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'accordion'>('card');
  const itemsPerPage = 10;

  useEffect(() => {
    // params가 Promise인지 확인
    if (params && typeof (params as any).then === 'function') {
      (params as Promise<{ locale: string }>)
        .then((p) => {
          setLocale(p.locale);
        })
        .catch((err) => {
          console.error('Failed to get locale from params:', err);
          // 기본값 유지
        });
    } else if (params && typeof params === 'object' && 'locale' in params) {
      // params가 이미 객체인 경우
      setLocale((params as { locale: string }).locale);
    }
  }, [params]);

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
      setError(err.message || 'FAQ를 불러오는데 실패했습니다.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [locale, selectedCategoryId, searchQuery, currentPage, itemsPerPage]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId, locale]);

  useEffect(() => {
    void loadFAQs();
  }, [loadFAQs]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      padding: '2rem 1rem',
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
      }}>
        {/* 헤더 */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1a1a1a',
            margin: 0,
          }}>
            FAQ
          </h1>
          <FAQSearchBar 
            onSearch={handleSearch}
            placeholder={locale === 'en' ? 'Search FAQs...' : 'FAQ 검색...'}
          />
        </div>

        {/* 카테고리 탭 */}
        {categories.length > 0 && (
          <div style={{ 
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            borderBottom: '2px solid #e5e5e5',
            paddingBottom: '1rem',
          }}>
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: selectedCategoryId === 'all' ? '#0070f3' : 'transparent',
                color: selectedCategoryId === 'all' ? 'white' : '#666',
                border: '1px solid',
                borderColor: selectedCategoryId === 'all' ? '#0070f3' : '#ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: selectedCategoryId === 'all' ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              {locale === 'en' ? 'All' : '전체'}
            </button>
            {categories.map((category) => {
              if (!category.id) return null;
              
              const categoryName = locale === 'en' && category.name.en 
                ? category.name.en 
                : category.name.ko;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id!)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: selectedCategoryId === category.id ? '#0070f3' : 'transparent',
                    color: selectedCategoryId === category.id ? 'white' : '#666',
                    border: '1px solid',
                    borderColor: selectedCategoryId === category.id ? '#0070f3' : '#ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: selectedCategoryId === category.id ? '600' : '400',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {categoryName}
                </button>
              );
            })}
          </div>
        )}

        {/* 뷰 모드 전환 버튼 */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
        }}>
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
            {locale === 'en' ? 'Accordion View' : '아코디언뷰'}
          </button>
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

        {/* 카드뷰 */}
        {!loading && !error && viewMode === 'card' && (
          <div style={{ marginBottom: '3rem' }}>
            <FAQCardCarousel faqs={faqs} locale={locale} />
          </div>
        )}

        {/* 아코디언뷰 */}
        {!loading && !error && viewMode === 'accordion' && (
          <div style={{ marginBottom: '3rem' }}>
            <FAQAccordion faqs={faqs} locale={locale} />
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
        {!loading && !error && faqs.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '2rem' 
          }}>
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
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {locale === 'en' ? 'Previous' : '이전'}
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
                    fontSize: '0.875rem',
                    fontWeight: page === currentPage ? '600' : '400',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === totalPages || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
                color: currentPage === totalPages || totalPages <= 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: currentPage === totalPages || totalPages <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {locale === 'en' ? 'Next' : '다음'}
            </button>
          </div>
        )}

        {/* 총 개수 표시 */}
        {!loading && !error && faqs.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '1rem', 
            color: '#666',
            fontSize: '0.875rem',
          }}>
            {locale === 'en' 
              ? `Total ${total} FAQs (Page ${currentPage} / ${totalPages})`
              : `총 ${total}개의 FAQ (페이지 ${currentPage} / ${totalPages})`
            }
          </div>
        )}
      </div>
    </div>
  );
}

