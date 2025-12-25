'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFAQs, getFAQsWithPagination, deleteFAQ, getAllTags, type FAQResult } from '@/lib/admin/faqService';
import { getFAQCategories } from '@/lib/admin/faqCategoryService';
import { FAQCategoryModal } from '@/components/faq/FAQCategoryModal';
import type { FAQ, FAQCategory } from '@/lib/admin/types';
import { markdownToHtml } from '@/lib/utils/markdown';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

const ITEMS_PER_PAGE = 20; // 페이지당 FAQ 개수

export default function FAQPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchInput, setSearchInput] = useState(''); // 입력값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색에 사용할 값
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [hoveredFAQId, setHoveredFAQId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map()); // 관리자 정보 Map
  
  // 페이지네이션 상태 (서버 측)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot[]>([]); // 이전 페이지로 돌아가기용
  
  // 클라이언트 측 페이지네이션 상태 (검색어가 있을 때 사용)
  const [currentPage, setCurrentPage] = useState(1);
  const [allFilteredFAQs, setAllFilteredFAQs] = useState<FAQ[]>([]); // 검색어가 있을 때 모든 FAQ 저장

  useEffect(() => {
    loadCategories();
    loadAllTags();
    loadAdmins();
  }, []);

  // 관리자 목록 로드
  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/admins');
      if (response.ok) {
        const data = await response.json();
        // 관리자 ID를 키로 하는 Map 생성
        const adminMap = new Map<string, { name: string; username: string }>();
        data.admins.forEach((admin: { id?: string; name: string; username: string }) => {
          if (admin.id) {
            adminMap.set(admin.id, { name: admin.name, username: admin.username });
          }
        });
        setAdmins(adminMap);
      }
    } catch (error: any) {
      console.error('Failed to load admins:', error);
      // 관리자 정보 로드 실패해도 FAQ 목록은 표시
    }
  };

  // debounce useEffect 제거

  // 필터/검색 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setLastDoc(undefined);
    setPageHistory([]);
    setCurrentPage(1);
    setAllFilteredFAQs([]);
    loadFAQs();
    loadAllTags();
  }, [selectedCategoryId, searchQuery, selectedTags]);

  const loadCategories = async () => {
    try {
      const data = await getFAQCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadAllTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (error: any) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadFAQs = async (loadMore: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      // 검색어가 있으면 클라이언트 측 페이지네이션 사용 (모든 데이터 가져오기)
      if (searchQuery) {
        const data = await getFAQs({
          categoryId: selectedCategoryId === '__no_category__' ? '__no_category__' : (selectedCategoryId || undefined),
          search: searchQuery || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        });
        setAllFilteredFAQs(data);
        // useEffect에서 슬라이싱 처리하므로 여기서는 저장만
      } else {
        // 검색어가 없으면 서버 측 페이지네이션 사용
        const result: FAQResult = await getFAQsWithPagination({
          categoryId: selectedCategoryId === '__no_category__' ? '__no_category__' : (selectedCategoryId || undefined),
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          limit: ITEMS_PER_PAGE,
          lastDoc: loadMore ? lastDoc : undefined,
        });
        
        if (loadMore && lastDoc) {
          // 더 보기: 기존 FAQ에 추가
          setFaqs((prev) => [...prev, ...result.faqs]);
        } else {
          // 새로 로드: 기존 FAQ 교체
          setFaqs(result.faqs);
        }
        
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        if (result.lastDoc && !loadMore) {
          // 첫 페이지 로드 시 히스토리 초기화
          setPageHistory([]);
        }
      }
    } catch (error: any) {
      console.error('Failed to load FAQs:', error);
      setError(error.message || 'FAQ를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 검색어가 있을 때 클라이언트 측 페이지네이션 처리
  useEffect(() => {
    if (searchQuery && allFilteredFAQs.length > 0) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setFaqs(allFilteredFAQs.slice(startIndex, endIndex));
    } else if (searchQuery && allFilteredFAQs.length === 0) {
      // 검색 결과가 없을 때
      setFaqs([]);
    }
  }, [currentPage, allFilteredFAQs, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deleteFAQ(id);
      // 필터/검색 상태 유지하며 첫 페이지로 리셋
      setLastDoc(undefined);
      setPageHistory([]);
      setCurrentPage(1);
      setAllFilteredFAQs([]);
      await loadFAQs();
      await loadAllTags(); // 추가: 태그 목록도 새로고침
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      alert('삭제에 실패했습니다.');
    }
  };
  
  // 서버 측 페이지네이션: 다음 페이지 로드
  const handleLoadMore = () => {
    if (hasMore && lastDoc) {
      setPageHistory((prev) => [...prev, lastDoc!]);
      loadFAQs(true);
      // 스크롤을 목록 상단으로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // 서버 측 페이지네이션: 이전 페이지로 이동 (현재는 첫 페이지로만)
  const handleResetPagination = () => {
    setLastDoc(undefined);
    setPageHistory([]);
    loadFAQs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 클라이언트 측 페이지네이션: 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 검색어가 있을 때 총 페이지 수 계산
  const totalPages = searchQuery ? Math.ceil(allFilteredFAQs.length / ITEMS_PER_PAGE) : 0;
  const clientHasMore = searchQuery && currentPage < totalPages;

  const handleEdit = (faq: FAQ) => {
    if (faq.id) {
      router.push(`/faq/${faq.id}`);
    }
  };

  const handleCreate = () => {
    router.push('/faq/new');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearTagFilter = () => {
    setSelectedTags([]);
  };

  // 검색 실행 함수 추가
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  // 검색 초기화 함수 추가
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // 엔터 키 핸들러 추가
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  if (loading && faqs.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>FAQ 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6', // 회색(#6c757d)에서 보라색으로 변경
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
            FAQ 추가
          </button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>카테고리 필터</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
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
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>검색</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문 또는 답변 내용 검색..."
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                검색
              </button>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 해시태그 필터 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>해시태그 필터</label>
            {selectedTags.length > 0 && (
              <button
                onClick={clearTagFilter}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                필터 초기화
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', border: '1px solid #e5e7eb' }}>
            {allTags.length === 0 ? (
              <span style={{ color: '#666', fontSize: '0.875rem' }}>등록된 해시태그가 없습니다.</span>
            ) : (
              allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: isSelected ? '#3b82f6' : '#fff',
                      color: isSelected ? '#fff' : '#374151',
                      border: `1px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    #{tag}
                  </button>
                );
              })
            )}
          </div>
          {selectedTags.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              선택된 태그: {selectedTags.map((tag) => `#${tag}`).join(', ')}
            </div>
          )}
        </div>
      </div>

      {error && (
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
      )}

      {/* 페이지네이션 정보 및 컨트롤 */}
      {(faqs.length > 0 || loading) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {searchQuery ? (
              <>
                전체 {allFilteredFAQs.length}개 중 {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, allFilteredFAQs.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, allFilteredFAQs.length)}개 표시
                {totalPages > 0 && ` (페이지 ${currentPage}/${totalPages})`}
              </>
            ) : (
              <>
                {faqs.length}개 표시
                {hasMore && ' (더 많은 FAQ가 있습니다)'}
              </>
            )}
          </div>
          {searchQuery && totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: currentPage === 1 ? '#e5e7eb' : '#fff',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                이전
              </button>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: currentPage >= totalPages ? '#e5e7eb' : '#fff',
                  color: currentPage >= totalPages ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {faqs.length === 0 && !loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>
            {searchQuery
              ? '검색된 글이 없습니다.'
              : 'FAQ가 없습니다. 위의 "FAQ 추가" 버튼으로 새 FAQ를 생성하세요.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq) => {
            const category = categories.find((c) => c.id === faq.categoryId);
            return (
              <div
                key={faq.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  boxShadow: faq.isTop ? '0 0 0 2px #ffc107' : 'none',
                }}
              >
                {/* 질문과 답변 영역 */}
                <div 
                  style={{ marginBottom: '1rem' }}
                  onMouseEnter={() => setHoveredFAQId(faq.id || null)}
                  onMouseLeave={() => setHoveredFAQId(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {faq.isTop && (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                        }}
                      >
                        ⭐ 맨 상위
                      </span>
                    )}
                    {/* 화살표 아이콘 */}
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
                        transform: hoveredFAQId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      ▼
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                      {faq.question.ko}
                      {faq.question.en && (
                        <span style={{ color: '#666', marginLeft: '0.5rem', fontSize: '1rem', fontWeight: 'normal' }}>
                          / {faq.question.en}
                        </span>
                      )}
                    </h3>
                  </div>
                  {/* 답변 영역 - 기본적으로 숨김, 질문 hover 시 표시 */}
                  <div
                    data-answer
                    style={{
                      display: hoveredFAQId === faq.id ? 'block' : 'none',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #e5e5e5',
                      color: '#666',
                      lineHeight: '1.6',
                      transition: 'opacity 0.2s ease',
                      opacity: hoveredFAQId === faq.id ? 1 : 0,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: faq.saveFormat === 'markdown' 
                        ? markdownToHtml(faq.answer.ko || faq.answer.en || '')
                        : (faq.answer.ko || faq.answer.en || ''),
                    }}
                  />
                </div>

                {/* 정보 및 버튼 영역 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e5e5',
                  }}
                >
                  {/* 좌측: 정보 영역 */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#666',
                      alignItems: 'center',
                      flex: 1,
                    }}
                  >
                    <span>
                      카테고리: <strong>{category?.name.ko || '미분류'}</strong>
                    </span>
                    <span>
                      Level: <strong>{faq.level}</strong>
                    </span>
                    <span>
                      활성화:{' '}
                      {faq.enabled.ko && <span style={{ color: '#28a745' }}>KO</span>}
                      {faq.enabled.ko && faq.enabled.en && <span style={{ margin: '0 0.25rem' }}>/</span>}
                      {faq.enabled.en && <span style={{ color: '#28a745' }}>EN</span>}
                      {!faq.enabled.ko && !faq.enabled.en && <span style={{ color: '#dc3545' }}>비활성화</span>}
                    </span>
                    {faq.createdBy && (
                      <span>
                        작성자: <strong>{admins.get(faq.createdBy)?.name || '알 수 없음'}</strong>
                      </span>
                    )}
                    {faq.updatedBy && faq.updatedBy !== faq.createdBy && (
                      <span>
                        수정자: <strong>{admins.get(faq.updatedBy)?.name || '알 수 없음'}</strong>
                      </span>
                    )}
                    {faq.tags && faq.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                        <span style={{ marginRight: '0.25rem' }}>태그:</span>
                        {faq.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 우측: 버튼 영역 */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(faq)}
                      style={{
                        padding: '0.5rem 1rem',
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
                      onClick={() => handleDelete(faq.id!)}
                      style={{
                        padding: '0.5rem 1rem',
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
              </div>
            );
          })}
          </div>
          
          {/* 페이지네이션 버튼 */}
          {!searchQuery && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
              {pageHistory.length > 0 && (
                <button
                  onClick={handleResetPagination}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  처음으로
                </button>
              )}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: loading ? '#9ca3af' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {loading ? '로딩 중...' : '더 보기'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* 카테고리 관리 모달 */}
      <FAQCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          loadCategories(); // 카테고리 목록 새로고침
          loadFAQs(); // FAQ 목록 새로고침 (카테고리 변경 반영)
          loadAllTags(); // 추가: 태그 목록도 새로고침
        }}
      />
    </div>
  );
}

