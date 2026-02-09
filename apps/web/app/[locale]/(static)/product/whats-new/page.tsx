'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicWhatsNews } from '@/lib/product/whatsnew/whatsnewService';
import type { WhatsNew } from '@/lib/admin/types';
import { WhatsNewSearch } from '@/components/product/whatsnew/WhatsNewSearch';
import { WhatsNewAccordion } from '@/components/product/whatsnew/WhatsNewAccordion';
import { WhatsNewPagination } from '@/components/product/whatsnew/WhatsNewPagination';
import Image from 'next/image';
import { sendGAEvent } from '@next/third-parties/google';

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
  // 오전8:25에 아래로 변경하여 추가
    sendGAEvent(
      "event", 'search', {
      search_term: searchInput,
      page_path: window.location.pathname, // 추가 라인 2/9
    });
  // 오전8:25 변경분 end
    setSearchQuery(searchInput);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
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
              src="/images/whatsnew_image.jpg"
              alt="atsignal whatsnew"
              width={0}
              height={0}
              sizes="20vw"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              priority
            />
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>atsignal What's new</h1>
            <p>atsignal의 새로운 기능 추가 및 개선사항과 관련된 내용을 알려드립니다.</p>
            {/* <p>추가문구가 들어갑니다.</p> */}
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 검색바 */}
        <WhatsNewSearch
          locale={locale}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />

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
              <WhatsNewAccordion
                locale={locale}
                whatsNews={whatsNews}
                expandedItems={expandedItems}
                onToggleExpanded={toggleExpanded}
              />
            )}
          </div>
        )}

        {/* 페이지네이션 */}
        <WhatsNewPagination
          locale={locale}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          loading={loading}
          error={error}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}