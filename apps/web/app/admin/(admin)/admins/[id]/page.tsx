'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminForm } from '@/components/admin/admins/AdminForm';
import type { Admin } from '@/lib/admin/types';
import { getAdminById, updateAdmin } from '@/lib/admin/adminService';

export default function EditAdminPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) void loadAdmin(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAdmin = async (adminId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminById(adminId);
      setAdmin(data);
    } catch (err: any) {
      console.error('Failed to load admin:', err);
      setError(err.message || '관리자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { username?: string; password?: string; name: string; enabled: boolean }) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateAdmin(id, { password: data.password, name: data.name, enabled: data.enabled });
      router.push('/admin/admins');
    } catch (error: any) {
      console.error('Failed to update admin:', error);
      alert(error.message || '관리자 수정에 실패했습니다.');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/admins');
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <p style={{ color: '#6b7280' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '0.5rem' }}>{error}</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <p style={{ color: '#6b7280' }}>관리자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>관리자 수정</h1>
        <p style={{ color: '#6b7280' }}>관리자 정보를 수정합니다.</p>
      </div>

      <AdminForm initialAdmin={admin} onSubmit={handleSubmit} onCancel={handleCancel} submitting={submitting} />
    </div>
  );
}


