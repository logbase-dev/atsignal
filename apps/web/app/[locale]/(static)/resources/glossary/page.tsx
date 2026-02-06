'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicGlossaries, getPublicGlossaryCategories } from '@/lib/resources/glossary/glossaryService';
import type { Glossary, GlossaryCategory } from '@/lib/admin/types';
import { GlossarySearch } from '@/components/resources/glossary/GlossarySearch';
import { GlossaryList } from '@/components/resources/glossary/GlossaryList';
import Image from 'next/image';
// 2/6 19:55 김현득 추가
import { sendGAEvent } from '@next/third-parties/google';
// 2/6 19:55 김현득 추가 end

interface PageProps {
  params: Promise<{
    locale: string;
  }> | {
    locale: string;
  };
}

export default function GlossaryPage({ params }: PageProps) {
  const [locale, setLocale] = useState<string>('ko');
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [categories, setCategories] = useState<GlossaryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // 검색 핸들러
// // 아래는 2/6 20:17경 코멘트 처리 by 김현득
//  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//    if (e.key === 'Enter') handleSearch();
//  };
// 아래는 2/6 20:17경 반영 by 김현득
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
// 2/6 20:17경 반영 by 김현득 end
    }
  };

  // 한글 자음별 해당 글자 범위 정의
  const getKoreanCharRange = (consonant: string): [string, string] => {
    const ranges: { [key: string]: [string, string] } = {
      'ㄱ': ['가', '깋'],
      'ㄴ': ['나', '닣'],
      'ㄷ': ['다', '딯'],
      'ㄹ': ['라', '맇'],
      'ㅁ': ['마', '밓'],
      'ㅂ': ['바', '빟'],
      'ㅅ': ['사', '싷'],
      'ㅇ': ['아', '잏'],
      'ㅈ': ['자', '짛'],
      'ㅊ': ['차', '칳'],
      'ㅋ': ['카', '킿'],
      'ㅌ': ['타', '팋'],
      'ㅍ': ['파', '핗'],
      'ㅎ': ['하', '힣'],
    };
    return ranges[consonant] || ['', ''];
  };

  // 한글 자음으로 시작하는지 확인하는 함수
  const startsWithKoreanConsonant = (text: string, consonant: string): boolean => {
    if (!text || text.length === 0) return false;
    const firstChar = text.charAt(0);
    const [start, end] = getKoreanCharRange(consonant);
    return firstChar >= start && firstChar <= end;
  };

  // 영문자로 시작하는지 확인하는 함수 (실제 용어의 첫 글자 확인)
  const startsWithEnglishLetter = (glossary: any, letter: string): boolean => {
    // 한국어 우선, 없으면 영어 확인
    const term = locale === 'ko' ? (glossary.term.ko || glossary.term.en || '') : (glossary.term.en || glossary.term.ko || '');
    if (!term || term.length === 0) return false;
    
    const firstChar = term.charAt(0);
    // 영문자인지 확인하고 대소문자 비교
    return /[a-zA-Z]/.test(firstChar) && firstChar.toUpperCase() === letter.toUpperCase();
  };

  // 한글 자음인지 확인하는 함수
  const isKoreanConsonant = (char: string): boolean => {
    return /[ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ]/.test(char);
  };

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

  const loadCategories = useCallback(async () => {
    try {
      const data = await getPublicGlossaryCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadGlossaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const enabled = {
        ko: locale === 'ko',
        en: locale === 'en',
      };

      // 모든 데이터를 가져온 후 클라이언트에서 필터링
      const result = await getPublicGlossaries({
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        search: searchQuery || undefined,
        orderBy: 'term',
        orderDirection: 'asc',
        page: 1, // 모든 데이터를 가져오기 위해 페이지 1부터
        limit: 10000, // 충분히 큰 값으로 설정
        enabled,
      });

      let filteredGlossaries = result.glossaries;

      // 클라이언트 측 initialLetter 필터링
      if (selectedLetter !== 'all') {
        if (isKoreanConsonant(selectedLetter)) {
          // 한글 자음 필터링
          filteredGlossaries = filteredGlossaries.filter(glossary => 
            startsWithKoreanConsonant(glossary.term.ko || '', selectedLetter)
          );
        } else {
          // 영문자 필터링
          // 기존 방식: initialLetter 필드 사용 (주석처리 - 한글 용어가 영문자로 잘못 매핑되는 문제로 인해 사용 중단)
          // 예: "오류 응답"이라는 한글 용어가 initialLetter: "A"로 저장되어 영문 A 검색에 포함되는 문제
          // filteredGlossaries = filteredGlossaries.filter(glossary => 
          //   glossary.initialLetter === selectedLetter.toUpperCase()
          // );
          
          // 새로운 방식: 실제 용어의 첫 글자를 직접 확인하여 영문자만 필터링
          filteredGlossaries = filteredGlossaries.filter(glossary => 
            startsWithEnglishLetter(glossary, selectedLetter)
          );
        }
      }

      // 클라이언트 측 페이지네이션
      const total = filteredGlossaries.length;
      const totalPages = Math.ceil(total / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedGlossaries = filteredGlossaries.slice(startIndex, endIndex);

      setGlossaries(paginatedGlossaries);
      setTotalPages(totalPages || 1);
      setTotalCount(total || 0);
    } catch (err: any) {
      console.error('Failed to load glossaries:', err);
      setError(err.message || '용어사전을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [locale, selectedCategoryId, searchQuery, selectedLetter, currentPage, itemsPerPage]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadGlossaries();
  }, [loadGlossaries]);

  const handleSearch = () => {
// 2/6 20:00 김현득 추가
    sendGAEvent(
      "event", 'search', {
      search_term: searchInput,
    });
// 2/6 20:00 김현득 추가 end
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1); // 초기화 시 첫 페이지로 이동
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
              src="/images/glossary_image.jpg"
              alt="atsignal glossary"
              width={0}
              height={0}
              sizes="20vw"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              priority
            />
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>atsignal Glossary</h1>
            <p>Analytics 전반에서 사용되는 다양한 용어들을 정리하였습니다.</p>
            <p>관련 문서가 존재하는 경우 해당 링크를 선택하시면 좀더 구체적인 사례를 보실 수 있습니다.</p>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 검색 및 필터 */}
        <GlossarySearch
          locale={locale}
          categories={categories}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchQuery={searchQuery}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setCurrentPage(1);
          }}
          selectedLetter={selectedLetter}
          setSelectedLetter={(letter) => {
            setSelectedLetter(letter);
            setCurrentPage(1);
          }}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />

        {/* 로딩 및 에러 상태 처리 */}
        {(loading || error) && (
          <GlossaryList
            locale={locale}
            glossaries={[]}
            categories={categories}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
          />
        )}

        {/* 용어사전 목록 */}
        {!loading && !error && (
          <div>
            {/* 결과 요약 */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1rem 1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>
                {locale === 'en' 
                  ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} terms`
                  : `총 ${totalCount}개 중 ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)}개 표시`
                }
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>
                {locale === 'en' 
                  ? `Page ${currentPage} of ${totalPages}`
                  : `${totalPages}페이지 중 ${currentPage}페이지`
                }
              </div>
            </div>

            <GlossaryList
              locale={locale}
              glossaries={glossaries}
              categories={categories}
              loading={false}
              error={null}
              searchQuery={searchQuery}
            />

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
                onClick={() => setCurrentPage(currentPage - 1)}
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
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
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
        )}
      </div>
    </div>
  );
}