'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin } from '@/lib/admin/types';

interface AdminListProps {
  admins: Admin[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AdminList({ admins, loading, onDelete, searchQuery, onSearchChange }: AdminListProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearch = () => {
    onSearchChange(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEdit = (admin: Admin) => {
    if (admin.id) {
      router.push(`/admins/${admin.id}`);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!admin.id) return;
    
    const action = admin.enabled ? '비활성화' : '활성화';
    if (!confirm(`정말 ${action}하시겠습니까?`)) {
      return;
    }
    
    try {
      await onDelete(admin.id);
    } catch (error) {
      console.error('Failed to delete admin:', error);
      alert(`${action}에 실패했습니다.`);
    }
  };

  const handleViewLogs = (admin: Admin) => {
    if (admin.id) {
      router.push(`/admins/${admin.id}/logs`);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 검색 필터링
  const filteredAdmins = admins.filter((admin) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(query) ||
      admin.username.toLowerCase().includes(query)
    );
  });

  if (loading && admins.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 검색 영역 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>검색</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이름 또는 아이디로 검색..."
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

      {/* 관리자 목록 테이블 */}
      {filteredAdmins.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>
            {searchQuery
              ? '검색된 관리자가 없습니다.'
              : '관리자가 없습니다. 위의 "관리자 추가" 버튼으로 새 관리자를 생성하세요.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  이름
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  아이디
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  활성화
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  마지막 로그인
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  생성일
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  <td style={{ padding: '0.75rem' }}>{admin.name}</td>
                  <td style={{ padding: '0.75rem' }}>{admin.username}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: admin.enabled ? '#d1fae5' : '#fee2e2',
                        color: admin.enabled ? '#065f46' : '#991b1b',
                      }}
                    >
                      {admin.enabled ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {formatDate(admin.lastLoginAt)}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {formatDate(admin.createdAt)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(admin)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: admin.enabled ? '#dc2626' : '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        {admin.enabled ? '비활성화' : '활성화'}
                      </button>
                      <button
                        onClick={() => handleViewLogs(admin)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        접속 기록
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
  );
}

