'use client';

import { getAdminApiUrl } from '../../../lib/utils/api';
import { useEffect, useState } from 'react';

interface EmailHistory {
  id: string;
  subject: string;
  sentAt: string;
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
  status?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 40, 50];
const DEFAULT_ITEMS_PER_PAGE = 20;

// 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString: string | undefined): string => {
  if (!dateString || dateString.trim() === '') {
    return '-';
  }
  
  try {
    let normalized = dateString.trim();
    normalized = normalized.replace(/\s+KST$/, '');
    normalized = normalized.replace(/\s+([+-])(\d{2})(\d{2})$/, '$1$2:$3');
    normalized = normalized.replace(' ', 'T');
    
    const date = new Date(normalized);
    if (isNaN(date.getTime())) {
      console.warn('Failed to parse date:', dateString, 'normalized:', normalized);
      return '-';
    }
    
    return date.toLocaleDateString('ko-KR').replace(/\.$/, '');
  } catch (error) {
    console.error('Date formatting error:', error, dateString);
    return '-';
  }
};

// 퍼센트 포맷팅 헬퍼 함수
const formatPercent = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(2)}%`;
};

export default function NewsletterSendHistoryPage() {
  const [emails, setEmails] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  useEffect(() => {
    loadTotalCount();
    loadEmailHistory(1);
  }, []);

  useEffect(() => {
    if (totalCount > 0) {
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      const newTotalPages = Math.ceil(totalCount / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
        loadEmailHistory(1);
      } else {
        loadEmailHistory(currentPage);
      }
    }
  }, [itemsPerPage]);

  // 총 발송 이력 수 로드
  const loadTotalCount = async () => {
    try {
      const response = await fetch(getAdminApiUrl('newsletter/send-history?count=true'));
      if (response.ok) {
        const data = await response.json();
        const count = data.totalCount || 0;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      } else if (response.status === 402) {
        // ✅ 프로 요금제 에러 처리
        const errorData = await response.json();
        setError(errorData.message || '프로 요금제가 필요합니다.');
      }
    } catch (error: any) {
      console.error('Failed to load total count:', error);
    }
  };

  // 발송 이력 목록 로드
  const loadEmailHistory = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await fetch(
        getAdminApiUrl(`newsletter/send-history?offset=${offset}&limit=${itemsPerPage}&statistics=true`)
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // ✅ 프로 요금제 에러 특별 처리
        if (response.status === 402 && errorData.error === 'PREMIUM_REQUIRED') {
          throw new Error(errorData.message || '이메일 발송 이력 조회는 Stibee 프로 요금제 이상에서만 사용 가능합니다.');
        }
        
        throw new Error(errorData.error || errorData.message || '발송 이력을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setEmails(Array.isArray(data.emails) ? data.emails : []);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to load email history:', error);
      setError(error.message || '발송 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      loadEmailHistory(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // 페이지 번호 계산 (구독자 목록과 동일한 로직)
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading && emails.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error && emails.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '0.5rem',
            color: '#856404',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>⚠️ 기능 제한 안내</h3>
          <p style={{ margin: 0, lineHeight: '1.6' }}>
            <strong>{error}</strong>
          </p>
          <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
            이메일 발송 이력 조회 기능을 사용하려면 Stibee 프로 요금제 이상으로 업그레이드가 필요합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>뉴스레터 발송 이력</h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            {totalCount >= 0 
              ? `총 ${totalCount}건의 발송 이력 (페이지 ${currentPage} / ${totalPages})`
              : `페이지 ${currentPage} / ${totalPages}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="itemsPerPage" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            페이지당:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            disabled={loading}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
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

      {emails.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>발송 이력이 없습니다.</p>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e5e5' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>제목</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>발송일</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>수신자 수</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>오픈율</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>클릭율</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email, index) => (
                  <tr
                    key={email.id || index}
                    style={{
                      borderBottom: '1px solid #e5e5e5',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{email.subject || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{formatDate(email.sentAt)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {email.recipientCount.toLocaleString()}명
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {formatPercent(email.openRate)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {formatPercent(email.clickRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                style={{
                  padding: '0.5rem 1rem',
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

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      style={{
                        padding: '0.5rem',
                        color: '#6b7280',
                      }}
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      minWidth: '2.5rem',
                      backgroundColor: isActive ? '#0070f3' : '#fff',
                      color: isActive ? '#fff' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#fff',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}