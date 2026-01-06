'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createFAQ } from '@/lib/admin/faqService';
import { FAQForm } from '@/components/faq/FAQForm';

export default function NewFAQPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      await createFAQ(faqData);
      router.push('/faq');
    } catch (error: any) {
      console.error('Failed to create FAQ:', error);
      alert(error.message || 'FAQ 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/faq');
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
          <h1 style={{ fontSize: '2rem', margin: 0 }}>FAQ 추가</h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>새로운 FAQ를 추가합니다.</p>
        </div>
      </div>
      <FAQForm onSubmit={handleSubmit} onCancel={handleCancel} submitting={submitting} />
    </div>
  );
}

