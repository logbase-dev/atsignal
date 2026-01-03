'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDemoRequests, updateDemoRequest, deleteDemoRequest } from '@/lib/admin/demoRequestService';
import type { DemoRequest } from '@/lib/admin/types';

export default function DemoRequestsPage() {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
  const STATUS_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'contacted', label: '연락완료' },
    { value: 'completed', label: '처리완료' },
    { value: 'cancelled', label: '취소' },
  ];

  useEffect(() => {
    setCurrentPage(1);
    void loadDemoRequests();
  }, [statusFilter, searchText, itemsPerPage]);

  useEffect(() => {
    void loadDemoRequests();
  }, [currentPage]);

  const loadDemoRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const options: {
        page: number;
        limit: number;
        status?: 'pending' | 'contacted' | 'completed' | 'cancelled';
        search?: string;
      } = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== 'all') {
        options.status = statusFilter as 'pending' | 'contacted' | 'completed' | 'cancelled';
      }
      if (searchText && searchText.trim()) {
        options.search = searchText.trim();
      }

      const data = await getDemoRequests(options);
      setDemoRequests(data.demoRequests);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e: any) {
      console.error('Failed to load demo requests:', e);
      setError(e.message || '데모신청을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDemoRequest(id);
        await loadDemoRequests();
      } catch (e: any) {
        console.error('Failed to delete demo request:', e);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void loadDemoRequests();
  };

  const handleReset = () => {
    setStatusFilter('all');
    setSearchText('');
    setCurrentPage(1);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const exportToCSV = () => {
    if (demoRequests.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['번호', '성함', '회사명', '이메일', '전화번호', '상태', '신청일시', '연락일시'];
    const csvContent = [
      headers.join(','),
      ...demoRequests.map((request, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        request.name,
        request.company,
        request.email,
        request.phone,
        STATUS_OPTIONS.find(s => s.value === request.status)?.label || request.status,
        formatDate(request.createdAt),
        formatDate(request.contactedAt),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `데모신청_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h1 style={{ fontSize: '2rem' }}>데모신청 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={exportToCSV}
            disabled={demoRequests.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: demoRequests.length > 0 ? '#28a745' : '#e5e7eb',
              color: demoRequests.length > 0 ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: demoRequests.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            CSV 내보내기
          </button>
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
          {/* 검색 */}
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
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

          {/* 상태 필터 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              상태
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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

      {/* 총 항목 수 표시 및 페이지당 표시 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          총 {total}개의 데모신청
          <span style={{ marginLeft: '0.5rem' }}>
            (페이지 {currentPage} / {Math.max(1, totalPages)})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>페이지당 표시:</label>
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

      {/* 데모신청 테이블 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          marginBottom: '2rem',
        }}
      >
        {demoRequests.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#666',
            }}
          >
            {searchText || statusFilter !== 'all' ? '검색된 데모신청이 없습니다.' : '데모신청이 없습니다.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '60px' }}>
                    번호
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '100px' }}>
                    성함
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '150px' }}>
                    회사명
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '200px' }}>
                    이메일
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '120px' }}>
                    전화번호
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '100px' }}>
                    상태
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '140px' }}>
                    신청일시
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb', minWidth: '100px' }}>
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {demoRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                      <Link
                        href={`/admin/demo-requests/${request.id}`}
                        style={{ color: '#0070f3', textDecoration: 'none' }}
                      >
                        {request.name}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      {request.company}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <a href={`mailto:${request.email}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                        {request.email}
                      </a>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <a href={`tel:${request.phone}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                        {request.phone}
                      </a>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '0.5rem',
                          backgroundColor: 
                            request.status === 'pending' ? '#fff3cd' :
                            request.status === 'contacted' ? '#cff4fc' :
                            request.status === 'completed' ? '#d1e7dd' :
                            '#e2e3e5',
                          color:
                            request.status === 'pending' ? '#856404' :
                            request.status === 'contacted' ? '#055160' :
                            request.status === 'completed' ? '#0f5132' :
                            '#41464b',
                        }}
                      >
                        {STATUS_OPTIONS.find(s => s.value === request.status)?.label || request.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(request.createdAt)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Link
                          href={`/admin/demo-requests/${request.id}`}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          상세
                        </Link>
                        <button
                          onClick={() => handleDelete(request.id!)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
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
          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
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
          onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
          disabled={currentPage >= Math.max(1, totalPages)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: currentPage >= Math.max(1, totalPages) ? '#e5e7eb' : '#0070f3',
            color: currentPage >= Math.max(1, totalPages) ? '#999' : 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: currentPage >= Math.max(1, totalPages) ? 'not-allowed' : 'pointer',
          }}
        >
          다음
        </button>
      </div>
    </div>
  );
}