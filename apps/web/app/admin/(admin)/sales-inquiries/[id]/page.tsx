'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSalesInquiryById, updateSalesInquiry, deleteSalesInquiry } from '@/lib/admin/salesInquiryService';
import type { SalesInquiry } from '@/lib/admin/types';
import { adminFetch } from '@/lib/admin/api';

export default function SalesInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [salesInquiry, setSalesInquiry] = useState<SalesInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'pending' as SalesInquiry['status'],
    notes: '',
  });
  
  const salesInquiryId = params?.id as string;

  useEffect(() => {
    void loadAdmins();
    if (salesInquiryId) {
      void loadSalesInquiry();
    }
  }, [salesInquiryId]);

  const loadAdmins = async () => {
    try {
      const response = await adminFetch('admins');
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const adminMap = new Map<string, { name: string; username: string }>();
        (data.admins || []).forEach((admin: { id?: string; name: string; username: string }) => {
          if (admin.id) adminMap.set(admin.id, { name: admin.name, username: admin.username });
        });
        setAdmins(adminMap);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const loadSalesInquiry = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalesInquiryById(salesInquiryId);
      if (data) {
        setSalesInquiry(data);
        setEditForm({
          status: data.status,
          notes: data.notes || '',
        });
      } else {
        setError('구입문의를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Failed to load sales inquiry:', err);
      setError(err.message || '구입문의를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: SalesInquiry['status']) => {
    if (!salesInquiry) return;
    
    try {
      const updates: Partial<SalesInquiry> = { 
        status: newStatus,
        updatedAt: new Date(),
      };
      
      // 상태가 contacted로 변경되면 contactedAt 설정
      if (newStatus === 'contacted' && salesInquiry.status !== 'contacted') {
        updates.contactedAt = new Date();
      }

      await updateSalesInquiry(salesInquiryId, updates);
      await loadSalesInquiry(); // 데이터 새로고침
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleNotesUpdate = async () => {
    if (!salesInquiry) return;
    
    try {
      await updateSalesInquiry(salesInquiryId, { 
        notes: editForm.notes,
        updatedAt: new Date(),
      });
      setIsEditing(false);
      await loadSalesInquiry(); // 데이터 새로고침
    } catch (err: any) {
      console.error('Failed to update notes:', err);
      alert('메모 업데이트에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!salesInquiry) return;
    
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSalesInquiry(salesInquiryId);
        router.push('/admin/sales-inquiries');
      } catch (err: any) {
        console.error('Failed to delete sales inquiry:', err);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: SalesInquiry['status']) => {
    const statusConfig = {
      pending: { label: '대기중', color: '#856404', bgColor: '#fff3cd' },
      contacted: { label: '연락완료', color: '#055160', bgColor: '#cff4fc' },
      completed: { label: '처리완료', color: '#0f5132', bgColor: '#d1e7dd' },
      cancelled: { label: '취소', color: '#41464b', bgColor: '#e2e3e5' },
    };
    
    const config = statusConfig[status] || { label: status, color: '#6c757d', bgColor: '#e2e3e5' };
    return (
      <span
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          borderRadius: '0.5rem',
          color: config.color,
          backgroundColor: config.bgColor,
        }}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !salesInquiry) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '0.25rem',
          color: '#721c24',
          marginBottom: '1rem',
        }}>
          <strong>오류:</strong> {error || '구입문의를 찾을 수 없습니다.'}
        </div>
        <Link
          href="/admin/sales-inquiries"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.25rem',
          }}
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>구입문의 상세</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getStatusBadge(salesInquiry.status)}
            <span style={{ color: '#666', fontSize: '0.875rem' }}>
              신청일시: {formatDate(salesInquiry.createdAt)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/admin/sales-inquiries"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* 신청자 정보 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>신청자 정보</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                성함
              </label>
              <div style={{ fontSize: '1rem', color: '#111827' }}>{salesInquiry.name}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                회사명
              </label>
              <div style={{ fontSize: '1rem', color: '#111827' }}>{salesInquiry.company}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                이메일
              </label>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                <a href={`mailto:${salesInquiry.email}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                  {salesInquiry.email}
                </a>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                전화번호
              </label>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                <a href={`tel:${salesInquiry.phone}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                  {salesInquiry.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 문의내용 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>문의내용</h2>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            fontSize: '0.875rem',
            color: '#374151',
          }}>
            {salesInquiry.inquiry}
          </div>
        </div>

        {/* 상태 관리 및 처리 정보 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>처리 관리</h3>
          
          {/* 상태 관리와 메모를 한 줄로 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* 상태 관리 */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: '#374151' }}>상태 관리</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <select
                  value={salesInquiry.status}
                  onChange={(e) => handleStatusChange(e.target.value as SalesInquiry['status'])}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    minWidth: '150px',
                  }}
                >
                  <option value="pending">대기중</option>
                  <option value="contacted">연락완료</option>
                  <option value="completed">처리완료</option>
                  <option value="cancelled">취소</option>
                </select>
                {getStatusBadge(salesInquiry.status)}
              </div>
              {salesInquiry.contactedAt && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  연락일시: {formatDate(salesInquiry.contactedAt)}
                </div>
              )}
            </div>

            {/* 메모 */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: '#374151' }}>메모</h4>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="메모를 입력하세요..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleNotesUpdate}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({ ...editForm, notes: salesInquiry.notes || '' });
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      minHeight: '80px',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      color: salesInquiry.notes ? '#374151' : '#9ca3af',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5',
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsEditing(true)}
                  >
                    {salesInquiry.notes || '메모를 추가하려면 클릭하세요...'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      메모 편집
                    </button>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span>처리일시: {formatDate(salesInquiry.updatedAt)}</span>
                      {salesInquiry.updatedBy && (
                        <span>수정자: {admins.get(salesInquiry.updatedBy)?.name || '알 수 없음'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}