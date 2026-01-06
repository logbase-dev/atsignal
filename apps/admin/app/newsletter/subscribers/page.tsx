'use client';

import { useEffect, useState } from 'react';
import { getAdminApiUrl } from '../../../lib/utils/api';

interface Subscriber {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  status?: string;
  subscribedAt?: string;
  [key: string]: any;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 40, 50]; // 선택 가능한 페이지당 항목 수
const DEFAULT_ITEMS_PER_PAGE = 20; // 기본값

// ✅ 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString: string | undefined): string => {
  if (!dateString || dateString.trim() === '') {
    return '-';
  }
  
  try {
    // ✅ Stibee API 날짜 형식: '2025-12-11 19:47:33 +0900 KST'
    let normalized = dateString.trim();
    
    // "KST" 제거
    normalized = normalized.replace(/\s+KST$/, '');
    
    // ✅ 타임존 변환: ' +0900' -> '+09:00' (공백 포함해서 매칭)
    normalized = normalized.replace(/\s+([+-])(\d{2})(\d{2})$/, '$1$2:$3');
    
    // 공백을 'T'로 변환
    normalized = normalized.replace(' ', 'T');
    
    const date = new Date(normalized);
    if (isNaN(date.getTime())) {
      console.warn('Failed to parse date:', dateString, 'normalized:', normalized);
      return '-';
    }
    
    // ✅ 한국어 날짜 형식으로 변환 후 마지막 점 제거
    return date.toLocaleDateString('ko-KR').replace(/\.$/, '');
  } catch (error) {
    console.error('Date formatting error:', error, dateString);
    return '-';
  }
};

// ✅ 이메일 마스킹 함수
const maskEmail = (email: string | undefined): string => {
  if (!email || !email.includes('@')) {
    return email || '-';
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) {
    return email; // 너무 짧으면 마스킹하지 않음
  }
  
  // 첫 글자만 남기고 나머지는 *로 표시
  const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
};

// ✅ 이름 마스킹 함수 (가운데만 *로 표시)
const maskName = (name: string | undefined): string => {
  if (!name || name.trim() === '') {
    return '-';
  }
  
  const trimmedName = name.trim();
  const length = trimmedName.length;
  
  if (length <= 1) {
    return trimmedName; // 1글자는 마스킹하지 않음
  } else if (length === 2) {
    // 2글자는 마지막만 *로
    return trimmedName[0] + '*';
  } else {
    // 3글자 이상: 첫 글자 + 가운데 * + 마지막 글자
    const first = trimmedName[0];
    const last = trimmedName[length - 1];
    const middle = '*'.repeat(length - 2);
    return `${first}${middle}${last}`;
  }
};

// ✅ 전화번호 포맷팅 함수 (하이픈 추가)
const formatPhone = (phone: string | undefined): string => {
  if (!phone || phone.trim() === '') {
    return '-';
  }
  
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return phone; // 숫자가 없으면 원본 반환
  }
  
  // 010-XXXX-XXXX 형식으로 포맷팅
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    // 010이 아닌 경우 (예: 02-XXXX-XXXX)
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  }
  
  // 형식에 맞지 않으면 원본 반환
  return phone;
};

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE); // ✅ state로 변경

  useEffect(() => {
    loadTotalCount();
    loadSubscribers(1);
  }, []);

  // itemsPerPage가 변경되면 첫 페이지로 이동하고 다시 로드
  useEffect(() => {
    if (totalCount > 0) {
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      // 현재 페이지가 새로운 totalPages보다 크면 첫 페이지로 이동
      const newTotalPages = Math.ceil(totalCount / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
        loadSubscribers(1);
      } else {
        // 같은 페이지 유지하면서 다시 로드
        loadSubscribers(currentPage);
      }
    }
  }, [itemsPerPage]); // ✅ itemsPerPage 변경 시 재계산

  // 총 구독자 수 로드
  const loadTotalCount = async () => {
    try {
      const response = await fetch(getAdminApiUrl('newsletter/subscribers?count=true'));
      if (response.ok) {
        const data = await response.json();
        const count = data.totalCount || 0;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage)); // ✅ itemsPerPage 사용
      }
    } catch (error: any) {
      console.error('Failed to load total count:', error);
    }
  };

  // 구독자 목록 로드
  const loadSubscribers = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * itemsPerPage; // ✅ itemsPerPage 사용
      const response = await fetch(getAdminApiUrl(`newsletter/subscribers?offset=${offset}&limit=${itemsPerPage}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '구독자 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      const newSubscribers = Array.isArray(data.subscribers) ? data.subscribers : [];
      
      setSubscribers(newSubscribers);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to load subscribers:', error);
      setError(error.message || '구독자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadSubscribers(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ✅ 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 첫 페이지로 이동
  };

  // 페이지 번호 배열 생성 (현재 페이지 기준으로 앞뒤 2페이지씩)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // 최대 표시할 페이지 번호 수
    
    if (totalPages <= maxVisible) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 첫 페이지
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // 현재 페이지 주변
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // 마지막 페이지
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
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '0.25rem',
            color: '#856404',
          }}
        >
          <strong>오류:</strong> {error}
        </div>
        <button
          onClick={() => loadSubscribers(1)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
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
          {/* ✅ 페이지당 항목 수 선택 select box */}
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
          {/* 새로고침 버튼 (선택사항) */}
          {/* <button
            onClick={() => {
              loadTotalCount();
              loadSubscribers(currentPage);
            }}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            새로고침
          </button> */}
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
                    <td style={{ padding: '0.75rem 1rem' }}>{maskEmail(subscriber.email)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{maskName(subscriber.name)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{subscriber.company || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{formatPhone(subscriber.phone)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          backgroundColor: subscriber.status === 'subscribed' ? '#d1fae5' : '#fee2e2',
                          color: subscriber.status === 'subscribed' ? '#065f46' : '#991b1b',
                        }}
                      >
                        {subscriber.status || 'unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
              {/* 이전 페이지 */}
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

              {/* 페이지 번호 */}
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

              {/* 다음 페이지 */}
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