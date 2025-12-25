'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFAQs, deleteFAQ, getAllTags } from '@/lib/admin/faqService';
import { getFAQCategories } from '@/lib/admin/faqCategoryService';
import { FAQCategoryModal } from '@/components/admin/faq/FAQCategoryModal';
import type { FAQ, FAQCategory } from '@/lib/admin/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import rehypeSlug from 'rehype-slug';
import { getAdminApiUrl } from '@/lib/admin/api';

const ToastViewer = dynamic(() => import('@toast-ui/react-editor').then((mod) => mod.Viewer), { ssr: false });

const ITEMS_PER_PAGE = 20;

export default function AdminFAQPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [expandedFAQId, setExpandedFAQId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [showAllTags, setShowAllTags] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allFilteredFAQs, setAllFilteredFAQs] = useState<FAQ[]>([]);

  useEffect(() => {
    void loadCategories();
    void loadAllTags();
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setAllFilteredFAQs([]);
    void loadFAQs();
    void loadAllTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, searchQuery, selectedTags]);

  useEffect(() => {
    if (searchQuery && allFilteredFAQs.length > 0) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setFaqs(allFilteredFAQs.slice(startIndex, endIndex));
    } else if (searchQuery && allFilteredFAQs.length === 0) {
      setFaqs([]);
    }
  }, [currentPage, allFilteredFAQs, searchQuery]);

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
      const data = await getFAQCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadAllTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadFAQs = async (loadMore: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFAQs({
        categoryId:
          selectedCategoryId === '__no_category__'
            ? '__no_category__'
            : selectedCategoryId || undefined,
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        orderBy: 'isTop',
        orderDirection: 'desc',
      });

      if (loadMore) {
        setFaqs((prev) => [...prev, ...data.slice(prev.length, prev.length + ITEMS_PER_PAGE)]);
        setHasMore(data.length > faqs.length + ITEMS_PER_PAGE);
      } else {
        setFaqs(data.slice(0, ITEMS_PER_PAGE));
        setHasMore(data.length > ITEMS_PER_PAGE);
        setAllFilteredFAQs(data);
      }
    } catch (err: any) {
      console.error('Failed to load FAQs:', err);
      setError(err.message || 'FAQ를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteFAQ(id);
      setCurrentPage(1);
      setAllFilteredFAQs([]);
      await loadFAQs();
      await loadAllTags();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleLoadMore = () => {
    if (!hasMore) return;
    const nextPageStart = faqs.length;
    const nextPageEnd = nextPageStart + ITEMS_PER_PAGE;
    const nextPageData = allFilteredFAQs.slice(nextPageStart, nextPageEnd);
    setFaqs((prev) => [...prev, ...nextPageData]);
    setHasMore(nextPageEnd < allFilteredFAQs.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetPagination = async () => {
    setFaqs(allFilteredFAQs.slice(0, ITEMS_PER_PAGE));
    setHasMore(allFilteredFAQs.length > ITEMS_PER_PAGE);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = searchQuery ? Math.ceil(allFilteredFAQs.length / ITEMS_PER_PAGE) : 0;

  const handleEdit = (faq: FAQ) => {
    if (faq.id) router.push(`/admin/faq/${faq.id}`);
  };

  const handleCreate = () => {
    router.push('/admin/faq/new');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const clearTagFilter = () => setSelectedTags([]);

  const handleSearch = () => setSearchQuery(searchInput);
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

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
            style={{ padding: '0.5rem 1rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
          >
            카테고리 관리
          </button>
          <button
            onClick={handleCreate}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
          >
            FAQ 추가
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>카테고리 필터</label>
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}>
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
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="질문 또는 답변 내용 검색..." style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }} />
              <button onClick={handleSearch} style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>검색</button>
              {searchQuery ? (
                <button onClick={handleClearSearch} style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>초기화</button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 'bold' }}>해시태그 필터</label>
              <button type="button" onClick={() => setShowAllTags(!showAllTags)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: showAllTags ? 'rotate(180deg)' : 'rotate(0deg)' }} title={showAllTags ? '접기' : '펼치기'}>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>▼</span>
              </button>
            </div>
            {selectedTags.length > 0 ? (
              <button onClick={clearTagFilter} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer', color: '#666' }}>
                필터 초기화
              </button>
            ) : null}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', border: '1px solid #e5e7eb', maxHeight: showAllTags ? 'none' : '3.5rem', overflow: showAllTags ? 'visible' : 'hidden', transition: 'max-height 0.3s ease' }}>
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
                      flexShrink: 0,
                    }}
                  >
                    #{tag}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '0.25rem', marginBottom: '1rem', color: '#856404' }}>
          <strong>경고:</strong> {error}
        </div>
      ) : null}

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
          {searchQuery && totalPages > 1 ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '0.375rem 0.75rem', backgroundColor: currentPage === 1 ? '#e5e7eb' : '#fff', color: currentPage === 1 ? '#9ca3af' : '#374151', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                이전
              </button>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                {currentPage} / {totalPages}
              </span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} style={{ padding: '0.375rem 0.75rem', backgroundColor: currentPage >= totalPages ? '#e5e7eb' : '#fff', color: currentPage >= totalPages ? '#9ca3af' : '#374151', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                다음
              </button>
            </div>
          ) : null}
        </div>
      )}

      {faqs.length === 0 && !loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>{searchQuery ? '검색된 글이 없습니다.' : 'FAQ가 없습니다. 위의 "FAQ 추가" 버튼으로 새 FAQ를 생성하세요.'}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq) => {
              const category = categories.find((c) => c.id === faq.categoryId);
              return (
                <div key={faq.id} style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0.5rem', boxShadow: faq.isTop ? '0 0 0 2px #ffc107' : 'none' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => setExpandedFAQId(expandedFAQId === faq.id ? null : (faq.id || null))}>
                      {faq.isTop ? (
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ffc107', color: '#000', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                          ⭐ 맨 상위
                        </span>
                      ) : null}
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', fontSize: '0.875rem', color: '#6b7280', transition: 'transform 0.2s ease', transform: expandedFAQId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                        {faq.question.ko}
                        {faq.question.en ? <span style={{ color: '#666', marginLeft: '0.5rem', fontSize: '1rem', fontWeight: 'normal' }}> / {faq.question.en}</span> : null}
                      </h3>
                    </div>
                    <div data-answer style={{ display: expandedFAQId === faq.id ? 'block' : 'none', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e5e5', color: '#666', lineHeight: '1.6', transition: 'opacity 0.2s ease', opacity: expandedFAQId === faq.id ? 1 : 0 }}>
                      {faq.saveFormat === 'html' ? (
                        <div style={{ marginTop: '1rem' }}>
                          <ToastViewer initialValue={faq.answer.ko || faq.answer.en || ''} />
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                          {faq.answer.ko || faq.answer.en || ''}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#666', alignItems: 'center', flex: 1 }}>
                      <span>
                        카테고리: <strong>{category?.name.ko || '미분류'}</strong>
                      </span>
                      <span>
                        Level: <strong>{faq.level}</strong>
                      </span>
                      <span>
                        조회수: <strong>{faq.views ?? 0}</strong>
                      </span>
                      <span>
                        활성화:{' '}
                        {faq.enabled.ko && <span style={{ color: '#28a745' }}>KO</span>}
                        {faq.enabled.ko && faq.enabled.en && <span style={{ margin: '0 0.25rem' }}>/</span>}
                        {faq.enabled.en && <span style={{ color: '#28a745' }}>EN</span>}
                        {!faq.enabled.ko && !faq.enabled.en && <span style={{ color: '#dc3545' }}>비활성화</span>}
                      </span>
                      {faq.createdBy ? (
                        <span>
                          작성자: <strong>{admins.get(faq.createdBy)?.name || '알 수 없음'}</strong>
                        </span>
                      ) : null}
                      {faq.updatedBy && faq.updatedBy !== faq.createdBy ? (
                        <span>
                          수정자: <strong>{admins.get(faq.updatedBy)?.name || '알 수 없음'}</strong>
                        </span>
                      ) : null}
                      {faq.tags?.length ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                          <span style={{ marginRight: '0.25rem' }}>태그:</span>
                          {faq.tags.map((tag) => (
                            <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                              #{tag}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button onClick={() => handleEdit(faq)} style={{ padding: '0.5rem 1rem', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        수정
                      </button>
                      <button onClick={() => void handleDelete(faq.id!)} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!searchQuery ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
              <button onClick={() => void handleResetPagination()} disabled={!hasMore} style={{ padding: '0.5rem 1rem', backgroundColor: !hasMore ? '#9ca3af' : '#6c757d', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: !hasMore ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                처음으로 (총 {faqs.length}개)
              </button>
              {hasMore ? (
                <button onClick={handleLoadMore} disabled={loading} style={{ padding: '0.5rem 1rem', backgroundColor: loading ? '#9ca3af' : '#0070f3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                  {loading ? '로딩 중...' : '20개 더 보기'}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <FAQCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          void loadCategories();
          void loadFAQs();
          void loadAllTags();
        }}
      />
    </div>
  );
}


