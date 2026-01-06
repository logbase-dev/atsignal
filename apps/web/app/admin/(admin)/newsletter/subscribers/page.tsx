'use client';

import { useEffect, useState } from 'react';
import { getNewsletterSubscribers, getNewsletterSubscribersCount, type NewsletterSubscriber } from '@/lib/admin/newsletterService';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 40, 50];
const DEFAULT_ITEMS_PER_PAGE = 20;

const formatDate = (dateString: string | undefined): string => {
  if (!dateString || dateString.trim() === '') return '-';
  try {
    let normalized = dateString.trim();
    normalized = normalized.replace(/\s+KST$/, '');
    normalized = normalized.replace(/\s+([+-])(\d{2})(\d{2})$/, '$1$2:$3');
    normalized = normalized.replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR').replace(/\.$/, '');
  } catch {
    return '-';
  }
};

const maskEmail = (email: string | undefined): string => {
  if (!email || !email.includes('@')) return email || '-';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) return email;
  const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
};

const maskName = (name: string | undefined): string => {
  if (!name || name.trim() === '') return '-';
  const trimmedName = name.trim();
  const length = trimmedName.length;
  if (length <= 1) return trimmedName;
  if (length === 2) return trimmedName[0] + '*';
  const first = trimmedName[0];
  const last = trimmedName[length - 1];
  const middle = '*'.repeat(length - 2);
  return `${first}${middle}${last}`;
};

const formatPhone = (phone: string | undefined): string => {
  if (!phone || phone.trim() === '') return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return phone;
  if (digits.length === 11 && digits.startsWith('010')) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) {
    if (digits.startsWith('02')) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

export default function AdminNewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  useEffect(() => {
    void loadTotalCount();
    void loadSubscribers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (totalCount > 0) {
      const newTotalPages = Math.ceil(totalCount / itemsPerPage);
      setTotalPages(newTotalPages);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
        void loadSubscribers(1);
      } else {
        void loadSubscribers(currentPage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]);

  const loadTotalCount = async () => {
    try {
      const data = await getNewsletterSubscribersCount();
      const count = data.totalCount || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / itemsPerPage));
    } catch (err) {
      console.error('Failed to load total count:', err);
    }
  };

  const loadSubscribers = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * itemsPerPage;
      const data = await getNewsletterSubscribers({ offset, limit: itemsPerPage });
      setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to load subscribers:', err);
      setError(err.message || '구독자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      void loadSubscribers(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading && subscribers.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error && subscribers.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '0.25rem', color: '#856404' }}>
          <strong>오류:</strong> {error}
        </div>
        <button onClick={() => void loadSubscribers(1)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>뉴스레터 구독자</h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            총 {totalCount}명의 구독자 (페이지 {currentPage} / {totalPages})
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="itemsPerPage" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              페이지당:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              disabled={loading}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem', backgroundColor: '#fff', color: '#374151', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}개
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>구독자가 없습니다.</p>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e5e5' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>이메일</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>이름</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>회사</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>전화번호</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>상태</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>구독일</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber, index) => (
                  <tr
                    key={subscriber.email || index}
                    style={{ borderBottom: '1px solid #e5e5e5', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{maskEmail(subscriber.email)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{maskName(subscriber.name)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{subscriber.company || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{formatPhone(subscriber.phone)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', backgroundColor: subscriber.status === 'subscribed' ? '#d1fae5' : '#fee2e2', color: subscriber.status === 'subscribed' ? '#065f46' : '#991b1b' }}>
                        {subscriber.status || 'unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{formatDate(subscriber.subscribedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} style={{ padding: '0.5rem 1rem', backgroundColor: currentPage === 1 ? '#e5e7eb' : '#fff', color: currentPage === 1 ? '#9ca3af' : '#374151', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                이전
              </button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} style={{ padding: '0.5rem', color: '#6b7280' }}>
                      ...
                    </span>
                  );
                }
                const pageNum = page as number;
                const isActive = pageNum === currentPage;
                return (
                  <button key={pageNum} onClick={() => handlePageChange(pageNum)} disabled={loading} style={{ padding: '0.5rem 1rem', minWidth: '2.5rem', backgroundColor: isActive ? '#0070f3' : '#fff', color: isActive ? '#fff' : '#374151', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}>
                    {pageNum}
                  </button>
                );
              })}

              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} style={{ padding: '0.5rem 1rem', backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#fff', color: currentPage === totalPages ? '#9ca3af' : '#374151', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


