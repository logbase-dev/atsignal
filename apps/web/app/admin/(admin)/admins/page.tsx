'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminList } from '@/components/admin/admins/AdminList';
import type { Admin } from '@/lib/admin/types';
import { getAdmins, toggleAdminEnabled } from '@/lib/admin/adminService';

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdmins();
      setAdmins(data.admins || []);
    } catch (err: any) {
      console.error('Failed to load admins:', err);
      setError(err.message || '관리자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await toggleAdminEnabled(id);
    await loadAdmins();
  };

  const handleCreate = () => {
    router.push('/admin/admins/new');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>관리자 관리</h1>
        <button
          onClick={handleCreate}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
          }}
        >
          관리자 추가
        </button>
      </div>

      {error ? (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '0.5rem' }}>{error}</div>
      ) : null}

      <AdminList admins={admins} loading={loading} onDelete={handleDelete} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </div>
  );
}


