'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getGlossaryById, updateGlossary, deleteGlossary } from '@/lib/admin/glossaryService';
import { GlossaryForm } from '@/components/admin/glossary/GlossaryForm';
import type { Glossary } from '@/lib/admin/types';

export default function EditAdminGlossaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [glossary, setGlossary] = useState<Glossary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) void loadGlossary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadGlossary = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getGlossaryById(id);
      if (!data) {
        alert('용어를 찾을 수 없습니다.');
        router.push('/admin/glossary');
        return;
      }
      setGlossary(data);
    } catch (error: any) {
      console.error('Failed to load glossary:', error);
      alert(error.message || '용어를 불러오는데 실패했습니다.');
      router.push('/admin/glossary');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (glossaryData: any) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateGlossary(id, glossaryData);
      router.push('/admin/glossary');
    } catch (error: any) {
      console.error('Failed to update glossary:', error);
      alert(error.message || '용어 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/glossary');
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await deleteGlossary(id);
      router.push('/admin/glossary');
    } catch (error: any) {
      console.error('Failed to delete glossary:', error);
      alert(error.message || '용어 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!glossary) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>용어 수정</h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>용어를 수정합니다.</p>
          </div>
          <button
            onClick={() => void handleDelete()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      </div>
      <GlossaryForm
        initialGlossary={glossary}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
      />
    </div>
  );
}

