'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createGlossary } from '@/lib/admin/glossaryService';
import { GlossaryForm } from '@/components/admin/glossary/GlossaryForm';

export default function NewAdminGlossaryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (glossaryData: any) => {
    setSubmitting(true);
    try {
      await createGlossary(glossaryData);
      router.push('/admin/glossary');
    } catch (error: any) {
      console.error('Failed to create glossary:', error);
      alert(error.message || '용어 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/glossary');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ← 목록으로
          </button>
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>용어 추가</h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>새로운 용어를 추가합니다.</p>
        </div>
      </div>
      <GlossaryForm onSubmit={handleSubmit} onCancel={handleCancel} submitting={submitting} />
    </div>
  );
}

