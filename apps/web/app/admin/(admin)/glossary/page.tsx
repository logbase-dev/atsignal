'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getGlossaries, deleteGlossary, type GetGlossariesResponse } from '@/lib/admin/glossaryService';
import { getGlossaryCategories } from '@/lib/admin/glossaryCategoryService';
import { GlossaryCategoryModal } from '@/components/admin/glossary/GlossaryCategoryModal';
import type { Glossary, GlossaryCategory } from '@/lib/admin/types';
import { getAdminApiUrl } from '@/lib/admin/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import rehypeSlug from 'rehype-slug';

const ToastViewer = dynamic(() => import('@toast-ui/react-editor').then((mod) => mod.Viewer), { ssr: false });

const DEFAULT_ITEMS_PER_PAGE = 20;
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function AdminGlossaryPage() {
  const router = useRouter();
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [categories, setCategories] = useState<GlossaryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [expandedGlossaryId, setExpandedGlossaryId] = useState<string | null>(null);
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set(['A'])); // 기본적으로 A 그룹 펼침
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로드 여부 추적

  useEffect(() => {
    void loadCategories();
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setIsInitialLoad(false); // 검색/필터링 시에는 초기 로드가 아님
    void loadGlossaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, searchQuery, itemsPerPage]);

  useEffect(() => {
    void loadGlossaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingLink = document.querySelector('link[href*="toastui-editor-viewer.css"]');
      if (!existingLink) {
        // @ts-ignore
        require('@toast-ui/editor/dist/toastui-editor-viewer.css');
      }
    }
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await fetch(getAdminApiUrl('admins'), { credentials: 'include' });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const adminMap = new Map<string, { name: string; username: string }>();
        (data.admins || []).forEach((admin: { id?: string; name: string; username: string }) => {
          if (admin.id) adminMap.set(admin.id, { name: admin.name, username: admin.username });
        });
        setAdmins(adminMap);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getGlossaryCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadGlossaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: GetGlossariesResponse = await getGlossaries({
        categoryId: selectedCategoryId === '__no_category__' ? '__no_category__' : selectedCategoryId || undefined,
        search: searchQuery || undefined,
        locale: 'ko',
        page: currentPage,
        limit: itemsPerPage,
      });

      setGlossaries(result.items);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);

      // 초기 로드 시에만 첫 번째 알파벳 그룹 자동 펼침
      // 검색/필터링 시에는 사용자가 설정한 상태를 유지
      if (isInitialLoad && result.items.length > 0) {
        const firstLetter = result.items[0].initialLetter;
        setExpandedLetters((prev) => new Set([...prev, firstLetter]));
        setIsInitialLoad(false); // 초기 로드 완료
      }
    } catch (err: any) {
      console.error('Failed to load glossaries:', err);
      setError(err.message || '용어사전을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteGlossary(id);
      await loadGlossaries();
    } catch (err) {
      console.error('Failed to delete glossary:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleEdit = (glossary: Glossary) => {
    if (glossary.id) router.push(`/admin/glossary/${glossary.id}`);
  };

  const handleCreate = () => {
    router.push('/admin/glossary/new');
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleLetterGroup = (letter: string) => {
    setExpandedLetters((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  // 알파벳별로 그룹화
  const groupedGlossaries = useMemo(() => {
    const groups: { [key: string]: Glossary[] } = {};
    glossaries.forEach((glossary) => {
      const letter = glossary.initialLetter;
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(glossary);
    });
    return groups;
  }, [glossaries]);

  // 알파벳 순서로 정렬
  const sortedLetters = useMemo(() => {
    return Object.keys(groupedGlossaries).sort();
  }, [groupedGlossaries]);

  // 페이지네이션 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  if (loading && glossaries.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>용어사전 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            카테고리 관리
          </button>
          <button
            onClick={handleCreate}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            용어 추가
          </button>
        </div>
      </div>

      {/* 검색 섹션 - 카드 형식 */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem' }}>
              카테고리 필터
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: '#fff',
                fontSize: '0.875rem',
              }}
            >
              <option value="">전체</option>
              <option value="__no_category__">미분류</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name.ko}
                  {category.name.en && ` / ${category.name.en}`}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem' }}>
              용어명/설명 검색
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="검색어를 입력하세요"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: '#fff',
                  fontSize: '0.875rem',
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                검색
              </button>
              <button
                onClick={handleClearSearch}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            color: '#856404',
          }}
        >
          <strong>경고:</strong> {error}
        </div>
      ) : null}

      {/* 총 항목 수 표시 및 페이지당 표시 - 상단 */}
      {totalItems > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              color: '#666',
            }}
          >
            총 {totalItems}개의 용어 (페이지 {currentPage} / {totalPages})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>페이지당 표시:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              style={{
                padding: '0.375rem 0.5rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}개
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {glossaries.length === 0 && !loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>
            {searchQuery || selectedCategoryId
              ? '검색된 용어가 없습니다.'
              : '용어가 없습니다. 위의 "용어 추가" 버튼으로 새 용어를 생성하세요.'}
          </p>
        </div>
      ) : (
        <>
          {/* 아코디언 형태의 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {sortedLetters.map((letter) => {
              const letterGlossaries = groupedGlossaries[letter];
              const isExpanded = expandedLetters.has(letter);

              return (
                <div key={letter} style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  {/* 알파벳 그룹 헤더 */}
                  <div
                    onClick={() => toggleLetterGroup(letter)}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderBottom: '1px solid #e5e5e5',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{letter}</h2>
                    <span style={{ fontSize: '1rem', color: '#666' }}>
                      {isExpanded ? '▼' : '▶'} {letterGlossaries.length}개
                    </span>
                  </div>

                  {/* 알파벳 그룹 내용 */}
                  {isExpanded && (
                    <div style={{ backgroundColor: '#fff' }}>
                      {letterGlossaries.map((glossary) => {
                        const category = categories.find((c) => c.id === glossary.categoryId);
                        const isExpandedItem = expandedGlossaryId === glossary.id;

                        return (
                          <div
                            key={glossary.id}
                            style={{
                              padding: '1rem 1.5rem',
                              borderBottom: '1px solid #e5e5e5',
                              backgroundColor: '#fff',
                              ...(letterGlossaries.indexOf(glossary) === letterGlossaries.length - 1
                                ? { borderBottom: 'none' }
                                : {}),
                            }}
                          >
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.5rem',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  setExpandedGlossaryId(isExpandedItem ? null : (glossary.id || null))
                                }
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    transition: 'transform 0.2s ease',
                                    transform: isExpandedItem ? 'rotate(180deg)' : 'rotate(0deg)',
                                    flexShrink: 0,
                                  }}
                                >
                                  ▼
                                </span>
                                <h3
                                  style={{
                                    margin: 0,
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    flex: 1,
                                    color: '#2563eb',
                                  }}
                                >
                                  {glossary.term.ko}
                                  {glossary.term.en && (
                                    <span style={{ color: '#666', marginLeft: '0.5rem', fontSize: '1rem', fontWeight: 'normal' }}>
                                      / {glossary.term.en}
                                    </span>
                                  )}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(glossary);
                                    }}
                                    style={{
                                      padding: '0.375rem 0.75rem',
                                      backgroundColor: '#666',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleDelete(glossary.id!);
                                    }}
                                    style={{
                                      padding: '0.375rem 0.75rem',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>

                              <div
                                data-answer
                                style={{
                                  display: isExpandedItem ? 'block' : 'none',
                                  marginTop: '0.75rem',
                                  paddingTop: '0.75rem',
                                  borderTop: '1px solid #e5e5e5',
                                  color: '#666',
                                  lineHeight: '1.6',
                                  transition: 'opacity 0.2s ease',
                                  opacity: isExpandedItem ? 1 : 0,
                                }}
                              >
                                {glossary.description.ko && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    {glossary.editorType === 'toast' ? (
                                      <ToastViewer initialValue={glossary.description.ko} />
                                    ) : (
                                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                                        {glossary.description.ko}
                                      </ReactMarkdown>
                                    )}
                                  </div>
                                )}
                                {glossary.description.en && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                                      (English)
                                    </h4>
                                    {glossary.editorType === 'toast' ? (
                                      <ToastViewer initialValue={glossary.description.en} />
                                    ) : (
                                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                                        {glossary.description.en}
                                      </ReactMarkdown>
                                    )}
                                  </div>
                                )}

                                {glossary.relatedLinks && glossary.relatedLinks.length > 0 && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                                      관련 문서
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                      {glossary.relatedLinks.map((link, idx) => (
                                        <a
                                          key={idx}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            padding: '0.375rem 0.75rem',
                                            backgroundColor: '#eff6ff',
                                            color: '#2563eb',
                                            border: '1px solid #2563eb',
                                            borderRadius: '0.25rem',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                          }}
                                        >
                                          {link.title || link.url} ({link.linkType})
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid #e5e5e5',
                                fontSize: '0.875rem',
                                color: '#666',
                              }}
                            >
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                                {category && (
                                  <span>
                                    카테고리: <strong>{category.name.ko}</strong>
                                  </span>
                                )}
                                {glossary.views !== undefined && (
                                  <span>
                                    조회수: <strong>{glossary.views}</strong>
                                  </span>
                                )}
                                {glossary.createdAt && (
                                  <span>
                                    작성일: <strong>{new Date(glossary.createdAt).toLocaleDateString('ko-KR')}</strong>
                                  </span>
                                )}
                                {glossary.createdBy && admins.has(glossary.createdBy) && (
                                  <span>
                                    작성자: <strong>{admins.get(glossary.createdBy)?.name || '알 수 없음'}</strong>
                                  </span>
                                )}
                                {glossary.updatedBy && admins.has(glossary.updatedBy) && (
                                  <span>
                                    수정자: <strong>{admins.get(glossary.updatedBy)?.name || '알 수 없음'}</strong>
                                  </span>
                                )}
                                <span>
                                  활성화:{' '}
                                  {glossary.enabled.ko && <span style={{ color: '#28a745' }}>KO</span>}
                                  {glossary.enabled.ko && glossary.enabled.en && (
                                    <span style={{ margin: '0 0.25rem' }}>/</span>
                                  )}
                                  {glossary.enabled.en && <span style={{ color: '#28a745' }}>EN</span>}
                                  {!glossary.enabled.ko && !glossary.enabled.en && (
                                    <span style={{ color: '#dc3545' }}>비활성화</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 - 항상 표시 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
            }}
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalPages <= 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 1 || totalPages <= 1 ? '#e5e7eb' : '#fff',
                color: currentPage === 1 || totalPages <= 1 ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: currentPage === 1 || totalPages <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
              }}
            >
              이전
            </button>

            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => {
              // 현재 페이지 주변 2페이지씩만 표시
              if (
                totalPages <= 1 ||
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => totalPages > 1 && handlePageChange(page)}
                    disabled={totalPages <= 1}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: page === currentPage ? '#0070f3' : totalPages <= 1 ? '#e5e7eb' : '#fff',
                      color: page === currentPage ? '#fff' : totalPages <= 1 ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      cursor: totalPages <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: page === currentPage ? 'bold' : 'normal',
                    }}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return (
                  <span key={page} style={{ padding: '0.5rem', color: '#666' }}>
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || totalPages <= 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage >= totalPages || totalPages <= 1 ? '#e5e7eb' : '#fff',
                color: currentPage >= totalPages || totalPages <= 1 ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: currentPage >= totalPages || totalPages <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
              }}
            >
              다음
            </button>
          </div>
        </>
      )}

      <GlossaryCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          void loadCategories();
        }}
      />
    </div>
  );
}

