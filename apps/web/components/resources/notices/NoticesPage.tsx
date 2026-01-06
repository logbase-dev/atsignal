'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Notice } from '@/lib/admin/types';
import { getPublicNotices } from '@/lib/public/noticeService';

interface Props {
  locale: 'ko' | 'en';
  initialNotices: Notice[];
  initialTotal: number;
}

export default function NoticesPage({
  locale,
  initialNotices,
  initialTotal,
}: Props) {
  const [notices, setNotices] = useState(initialNotices);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [searchText, setSearchText] = useState('');

  const texts = {
    ko: {
      title: '공지사항',
      subtitle: 'AtSignal의 최신 공지사항과 업데이트를 확인하세요',
      search: '검색',
      searchPlaceholder: '제목이나 내용을 검색하세요',
      reset: '초기화',
      noNotices: '공지사항이 없습니다.',
      loading: '공지사항을 불러오는 중...',
      readMore: '자세히 보기',
      author: '작성자',
      date: '작성일',
      views: '조회수',
      previous: '이전',
      next: '다음',
      important: '중요',
    },
    en: {
      title: 'Notices',
      subtitle: 'Check out the latest notices and updates from AtSignal',
      search: 'Search',
      searchPlaceholder: 'Search by title or content',
      reset: 'Reset',
      noNotices: 'No notices available.',
      loading: 'Loading notices...',
      readMore: 'Read More',
      author: 'Author',
      date: 'Date',
      views: 'Views',
      previous: 'Previous',
      next: 'Next',
      important: 'Important',
    },
  };

  const t = texts[locale];

  const loadNotices = async (targetPage: number = 1, search?: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await getPublicNotices({ 
        page: targetPage, 
        limit: 20,
        search: search || undefined,
      });
      setNotices(response.notices);
      setPage(targetPage);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadNotices(1, searchText);
  };

  const handleReset = () => {
    setSearchText('');
    setPage(1);
    loadNotices(1, '');
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    // Handle Firestore Timestamp objects
    let dateObj: Date;
    if (date && typeof date === 'object' && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const getLocalizedText = (field: { ko: string; en?: string } | undefined) => {
    if (!field) return '';
    return field[locale] || field.ko || '';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      paddingBottom: '2rem'
    }}>

      <div className="hero-page">
        <div className="hero-page-container">
          <h1>atsignal Notices</h1>
          <p>설명 문구가 들어가는 곳입니다.</p>
          {/* <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p> */}
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 검색 */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
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
            <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                {t.search}
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
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
              />
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
                {t.search}
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {t.reset}
              </button>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        {loading ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              color: '#9ca3af',
              fontSize: '1.125rem',
            }}>
              {t.loading}
            </div>
          </div>
        ) : notices.length === 0 ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              color: '#9ca3af',
              fontSize: '1.125rem',
              marginBottom: '1rem',
            }}>
              <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.noNotices}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse' 
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    제목
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    {t.author}
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    {t.date}
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'right', 
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    color: '#374151',
                  }}>
                    {t.views}
                  </th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {notice.isTop && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}>
                            {t.important}
                          </span>
                        )}
                        <Link
                          href={`/${locale}/resources/notices/${notice.id}`}
                          style={{
                            color: '#1a1a1a',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '1rem',
                            lineHeight: '1.4',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#20BDFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#1a1a1a';
                          }}
                        >
                          {getLocalizedText(notice.title)}
                        </Link>
                      </div>
                      {notice.oneLiner && (
                        <div style={{
                          color: '#666',
                          fontSize: '0.875rem',
                          marginTop: '0.25rem',
                          lineHeight: '1.4',
                        }}>
                          {getLocalizedText(notice.oneLiner)}
                        </div>
                      )}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: '#666',
                      fontSize: '0.875rem',
                    }}>
                      {notice.authorName || '-'}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: '#666',
                      fontSize: '0.875rem',
                    }}>
                      {formatDate(notice.createdAt)}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: '#666',
                      fontSize: '0.875rem',
                      textAlign: 'right',
                    }}>
                      {(notice.views || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            onClick={() => loadNotices(page - 1, searchText)}
            disabled={loading || page === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (loading || page === 1) ? '#e5e7eb' : '#20BDFF',
              color: (loading || page === 1) ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: (loading || page === 1) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {t.previous}
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.max(1, Math.ceil(total / 20)) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => loadNotices(pageNum, searchText)}
                disabled={loading}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: pageNum === page ? '#20BDFF' : '#fff',
                  color: pageNum === page ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minWidth: '2.5rem',
                  fontSize: '0.875rem',
                  fontWeight: pageNum === page ? '600' : '500',
                }}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadNotices(page + 1, searchText)}
            disabled={loading || page >= Math.ceil(total / 20)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (loading || page >= Math.ceil(total / 20)) ? '#e5e7eb' : '#20BDFF',
              color: (loading || page >= Math.ceil(total / 20)) ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: (loading || page >= Math.ceil(total / 20)) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}