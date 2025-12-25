'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminForm } from '@/components/admins/AdminForm';

export default function NewAdminPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    username?: string;
    password?: string;
    name: string;
    enabled: boolean;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '관리자 생성에 실패했습니다.');
      }

      const result = await response.json();
      router.push(`/admins/${result.id}`);
    } catch (error: any) {
      console.error('Failed to create admin:', error);
      alert(error.message || '관리자 생성에 실패했습니다.');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admins');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>관리자 추가</h1>
        <p style={{ color: '#6b7280' }}>새 관리자 계정을 생성합니다.</p>
      </div>

      <AdminForm
        initialAdmin={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
      />
    </div>
  );
}

