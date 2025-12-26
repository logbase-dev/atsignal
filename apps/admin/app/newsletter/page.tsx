// apps/admin/app/newsletter/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface Subscriber {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  status?: string;
  subscribedAt?: string;
  [key: string]: any; // Stibee API 응답의 추가 필드
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/newsletter/subscribers');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '구독자 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      // Stibee API 응답 형식에 따라 조정 필요
      setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
    } catch (error: any) {
      console.error('Failed to load subscribers:', error);
      setError(error.message || '구독자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px', margin: '0 auto' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
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
          onClick={loadSubscribers}
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
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Newsletter 구독자</h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            총 {subscribers.length}명의 구독자가 있습니다.
          </p>
        </div>
        <button
          onClick={loadSubscribers}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          새로고침
        </button>
      </div>

      {subscribers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>구독자가 없습니다.</p>
        </div>
      ) : (
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
                  <td style={{ padding: '0.75rem 1rem' }}>{subscriber.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{subscriber.name || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{subscriber.company || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{subscriber.phone || '-'}</td>
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
                    {subscriber.subscribedAt
                      ? new Date(subscriber.subscribedAt).toLocaleDateString('ko-KR')
                      : '-'}
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