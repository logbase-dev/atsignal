'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLoginLogList } from '@/components/admins/AdminLoginLogList';
import type { Admin } from '@/lib/admin/types';

export default function AdminLogsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAdmin(id);
    }
  }, [id]);

  const loadAdmin = async (adminId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admins/${adminId}`);
      if (!response.ok) {
        throw new Error('관리자 정보를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setAdmin(data.admin);
    } catch (err: any) {
      console.error('Failed to load admin:', err);
      setError(err.message || '관리자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      </div>
    );
  }

  if (error || !admin || !id) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '0.5rem',
          }}
        >
          {error || '관리자를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/admins')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '1rem',
          }}
        >
          ← 목록으로
        </button>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          관리자 접속 기록: {admin.name} ({admin.username})
        </h1>
        <p style={{ color: '#6b7280' }}>관리자의 로그인 기록을 확인합니다.</p>
      </div>

      <AdminLoginLogList
        adminId={id}
        adminName={admin.name}
        adminUsername={admin.username}
      />
    </div>
  );
}

