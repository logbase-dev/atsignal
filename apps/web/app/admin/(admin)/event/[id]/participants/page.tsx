'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/admin/eventService';
import { getEventParticipants, deleteEventParticipant } from '@/lib/admin/eventParticipantService';
import type { Event, EventParticipant } from '@/lib/admin/types';

export default function EventParticipantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState<string>('');
  const limit = 20;

  useEffect(() => {
    void loadEvent();
    void loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (searchText) {
      // 검색어가 변경되면 첫 페이지로 이동하고 다시 로드
      setCurrentPage(1);
      void loadParticipants({ searchText, page: 1 });
    } else {
      void loadParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const loadEvent = async () => {
    try {
      const data = await getEventById(params.id);
      if (!data) {
        setError('이벤트를 찾을 수 없습니다.');
        return;
      }
      setEvent(data);
    } catch (e: any) {
      setError(e?.message || '이벤트를 불러오는데 실패했습니다.');
    }
  };

  const loadParticipants = async (overrideFilters?: { searchText?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const effectiveSearchText = overrideFilters?.searchText ?? searchText;
      const effectivePage = overrideFilters?.page ?? currentPage;

      const options: { eventId: string; page: number; limit: number; search?: string } = {
        eventId: params.id,
        page: effectivePage,
        limit,
      };
      if (effectiveSearchText && effectiveSearchText.trim()) {
        options.search = effectiveSearchText.trim();
      }

      const data = await getEventParticipants(options);
      setParticipants(data.participants);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e: any) {
      console.error('Failed to load participants:', e);
      setError(e.message || '참가자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (participantId: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteEventParticipant(params.id, participantId);
        await loadParticipants();
      } catch (e) {
        console.error('Failed to delete participant:', e);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void loadParticipants({ searchText, page: 1 });
  };

  const handleReset = () => {
    setSearchText('');
    setCurrentPage(1);
    void loadParticipants({ searchText: '', page: 1 });
  };

  if (loading && !event) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link
            href="/admin/event"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            ← 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <Link
            href={`/admin/event/${params.id}/view`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            ← 이벤트 상세로
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>이벤트 참가자 목록</h1>
            {event && (
              <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
                이벤트: {event.title?.ko || '제목 없음'}
              </p>
            )}
          </div>
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
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              이메일/소속 검색
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

      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
        총 {total}명의 참가자 {totalPages > 0 && `(페이지 ${currentPage} / ${totalPages})`}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>성함</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>소속/회사명</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>이메일</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>휴대폰 번호</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>개인정보 동의</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>신청일시</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {participants.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                참가자가 없습니다.
              </td>
            </tr>
          ) : (
            participants.map((participant) => (
              <tr key={participant.id}>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>{participant.name}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>{participant.company}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>{participant.email}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>{participant.phone}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', textAlign: 'center' }}>
                  {participant.privacyConsent ? (
                    <span style={{ color: '#28a745' }}>동의</span>
                  ) : (
                    <span style={{ color: '#dc3545' }}>미동의</span>
                  )}
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem' }}>
                  {participant.createdAt ? new Date(participant.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-'}
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
                  <button
                    onClick={() => handleDelete(participant.id!)}
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
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              void loadParticipants({ page: Math.max(1, currentPage - 1) });
            }}
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
                  onClick={() => {
                    setCurrentPage(pageNum);
                    void loadParticipants({ page: pageNum });
                  }}
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
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              void loadParticipants({ page: Math.min(totalPages, currentPage + 1) });
            }}
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

