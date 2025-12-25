'use client';

import { useEffect, useState } from 'react';
import type { Admin } from '@/lib/admin/types';
import { getAdminApiUrl } from '@/lib/admin/api';

interface AdminFormProps {
  initialAdmin?: Admin | null;
  onSubmit: (data: { username?: string; password?: string; name: string; enabled: boolean }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const requiredMark = <span style={{ color: '#dc2626' }}>*</span>;

const labelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', fontWeight: 600, marginBottom: '0.5rem' };
const helpTextStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.95rem' };

export function AdminForm({ initialAdmin, onSubmit, onCancel, submitting }: AdminFormProps) {
  const isNew = !initialAdmin;
  const [formData, setFormData] = useState({
    username: initialAdmin?.username || '',
    password: '',
    passwordConfirm: '',
    name: initialAdmin?.name || '',
    enabled: initialAdmin?.enabled !== undefined ? initialAdmin.enabled : true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = async (username: string) => {
    if (!isNew || !username) return;
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setErrors((prev) => ({ ...prev, username: '영문, 숫자, 언더스코어만 사용 가능하며 3-20자여야 합니다.' }));
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(getAdminApiUrl(`admins?checkUsername=${encodeURIComponent(username.toLowerCase())}`), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.exists) {
          setErrors((prev) => ({ ...prev, username: '이미 사용 중인 아이디입니다.' }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.username;
            return next;
          });
        }
      }
    } catch (error) {
      console.error('Failed to check username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (isNew && formData.username) {
      const username = formData.username;
      const timeoutId = setTimeout(() => void checkUsername(username), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.username, isNew]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isNew) {
      if (!formData.username) {
        newErrors.username = '아이디를 입력해주세요.';
      } else {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(formData.username)) {
          newErrors.username = '영문, 숫자, 언더스코어만 사용 가능하며 3-20자여야 합니다.';
        }
      }
    }

    if (isNew) {
      if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
      else if (formData.password.length < 8) newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    if (formData.password && formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name) newErrors.name = '이름을 입력해주세요.';
    else if (formData.name.length > 50) newErrors.name = '이름은 50자 이하여야 합니다.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isNew && errors.username) {
      alert('아이디 중복을 확인해주세요.');
      return;
    }
    await onSubmit({
      username: isNew ? formData.username : undefined,
      password: formData.password || undefined,
      name: formData.name,
      enabled: formData.enabled,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div style={{ marginBottom: '2rem' }}>
        <label style={labelStyle}>아이디 {isNew && requiredMark}</label>
        {isNew ? (
          <>
            <p style={helpTextStyle}>로그인에 사용할 아이디입니다. 영문, 숫자, 언더스코어만 사용 가능합니다.</p>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
              style={{ ...inputStyle, borderColor: errors.username ? '#dc2626' : '#d1d5db' }}
              disabled={checkingUsername}
            />
            {checkingUsername ? <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>확인 중...</p> : null}
            {errors.username ? <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem' }}>{errors.username}</p> : null}
          </>
        ) : (
          <>
            <p style={helpTextStyle}>아이디는 수정할 수 없습니다.</p>
            <input type="text" value={formData.username} style={{ ...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} readOnly />
          </>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={labelStyle}>비밀번호 {isNew && requiredMark}</label>
        {isNew ? <p style={helpTextStyle}>최소 8자 이상의 비밀번호를 입력하세요.</p> : <p style={helpTextStyle}>비밀번호를 변경하려면 입력하세요. 비워두면 기존 비밀번호가 유지됩니다.</p>}
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
          placeholder={isNew ? undefined : '비밀번호 변경 시에만 입력'}
          style={{ ...inputStyle, borderColor: errors.password ? '#dc2626' : '#d1d5db' }}
        />
        {errors.password ? <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem' }}>{errors.password}</p> : null}
      </div>

      {(isNew || formData.password) ? (
        <div style={{ marginBottom: '2rem' }}>
          <label style={labelStyle}>비밀번호 확인 {requiredMark}</label>
          <p style={helpTextStyle}>비밀번호를 다시 입력하세요.</p>
          <input
            type="password"
            value={formData.passwordConfirm}
            onChange={(e) => setFormData((p) => ({ ...p, passwordConfirm: e.target.value }))}
            style={{ ...inputStyle, borderColor: errors.passwordConfirm ? '#dc2626' : '#d1d5db' }}
          />
          {errors.passwordConfirm ? (
            <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem' }}>{errors.passwordConfirm}</p>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginBottom: '2rem' }}>
        <label style={labelStyle}>이름 {requiredMark}</label>
        <p style={helpTextStyle}>관리자 이름을 입력하세요.</p>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          style={{ ...inputStyle, borderColor: errors.name ? '#dc2626' : '#d1d5db' }}
        />
        {errors.name ? <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem' }}>{errors.name}</p> : null}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData((p) => ({ ...p, enabled: e.target.checked }))} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
          <span style={{ fontWeight: 600 }}>활성화</span>
        </label>
        <p style={helpTextStyle}>비활성화된 관리자는 로그인할 수 없습니다.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.95rem' }} disabled={submitting}>
          취소
        </button>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: submitting ? '#9ca3af' : '#0070f3', color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 600 }} disabled={submitting}>
          {submitting ? '저장 중...' : isNew ? '생성' : '저장'}
        </button>
      </div>
    </form>
  );
}


