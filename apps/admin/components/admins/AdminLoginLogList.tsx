'use client';

import { useState, useEffect } from 'react';
import type { AdminLoginLog } from '@/lib/admin/types';

interface AdminLoginLogListProps {
  adminId: string;
  adminName: string;
  adminUsername: string;
}

export function AdminLoginLogList({ adminId, adminName, adminUsername }: AdminLoginLogListProps) {
  const [logs, setLogs] = useState<AdminLoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [hasMore, setHasMore] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: Record<string, string> = {};
      
      if (successFilter !== 'all') {
        filters.success = successFilter === 'success' ? 'true' : 'false';
      }

      // 날짜 필터
      const now = new Date();
      let startDate: Date | undefined;
      
      if (dateFilter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (startDate) {
        filters.startDate = startDate.toISOString();
      }

      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/admins/${adminId}/logs?${queryParams}`);
      
      if (!response.ok) {
        // API 응답에서 에러 메시지 가져오기
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || '접속 기록을 불러오는데 실패했습니다.';
        const errorDetails = errorData.details || '';
        
        // Firestore 인덱스 에러인 경우 특별 메시지
        if (errorData.requiresIndex) {
          throw new Error(`${errorMessage}\n\n${errorDetails || 'Firestore 인덱스가 필요합니다. 에러 메시지의 링크를 클릭하여 인덱스를 생성해주세요.'}`);
        }
        
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setHasMore(data.hasMore || false);
    } catch (err: any) {
      console.error('Failed to load login logs:', err);
      console.error('Error details:', err.message);
      setError(err.message || '접속 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [adminId, successFilter, dateFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return '-';
    
    // 간단한 브라우저 파싱
    if (userAgent.includes('Chrome')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return match ? `Chrome ${match[1]}` : 'Chrome';
    }
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return match ? `Firefox ${match[1]}` : 'Firefox';
    }
    if (userAgent.includes('Safari')) {
      return 'Safari';
    }
    if (userAgent.includes('Edge')) {
      return 'Edge';
    }
    
    return userAgent.substring(0, 50);
  };

  if (loading && logs.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 영역 */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
            성공/실패
          </label>
          <select
            value={successFilter}
            onChange={(e) => setSuccessFilter(e.target.value as 'all' | 'success' | 'failure')}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
            }}
          >
            <option value="all">전체</option>
            <option value="success">성공</option>
            <option value="failure">실패</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
            기간
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
            }}
          >
            <option value="all">전체</option>
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '0.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* 접속 기록 테이블 */}
      {logs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>접속 기록이 없습니다.</p>
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
                  일시
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  IP 주소
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  브라우저
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  성공 여부
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>
                  실패 사유
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
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
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {log.ipAddress || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {parseUserAgent(log.userAgent)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: log.success ? '#d1fae5' : '#fee2e2',
                        color: log.success ? '#065f46' : '#991b1b',
                      }}
                    >
                      {log.success ? '성공' : '실패'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {log.failureReason || '-'}
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

