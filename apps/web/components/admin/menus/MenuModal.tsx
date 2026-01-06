'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildMenuTree, flattenMenuTree } from '@/utils/adminMenuTree';
import type { Menu, PageType, Site } from '@/lib/admin/types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (menuData: {
    labels: { ko: string; en?: string };
    path: string;
    pageType?: PageType;
    depth: number;
    parentId: string;
    order: number;
    enabled: { ko: boolean; en: boolean };
    description?: { ko: string; en?: string };
  }) => Promise<void>;
  site: Site;
  parentMenus: Menu[];
  initialMenu?: Menu;
}

export function MenuModal({ isOpen, onClose, onSubmit, site, parentMenus, initialMenu }: MenuModalProps) {
  const [formData, setFormData] = useState({
    labelKo: '',
    labelEn: '',
    descriptionKo: '',
    descriptionEn: '',
    path: '',
    pageType: 'dynamic' as PageType,
    depth: 1,
    parentId: '0',
    order: 1,
    enabled: { ko: true, en: false },
  });

  const [pathError, setPathError] = useState<string>('');
  const [pathManuallyEdited, setPathManuallyEdited] = useState(false);
  const [showPageTypeTooltip, setShowPageTypeTooltip] = useState(false);

  const sortedParentMenus = useMemo(() => {
    const validMenus = parentMenus.filter((menu): menu is Menu & { id: string } => Boolean(menu.id));
    const tree = buildMenuTree(validMenus);
    return flattenMenuTree(tree);
  }, [parentMenus]);

  useEffect(() => {
    setPathManuallyEdited(false);
    setPathError('');

    if (initialMenu) {
      if (initialMenu.id) {
        setFormData({
          labelKo: initialMenu.labels.ko,
          labelEn: initialMenu.labels.en || '',
          descriptionKo: initialMenu.description?.ko || '',
          descriptionEn: initialMenu.description?.en || '',
          path: initialMenu.path,
          pageType: initialMenu.pageType || 'dynamic',
          depth: initialMenu.depth,
          parentId: initialMenu.parentId || '0',
          order: initialMenu.order,
          enabled: initialMenu.enabled,
        });
      } else {
        const parentId = initialMenu.parentId || '0';
        const parent = parentMenus.find((m) => m.id === parentId);
        const parentPath = parent?.path || '';
        const initialPath = parentPath ? `${parentPath}/` : '';

        const maxOrder = parentMenus.length > 0 ? Math.max(...parentMenus.map((m) => m.order)) + 1 : 1;

        setFormData({
          labelKo: '',
          labelEn: '',
          descriptionKo: '',
          descriptionEn: '',
          path: initialPath,
          pageType: 'dynamic',
          depth: initialMenu.depth,
          parentId,
          order: initialMenu.order || maxOrder,
          enabled: initialMenu.enabled || { ko: true, en: false },
        });
      }
      return;
    }

    const maxOrder = parentMenus.length > 0 ? Math.max(...parentMenus.map((m) => m.order)) + 1 : 1;
    setFormData({
      labelKo: '',
      labelEn: '',
      descriptionKo: '',
      descriptionEn: '',
      path: '',
      pageType: 'dynamic',
      depth: 1,
      parentId: '0',
      order: maxOrder,
      enabled: { ko: true, en: false },
    });
  }, [initialMenu, isOpen, parentMenus, site]);

  const validatePath = (path: string, allowTrailingSlash: boolean = false): string => {
    if (!path) return '';
    const hasKorean = /[\uAC00-\uD7A3]/.test(path);
    if (hasKorean) return '경로에는 한글을 사용할 수 없습니다. 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용하세요.';
    const validPattern = /^[a-z0-9\-_\/]+$/;
    if (!validPattern.test(path)) return '경로는 영문 소문자, 숫자, 하이픈(-), 언더스코어(_), 슬래시(/)만 사용할 수 있습니다.';
    if (path.includes('//')) return '연속된 슬래시(//)는 사용할 수 없습니다.';
    if (path.startsWith('/')) return '경로는 슬래시(/)로 시작할 수 없습니다.';
    if (!allowTrailingSlash && path.endsWith('/')) return '경로는 슬래시(/)로 끝날 수 없습니다.';
    return '';
  };

  const checkPathDuplicate = (path: string): string => {
    if (!path || formData.pageType === 'links') return '';
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (!normalizedPath) return '';

    const existingMenus = parentMenus.filter((menu) => {
      if (initialMenu?.id && menu.id === initialMenu.id) return false;
      return menu.site === site && menu.pageType !== 'links';
    });

    const duplicate = existingMenus.find((menu) => {
      const existingPath = menu.path.endsWith('/') ? menu.path.slice(0, -1) : menu.path;
      return existingPath === normalizedPath;
    });

    if (duplicate) {
      return `이미 사용 중인 경로입니다. (메뉴: ${duplicate.labels.ko}${duplicate.labels.en ? ` / ${duplicate.labels.en}` : ''})`;
    }
    return '';
  };

  const convertLabelToPath = (label: string): string => {
    if (!label) return '';
    let path = label.replace(/\s+/g, '-').toLowerCase();
    path = path.replace(/[^a-z0-9\-_]/g, '');
    path = path.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    return path;
  };

  const handleLabelEnChange = (value: string) => {
    setFormData({ ...formData, labelEn: value });
    if (initialMenu?.id || pathManuallyEdited || formData.pageType === 'links') return;

    const convertedPath = convertLabelToPath(value);
    if (convertedPath) {
      if (formData.parentId && formData.parentId !== '0') {
        const parent = sortedParentMenus.find((m) => m.id === formData.parentId);
        const parentPath = parent?.path || '';
        const newPath = parentPath ? `${parentPath}/${convertedPath}` : convertedPath;
        const formatError = validatePath(newPath);
        const duplicateError = formatError ? '' : checkPathDuplicate(newPath);
        setPathError(formatError || duplicateError);
        setFormData((prev) => ({ ...prev, labelEn: value, path: newPath }));
      } else {
        const formatError = validatePath(convertedPath);
        const duplicateError = formatError ? '' : checkPathDuplicate(convertedPath);
        setPathError(formatError || duplicateError);
        setFormData((prev) => ({ ...prev, labelEn: value, path: convertedPath }));
      }
    } else {
      if (formData.parentId && formData.parentId !== '0') {
        const parent = sortedParentMenus.find((m) => m.id === formData.parentId);
        const parentPath = parent?.path || '';
        const newPath = parentPath ? `${parentPath}/` : '';
        setFormData((prev) => ({ ...prev, labelEn: value, path: newPath }));
      } else {
        setFormData((prev) => ({ ...prev, labelEn: value, path: '' }));
      }
      setPathError('');
    }
  };

  const handlePathChange = (value: string) => {
    setPathManuallyEdited(true);
    if (formData.pageType === 'links') {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (value && !urlPattern.test(value) && !value.startsWith('http://') && !value.startsWith('https://')) {
        setPathError('올바른 URL 형식을 입력하세요. (예: https://docs.example.com/admin/test)');
      } else {
        setPathError('');
      }
      setFormData({ ...formData, path: value });
      return;
    }

    let sanitizedPath = value.replace(/\s+/g, '-').toLowerCase();
    const allowTrailingSlash = sanitizedPath.endsWith('/');
    const formatError = validatePath(sanitizedPath, allowTrailingSlash);
    const duplicateError = formatError ? '' : checkPathDuplicate(sanitizedPath);
    setPathError(formatError || duplicateError);
    setFormData({ ...formData, path: sanitizedPath });
  };

  const handleParentChange = (parentId: string) => {
    if (parentId && parentId !== '0') {
      const parent = sortedParentMenus.find((m) => m.id === parentId);
      if (parent) {
        const parentPath = parent.path || '';
        const initialPath = parentPath ? `${parentPath}/` : '';
        const error = initialPath ? validatePath(initialPath, true) : '';
        setPathError(error);
        setFormData({ ...formData, parentId, depth: parent.depth + 1, path: initialPath });
      }
      return;
    }
    setFormData({ ...formData, parentId: '0', depth: 1, path: '' });
    setPathError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pageType !== 'links') {
      const finalPath = formData.path.endsWith('/') ? formData.path.slice(0, -1) : formData.path;
      const formatError = validatePath(finalPath);
      const duplicateError = formatError ? '' : checkPathDuplicate(finalPath);
      const isEdit = Boolean(initialMenu?.id);

      // 형식 오류는 항상 저장 불가
      if (formatError) {
        setPathError(formatError);
        alert('경로 형식이 올바르지 않습니다. 경로를 확인해주세요.');
        return;
      }

      // 중복 경로는 경고는 유지하되:
      // - 수정: confirm 후 진행
      // - 생성: 기존대로 저장 불가
      if (duplicateError) {
        setPathError(duplicateError);

        if (isEdit) {
          const ok = confirm(`중복 경로입니다.\n\n${duplicateError}\n\n그래도 수정하시겠습니까?`);
          if (!ok) return;
        } else {
          alert('이미 사용 중인 경로입니다. 경로를 확인해주세요.');
          return;
        }
      }
    }

    if (formData.pageType === 'links' && formData.path) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.path) && !formData.path.startsWith('http://') && !formData.path.startsWith('https://')) {
        setPathError('올바른 URL 형식을 입력하세요. (예: https://docs.example.com/admin/test)');
        alert('URL 형식이 올바르지 않습니다. URL을 확인해주세요.');
        return;
      }
    }

    try {
      await onSubmit({
        labels: { ko: formData.labelKo, en: formData.labelEn || undefined },
        path:
          formData.pageType === 'links'
            ? formData.path
            : formData.path.endsWith('/')
              ? formData.path.slice(0, -1)
              : formData.path,
        pageType: formData.pageType,
        depth: formData.depth,
        parentId: formData.parentId || '0',
        order: formData.order,
        enabled: formData.enabled,
        description:
          formData.descriptionKo || formData.descriptionEn
            ? { ko: formData.descriptionKo, en: formData.descriptionEn || undefined }
            : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save menu:', error);
      alert('저장에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  const isEdit = Boolean(initialMenu?.id);
  const submitFinalPath =
    formData.pageType === 'links'
      ? formData.path
      : formData.path.endsWith('/')
        ? formData.path.slice(0, -1)
        : formData.path;
  const submitFormatError = formData.pageType === 'links' ? '' : validatePath(submitFinalPath);
  const submitDuplicateError =
    formData.pageType === 'links' ? '' : !submitFormatError ? checkPathDuplicate(submitFinalPath) : '';
  const isSubmitDisabled = Boolean(submitFormatError) || (!isEdit && Boolean(submitDuplicateError));

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
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '0.5rem',
          width: '90%',
          maxWidth: '1000px',
          maxHeight: '95vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          {initialMenu?.id ? '메뉴 수정' : initialMenu ? '하위메뉴 추가' : '메뉴 추가'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  한글 메뉴명 <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.labelKo}
                  onChange={(e) => setFormData({ ...formData, labelKo: e.target.value })}
                  required
                  placeholder="한국어 (예: 제품)"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>영문 메뉴명</label>
                <input
                  type="text"
                  value={formData.labelEn}
                  onChange={(e) => handleLabelEnChange(e.target.value)}
                  placeholder="영어 (예: Products)"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  영문 메뉴명 입력 시 경로가 자동으로 생성됩니다.
                </small>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>한글 설명</label>
                <textarea
                  value={formData.descriptionKo}
                  onChange={(e) => setFormData({ ...formData, descriptionKo: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>영문 설명</label>
                <textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 'bold' }}>
                {formData.pageType === 'links' ? 'URL' : '경로'} <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                <label style={{ fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                    onMouseEnter={() => setShowPageTypeTooltip(true)}
                    onMouseLeave={() => setShowPageTypeTooltip(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'help', color: '#6b7280' }}>
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <text x="8" y="11" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">
                        i
                      </text>
                    </svg>
                    {showPageTypeTooltip && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-60%)',
                          marginBottom: '0.5rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#1f2937',
                          color: '#fff',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                          lineHeight: '1.6',
                          whiteSpace: 'normal',
                          maxWidth: '700px',
                          width: 'max-content',
                          minWidth: '500px',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          pointerEvents: 'none',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>페이지 타입 설명</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div>
                            <strong>동적페이지:</strong> 관리자 페이지에서 동적으로 생성하는 페이지입니다.
                          </div>
                          <div>
                            <strong>정적페이지:</strong> 외부에서 코딩하여 배포한 정적 페이지입니다.
                          </div>
                          <div>
                            <strong>게시판:</strong> 외부에서 코딩하여 배포한 게시판 페이지입니다.
                          </div>
                          <div>
                            <strong>외부링크:</strong> 다른 사이트로 이동하는 링크입니다.
                          </div>
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '60%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1f2937',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  페이지 타입 <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={formData.pageType}
                  onChange={(e) => {
                    const newPageType = e.target.value as PageType;
                    setFormData({ ...formData, pageType: newPageType, path: newPageType === 'links' ? '' : formData.path });
                    setPathError('');
                  }}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem', fontSize: '0.9rem', minWidth: '150px' }}
                >
                  <option value="dynamic">동적페이지</option>
                  <option value="static">정적페이지</option>
                  <option value="notice">게시판</option>
                  <option value="links">외부링크</option>
                </select>
              </div>
            </div>

            <input
              type="text"
              value={formData.path}
              onChange={(e) => handlePathChange(e.target.value)}
              required
              placeholder={formData.pageType === 'links' ? '예: https://docs.atsignal.io/ko/admin' : '예: product/log-collecting'}
              style={{ width: '100%', padding: '0.5rem', border: `1px solid ${pathError ? '#dc3545' : '#ddd'}`, borderRadius: '0.25rem' }}
            />
            {pathError ? (
              <small style={{ color: '#dc3545', display: 'block', marginTop: '0.25rem', fontSize: '0.875rem' }}>{pathError}</small>
            ) : null}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  부모 메뉴 <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => handleParentChange(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                >
                  <option value="0">없음 (최상위) [Depth: 1]</option>
                  {sortedParentMenus
                    .filter((m) => !(initialMenu && m.id === initialMenu.id))
                    .map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {`${'— '.repeat(Math.max(menu.depth - 1, 0))}[Depth: ${menu.depth}] ${menu.labels.ko}${menu.labels.en ? ` / ${menu.labels.en}` : ''} (${menu.path})`}
                      </option>
                    ))}
                </select>
                <small style={{ color: '#666', display: 'block', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  Depth: {formData.depth} (부모 선택 시 자동 계산)
                </small>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  순서 <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  required
                  min="1"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.25rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled.ko}
                    onChange={(e) => setFormData({ ...formData, enabled: { ...formData.enabled, ko: e.target.checked } })}
                    style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }}
                  />
                  한글 메뉴 활성화
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled.en}
                    onChange={(e) => setFormData({ ...formData, enabled: { ...formData.enabled, en: e.target.checked } })}
                    style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }}
                  />
                  영문 메뉴 활성화
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSubmitDisabled ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                opacity: isSubmitDisabled ? 0.6 : 1,
              }}
            >
              {initialMenu?.id ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


