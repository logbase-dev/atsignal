'use client';

import { useState, useEffect } from 'react';
import {
  getFAQCategories,
  deleteFAQCategory,
  isCategoryInUse,
} from '@/lib/admin/faqCategoryService';
import type { FAQCategory } from '@/lib/admin/types';

interface FAQCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQCategoryModal({ isOpen, onClose }: FAQCategoryModalProps) {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태 추가
  const [formData, setFormData] = useState({
    nameKo: '',
    nameEn: '',
    descriptionKo: '',
    descriptionEn: '',
    order: 0,
    enabled: {
      ko: true,
      en: true,
    },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/faq-categories');
      if (!response.ok) {
        throw new Error('카테고리를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      setError(error.message || '카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setFormData({
      nameKo: '',
      nameEn: '',
      descriptionKo: '',
      descriptionEn: '',
      order: categories.length > 0 ? Math.max(...categories.map((c) => c.order)) + 1 : 1,
      enabled: {
        ko: true,
        en: true,
      },
    });
  };

  const handleEditClick = (category: FAQCategory) => {
    setEditingCategory(category);
    setFormData({
      nameKo: category.name.ko,
      nameEn: category.name.en || '',
      descriptionKo: category.description?.ko || '',
      descriptionEn: category.description?.en || '',
      order: category.order,
      enabled: category.enabled,
    });
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({
      nameKo: '',
      nameEn: '',
      descriptionKo: '',
      descriptionEn: '',
      order: categories.length > 0 ? Math.max(...categories.map((c) => c.order)) + 1 : 1, // 0에서 변경
      enabled: {
        ko: true,
        en: true,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nameKo.trim()) {
      alert('카테고리명(한국어)을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const categoryData = {
        name: {
          ko: formData.nameKo.trim(),
          ...(formData.nameEn.trim() ? { en: formData.nameEn.trim() } : {}),
        },
        description: formData.descriptionKo.trim() || formData.descriptionEn.trim()
          ? {
              ko: formData.descriptionKo.trim(),
              ...(formData.descriptionEn.trim() ? { en: formData.descriptionEn.trim() } : {}),
            }
          : undefined,
        order: formData.order,
        enabled: formData.enabled,
      };

      if (editingCategory?.id) {
        // 수정: API 호출
        const response = await fetch(`/api/faq-categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '카테고리 수정에 실패했습니다.');
        }
      } else {
        // 생성: API 호출
        const response = await fetch('/api/faq-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '카테고리 생성에 실패했습니다.');
        }
      }

      await loadCategories();
      handleCancel();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      setError(error.message || '카테고리 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: FAQCategory) => {
    if (!category.id) return;

    // 카테고리 사용 여부 확인
    const inUse = await isCategoryInUse(category.id);
    
    if (inUse) {
      alert('이 카테고리를 사용하는 FAQ가 있어서 삭제할 수 없습니다. 먼저 해당 FAQ의 카테고리를 변경해주세요.');
      return;
    }

    if (!confirm(`정말 "${category.name.ko}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteFAQCategory(category.id);
      await loadCategories();
      if (editingCategory?.id === category.id) {
        handleCancel();
      }
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  // 필터링된 카테고리 목록
  const filteredCategories = categories.filter((category) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.ko.toLowerCase().includes(query) ||
      (category.name.en && category.name.en.toLowerCase().includes(query)) ||
      (category.description?.ko && category.description.ko.toLowerCase().includes(query)) ||
      (category.description?.en && category.description.en.toLowerCase().includes(query))
    );
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '0.5rem',
          width: '90%',
          maxWidth: '950px', // 800px에서 1000px로 변경
          maxHeight: '95vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>카테고리 관리</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '0.25rem',
              marginBottom: '1rem',
              color: '#856404',
            }}
          >
            <strong>경고:</strong> {error}
          </div>
        )}

        {/* 카테고리 추가 버튼 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleAddClick}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            카테고리 추가
          </button>
        </div>

        {/* 카테고리 추가/수정 폼 */}
        {(!editingCategory || editingCategory.id) && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {editingCategory ? '카테고리 수정' : '카테고리 추가'}
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                카테고리명 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={formData.nameKo}
                    onChange={(e) => setFormData({ ...formData, nameKo: e.target.value })}
                    required
                    placeholder="한국어 (예: 일반)"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="영어 (예: General)"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                설명 (선택사항)
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={formData.descriptionKo}
                    onChange={(e) => setFormData({ ...formData, descriptionKo: e.target.value })}
                    placeholder="한국어 설명"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="영어 설명"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                정렬 순서
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                min="0"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
              />
              <small style={{ color: '#666', fontSize: '0.875rem' }}>낮은 숫자가 먼저 표시됩니다.</small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={formData.enabled.ko}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabled: { ...formData.enabled, ko: e.target.checked },
                        })
                      }
                      style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }}
                    />
                    한글 카테고리 활성화
                  </label>
                  <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    한글 사이트에 카테고리를 표시합니다.
                  </small>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={formData.enabled.en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabled: { ...formData.enabled, en: e.target.checked },
                        })
                      }
                      style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }}
                    />
                    영문 카테고리 활성화
                  </label>
                  <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    영문 사이트에 카테고리를 표시합니다.
                  </small>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? '저장 중...' : editingCategory ? '수정' : '추가'}
              </button>
            </div>
          </form>
        )}

        {/* 카테고리 목록 */}
        {loading ? (
          <p>로딩 중...</p>
        ) : categories.length === 0 ? (
          <p style={{ color: '#666' }}>카테고리가 없습니다. 위의 "카테고리 추가" 버튼으로 카테고리를 생성하세요.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>카테고리 목록 ({filteredCategories.length}개)</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="카테고리 검색..."
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  fontSize: '0.9rem',
                  width: '250px',
                }}
              />
            </div>
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', fontWeight: 600 }}>카테고리명</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', fontWeight: 600 }}>설명</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', fontWeight: 600 }}>순서</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', fontWeight: 600 }}>활성화</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e5e5', fontSize: '0.875rem', fontWeight: 600 }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => (
                      <tr key={category.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            <div>{category.name.ko}</div>
                            {category.name.en && (
                              <div style={{ color: '#666', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                {category.name.en}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#666' }}>
                          {category.description?.ko || category.description?.en || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{category.order}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontSize: '0.8rem' }}>
                            {category.enabled.ko && <span style={{ color: '#28a745' }}>KO</span>}
                            {category.enabled.ko && category.enabled.en && <span style={{ margin: '0 0.25rem' }}>/</span>}
                            {category.enabled.en && <span style={{ color: '#28a745' }}>EN</span>}
                            {!category.enabled.ko && !category.enabled.en && <span style={{ color: '#dc3545' }}>비활성화</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleEditClick(category)}
                            style={{
                              marginRight: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#666',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

