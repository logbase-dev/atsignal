'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicGlossaries, getPublicGlossaryCategories } from '@/lib/resources/glossary/glossaryService';
import type { Glossary, GlossaryCategory } from '@/lib/admin/types';
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

  // 알파벳 목록
  const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

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
  }, [locale, selectedCategoryId, searchQuery, selectedLetter, currentPage]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadGlossaries();
  }, [loadGlossaries]);

  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1); // 초기화 시 첫 페이지로 이동
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      paddingBottom: '2rem'
    }}>

      <div className="hero-page">
        <div className="hero-page-container">
          <h1>atsignal Glossary</h1>
          <p>설명 문구가 들어가는 곳입니다.</p>
          {/* <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p> */}
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 검색 및 필터 */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '3rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          {/* 검색바 */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' }}>
              <input 
                type="text" 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder={locale === 'en' ? 'Search terms...' : '용어 검색...'}
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

          {/* 카테고리 필터 */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              textAlign: 'center',
              color: '#1a1a1a',
            }}>
              {locale === 'en' ? 'Browse by Category' : '카테고리별 보기'}
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.75rem', 
              justifyContent: 'center',
            }}>
              <button
                onClick={() => {
                  setSelectedCategoryId('all');
                  setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedCategoryId === 'all' ? '#20BDFF' : '#f5f5f5',
                  color: selectedCategoryId === 'all' ? 'white' : '#666',
                  border: '1px solid',
                  borderColor: selectedCategoryId === 'all' ? '#20BDFF' : '#ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: selectedCategoryId === 'all' ? '600' : '400',
                  transition: 'all 0.2s ease',
                }}
              >
                {locale === 'en' ? 'All Categories' : '전체 카테고리'}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategoryId(category.id!);
                    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: selectedCategoryId === category.id ? '#20BDFF' : '#f5f5f5',
                    color: selectedCategoryId === category.id ? 'white' : '#666',
                    border: '1px solid',
                    borderColor: selectedCategoryId === category.id ? '#20BDFF' : '#ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: selectedCategoryId === category.id ? '600' : '400',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {locale === 'en' && category.name.en ? category.name.en : category.name.ko}
                </button>
              ))}
            </div>
          </div>

          {/* 알파벳 필터 */}
          <div style={{ marginLeft: '4rem' }}>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}>
              {/* 전체 버튼 - 두 줄 높이만큼 크게 */}
              <button
                onClick={() => {
                  setSelectedLetter('all');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: selectedLetter === 'all' ? '#20BDFF' : '#f5f5f5',
                  color: selectedLetter === 'all' ? 'white' : '#666',
                  border: '1px solid',
                  borderColor: selectedLetter === 'all' ? '#20BDFF' : '#ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: selectedLetter === 'all' ? '600' : '400',
                  minWidth: '40px',
                  height: 'calc(2 * (1.1rem + 2 * 0.375rem + 2px) + 1rem)', // 버튼 두 개 높이 + 간격
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {locale === 'en' ? 'All' : '전체'}
              </button>
              
              {/* 영어/한글 버튼들 컨테이너 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                flex: 1,
              }}>
                {/* 알파벳 버튼들 */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'nowrap', 
                  gap: '0.25rem', 
                  justifyContent: 'flex-start',
                  overflowX: 'auto',
                  paddingBottom: '0.25rem',
                }}>
                  {alphabets.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => {
                        setSelectedLetter(letter);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '0.375rem 0.5rem',
                        backgroundColor: selectedLetter === letter ? '#20BDFF' : '#f5f5f5',
                        color: selectedLetter === letter ? 'white' : '#666',
                        border: '1px solid',
                        borderColor: selectedLetter === letter ? '#20BDFF' : '#ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: selectedLetter === letter ? '600' : '400',
                        minWidth: '32px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                
                {/* 한글 자음 버튼들 */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'nowrap', 
                  gap: '0.25rem', 
                  justifyContent: 'flex-start',
                  overflowX: 'auto',
                  paddingBottom: '0.25rem',
                }}>
                  {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map((consonant) => (
                    <button
                      key={consonant}
                      onClick={() => {
                        setSelectedLetter(consonant);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '0.375rem 0.5rem',
                        backgroundColor: selectedLetter === consonant ? '#20BDFF' : '#f5f5f5',
                        color: selectedLetter === consonant ? 'white' : '#666',
                        border: '1px solid',
                        borderColor: selectedLetter === consonant ? '#20BDFF' : '#ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: selectedLetter === consonant ? '600' : '400',
                        minWidth: '32px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {consonant}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ 
            padding: '3rem 1rem', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <p>{locale === 'en' ? 'Loading glossary...' : '용어사전을 불러오는 중...'}</p>
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

            {glossaries.length === 0 ? (
              <div style={{ 
                padding: '3rem 1rem', 
                textAlign: 'center', 
                color: '#666',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
              }}>
                <p>{searchQuery ? (locale === 'en' ? 'No terms found.' : '검색된 용어가 없습니다.') : (locale === 'en' ? 'No terms available.' : '용어가 없습니다.')}</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gap: '1rem',
                marginBottom: '2rem',
              }}>
                {glossaries.map((glossary) => {
                  const term = locale === 'en' && glossary.term.en 
                    ? glossary.term.en 
                    : glossary.term.ko;
                  const description = locale === 'en' && glossary.description.en 
                    ? glossary.description.en 
                    : glossary.description.ko;

                  return (
                    <div
                      key={glossary.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        border: '1px solid #e5e5e5',
                        transition: 'box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#20BDFF',
                        marginBottom: '0.75rem',
                        margin: 0,
                      }}>
                        {term}
                      </h3>
                      
                      <div style={{
                        color: '#666',
                        lineHeight: '1.6',
                        fontSize: '1rem',
                      }}>
                        {glossary.saveFormat === 'html' ? (
                          <div dangerouslySetInnerHTML={{ __html: description }} />
                        ) : (
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
                            {description}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  );
                })}
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