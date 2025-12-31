'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/admin/eventService';
import { getEventParticipants } from '@/lib/admin/eventParticipantService';
import type { Event, EventParticipant } from '@/lib/admin/types';

export default function EventParticipantsPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
  const eventId = params?.id as string;

  useEffect(() => {
    if (eventId) {
      void loadEvent();
      void loadParticipants();
    }
  }, [eventId, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    void loadParticipants();
  }, [searchText]);

  const loadEvent = async () => {
    try {
      const eventData = await getEventById(eventId);
      setEvent(eventData);
    } catch (err: any) {
      console.error('Failed to load event:', err);
      setError('이벤트 정보를 불러오는데 실패했습니다.');
    }
  };

  const loadParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const options: {
        eventId: string;
        page: number;
        limit: number;
        search?: string;
      } = {
        eventId,
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchText && searchText.trim()) {
        options.search = searchText.trim();
      }

      const data = await getEventParticipants(options);
      setParticipants(data.participants);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load participants:', err);
      setError(err.message || '참가신청자를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void loadParticipants();
  };

  const handleReset = () => {
    setSearchText('');
    setCurrentPage(1);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const exportToCSV = () => {
    if (participants.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['번호', '성함', '소속/회사명', '이메일', '전화번호', '신청일시'];
    const csvContent = [
      headers.join(','),
      ...participants.map((participant, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        participant.name,
        participant.company,
        participant.email,
        participant.phone,
        formatDate(participant.createdAt),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.title?.ko || '이벤트'}_참가신청자_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !participants.length) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '2rem' 
      }}>
        <div>
          <Link
            href="/admin/event"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#0070f3',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이벤트 목록으로
          </Link>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>참가신청자 관리</h1>
          {event && (
            <p style={{ color: '#666', margin: 0, fontSize: '1.125rem' }}>
              {event.title?.ko || '이벤트'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/admin/event/${eventId}/view`}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
            }}
          >
            이벤트 보기
          </Link>
          <button
            onClick={exportToCSV}
            disabled={participants.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: participants.length > 0 ? '#28a745' : '#e5e7eb',
              color: participants.length > 0 ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: participants.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      {/* 검색 필터 */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem', 
              fontWeight: 500, 
              color: '#374151' 
            }}>
              성함/회사명/이메일 검색
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

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '0.25rem',
          marginBottom: '1rem',
          color: '#856404',
        }}>
          <strong>경고:</strong> {error}
        </div>
      )}

      {/* 총 항목 수 표시 및 페이지당 표시 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          총 {total}명의 참가신청자
          <span style={{ marginLeft: '0.5rem' }}>
            (페이지 {currentPage} / {Math.max(1, totalPages)})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>
            페이지당 표시:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
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

      {/* 참가신청자 테이블 */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        marginBottom: '2rem',
      }}>
        {participants.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#666',
          }}>
            {searchText ? '검색된 참가신청자가 없습니다.' : '참가신청자가 없습니다.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '60px',
                  }}>
                    번호
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '100px',
                  }}>
                    성함
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '150px',
                  }}>
                    소속/회사명
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '200px',
                  }}>
                    이메일
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '120px',
                  }}>
                    전화번호
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    minWidth: '140px',
                  }}>
                    신청일시
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr
                    key={participant.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      fontWeight: '500',
                    }}>
                      {participant.name}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}>
                      {participant.company}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}>
                      <a
                        href={`mailto:${participant.email}`}
                        style={{
                          color: '#0070f3',
                          textDecoration: 'none',
                        }}
                      >
                        {participant.email}
                      </a>
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}>
                      <a
                        href={`tel:${participant.phone}`}
                        style={{
                          color: '#0070f3',
                          textDecoration: 'none',
                        }}
                      >
                        {participant.phone}
                      </a>
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                    }}>
                      {formatDate(participant.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 1 ? '#e5e7eb' : '#0070f3',
              color: currentPage === 1 ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            이전
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: page === currentPage ? '#0070f3' : '#fff',
                  color: page === currentPage ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  minWidth: '2.5rem',
                }}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage >= totalPages ? '#e5e7eb' : '#0070f3',
              color: currentPage >= totalPages ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}