'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWhatsNews, deleteWhatsNew } from '@/lib/admin/whatsnewService';
import type { WhatsNew } from '@/lib/admin/types';
import { adminFetch } from '@/lib/admin/api';

export default function WhatsNewPage() {
  const [whatsnews, setWhatsNews] = useState<WhatsNew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [bannerFilter, setBannerFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const limit = 20;

  useEffect(() => {
    void loadAdmins();
    void loadWhatsNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await adminFetch('admins');
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

  const loadWhatsNews = async (overrideFilters?: { publishedFilter?: string; bannerFilter?: string; searchText?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const effectivePublishedFilter = overrideFilters?.publishedFilter ?? publishedFilter;
      const effectiveBannerFilter = overrideFilters?.bannerFilter ?? bannerFilter;
      const effectiveSearchText = overrideFilters?.searchText ?? searchText;
      const effectivePage = overrideFilters?.page ?? currentPage;

      const options: { page: number; limit: number; published?: boolean; showInBanner?: boolean; search?: string } = {
        page: effectivePage,
        limit,
      };
      if (effectivePublishedFilter !== 'all') {
        options.published = effectivePublishedFilter === 'published';
        console.log('[WhatsNew Page] 발행 상태 필터:', effectivePublishedFilter, '->', options.published);
      }
      if (effectiveBannerFilter !== 'all') {
        options.showInBanner = effectiveBannerFilter === 'true';
        console.log('[WhatsNew Page] 배너 노출 필터:', effectiveBannerFilter, '->', options.showInBanner);
      }
      if (effectiveSearchText && effectiveSearchText.trim()) {
        options.search = effectiveSearchText.trim();
        console.log('[WhatsNew Page] 검색어:', options.search);
      }

      console.log('[WhatsNew Page] 최종 검색 옵션:', options);

      const data = await getWhatsNews(options);
      // isTop 우선 정렬 (고정된 항목이 먼저, 그 다음 createdAt DESC)
      const sortedWhatsNews = [...data.whatsnews].sort((a, b) => {
        if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
      setWhatsNews(sortedWhatsNews);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      if (data.whatsnews.length === 0 && data.total === 0) {
        console.warn("What's new가 없거나 API/Firestore 연결에 문제가 있을 수 있습니다.");
      }
    } catch (e: any) {
      console.error("Failed to load what's news:", e);
      setError(e.message || "What's new를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteWhatsNew(id);
        await loadWhatsNews();
      } catch (e) {
        console.error("Failed to delete what's new:", e);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    void loadWhatsNews();
  };

  const handleReset = () => {
    setPublishedFilter('all');
    setBannerFilter('all');
    setSearchText('');
    setCurrentPage(1);
    // 초기화 후 데이터 다시 로드
    void loadWhatsNews({ publishedFilter: 'all', bannerFilter: 'all', searchText: '', page: 1 });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>What's new 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/admin/whatsnew/new"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            What's new 추가
          </Link>
        </div>
      </div>

      {/* 검색 필터 */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          {/* 제목/내용 검색 */}
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              제목/내용 검색
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="검색어를 입력하세요"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* 발행 상태 검색 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              발행 상태
            </label>
            <select
              value={publishedFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setPublishedFilter(newValue);
                setCurrentPage(1);
                void loadWhatsNews({ publishedFilter: newValue, page: 1 });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">전체</option>
              <option value="published">발행</option>
              <option value="draft">초안</option>
            </select>
          </div>

          {/* 배너 노출 검색 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              배너 노출
            </label>
            <select
              value={bannerFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setBannerFilter(newValue);
                setCurrentPage(1);
                void loadWhatsNews({ bannerFilter: newValue, page: 1 });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">전체</option>
              <option value="true">노출</option>
              <option value="false">미노출</option>
            </select>
          </div>

          {/* 검색 버튼 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSearch}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              초기화
            </button>
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

      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
        총 {total}개의 What's new {totalPages > 0 && `(페이지 ${currentPage} / ${totalPages})`}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>제목</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>고정</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>배너 노출</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>발행 상태</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작성자</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>수정자</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작성일</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>조회수</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {whatsnews.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                What's new가 없습니다.
              </td>
            </tr>
          ) : (
            whatsnews.map((whatsnew) => (
              <tr key={whatsnew.id}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    <Link
                      href={`/admin/whatsnew/${whatsnew.id}/view`}
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {whatsnew.title?.ko || '-'}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', textAlign: 'center' }}>
                    {whatsnew.isTop ? (
                      <span style={{ color: '#ffc107', fontWeight: 'bold' }}>✓</span>
                    ) : (
                      <span style={{ color: '#ccc' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    {whatsnew.showInBanner ? (
                      <span style={{ color: '#28a745' }}>노출</span>
                    ) : (
                      <span style={{ color: '#666' }}>미노출</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    {whatsnew.published ? <span style={{ color: '#28a745' }}>발행</span> : <span style={{ color: '#666' }}>초안</span>}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem' }}>
                    {whatsnew.createdBy ? admins.get(whatsnew.createdBy)?.name || '알 수 없음' : '-'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem' }}>
                    {whatsnew.updatedBy ? admins.get(whatsnew.updatedBy)?.name || '알 수 없음' : '-'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    {whatsnew.createdAt ? new Date(whatsnew.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', textAlign: 'right' }}>
                    {whatsnew.views !== undefined ? whatsnew.views.toLocaleString() : '0'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                    <Link
                      href={`/admin/whatsnew/${whatsnew.id}`}
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(whatsnew.id!)}
                      style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                      type="button"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === 1 ? '#e5e5e5' : '#0070f3',
                  color: currentPage === 1 ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                이전
              </button>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: currentPage === pageNum ? '#0070f3' : '#fff',
                        color: currentPage === pageNum ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        minWidth: '2.5rem',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === totalPages ? '#e5e5e5' : '#0070f3',
                  color: currentPage === totalPages ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                다음
              </button>
            </div>
          )}
    </div>
  );
}

