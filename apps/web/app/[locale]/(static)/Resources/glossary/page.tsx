'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicGlossaries, getPublicGlossaryCategories } from '@/lib/glossary/glossaryService';
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

  // 알파벳 목록
  const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

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

      const result = await getPublicGlossaries({
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        search: searchQuery || undefined,
        initialLetter: selectedLetter !== 'all' ? selectedLetter : undefined,
        orderBy: 'term',
        orderDirection: 'asc',
        page: 1,
        limit: 1000, // 모든 용어를 가져와서 클라이언트에서 처리
        enabled,
      });

      setGlossaries(result.glossaries);
    } catch (err: any) {
      console.error('Failed to load glossaries:', err);
      setError(err.message || '용어사전을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [locale, selectedCategoryId, searchQuery, selectedLetter]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadGlossaries();
  }, [loadGlossaries]);

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

  // 카테고리별로 용어 그룹화
  const groupedGlossaries = glossaries.reduce((acc, glossary) => {
    const categoryId = glossary.categoryId || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(glossary);
    return acc;
  }, {} as Record<string, Glossary[]>);

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
                onClick={() => setSelectedCategoryId('all')}
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
                  onClick={() => setSelectedCategoryId(category.id!)}
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
          <div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              textAlign: 'center',
              color: '#1a1a1a',
            }}>
              {locale === 'en' ? 'A–Z Index' : 'A–Z 색인'}
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem', 
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setSelectedLetter('all')}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: selectedLetter === 'all' ? '#20BDFF' : '#f5f5f5',
                  color: selectedLetter === 'all' ? 'white' : '#666',
                  border: '1px solid',
                  borderColor: selectedLetter === 'all' ? '#20BDFF' : '#ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: selectedLetter === 'all' ? '600' : '400',
                  minWidth: '40px',
                  transition: 'all 0.2s ease',
                }}
              >
                {locale === 'en' ? 'All' : '전체'}
              </button>
              {alphabets.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: selectedLetter === letter ? '#20BDFF' : '#f5f5f5',
                    color: selectedLetter === letter ? 'white' : '#666',
                    border: '1px solid',
                    borderColor: selectedLetter === letter ? '#20BDFF' : '#ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: selectedLetter === letter ? '600' : '400',
                    minWidth: '40px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {letter}
                </button>
              ))}
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
            {Object.keys(groupedGlossaries).length === 0 ? (
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
              Object.entries(groupedGlossaries).map(([categoryId, categoryGlossaries]) => {
                const category = categories.find(c => c.id === categoryId);
                const categoryName = categoryId === 'uncategorized' 
                  ? (locale === 'en' ? 'Uncategorized' : '미분류')
                  : (locale === 'en' && category?.name.en ? category.name.en : category?.name.ko || '');

                return (
                  <div key={categoryId} style={{ marginBottom: '3rem' }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '1.5rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #20BDFF',
                    }}>
                      {categoryName}
                    </h2>
                    
                    <div style={{ 
                      display: 'grid',
                      gap: '1rem',
                    }}>
                      {categoryGlossaries.map((glossary) => {
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
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}