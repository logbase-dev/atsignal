'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getFAQById, updateFAQ, deleteFAQ } from '@/lib/admin/faqService';
import { FAQForm } from '@/components/faq/FAQForm';
import type { FAQ } from '@/lib/admin/types';

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadFAQ();
    }
  }, [id]);

  const loadFAQ = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getFAQById(id);
      if (!data) {
        alert('FAQ를 찾을 수 없습니다.');
        router.push('/faq');
        return;
      }
      setFaq(data);
    } catch (error: any) {
      console.error('Failed to load FAQ:', error);
      alert(error.message || 'FAQ를 불러오는데 실패했습니다.');
      router.push('/faq');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (faqData: {
    question: { ko: string; en?: string };
    answer: { ko: string; en?: string };
    categoryId?: string;
    level: number;
    isTop: boolean;
    enabled: { ko: boolean; en: boolean };
    tags?: string[];
    order?: number;
    editorType?: 'nextra' | 'toast';
    saveFormat?: 'markdown' | 'html';
  }) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateFAQ(id, faqData);
      router.push('/faq');
    } catch (error: any) {
      console.error('Failed to update FAQ:', error);
      alert(error.message || 'FAQ 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/faq');
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      await deleteFAQ(id);
      router.push('/faq');
    } catch (error: any) {
      console.error('Failed to delete FAQ:', error);
      alert(error.message || 'FAQ 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!faq) {
    return null;
  }

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>FAQ 수정</h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>FAQ를 수정합니다.</p>
          </div>
          <button
            onClick={handleDelete}
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
      <FAQForm initialFAQ={faq} onSubmit={handleSubmit} onCancel={handleCancel} submitting={submitting} />
    </div>
  );
}

