'use client';

import { useState, useRef, useEffect } from 'react';
import { defaultLocale } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  initialEmail?: string;
}

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  privacyConsent: boolean;
}

export default function NewsletterModal({
  isOpen,
  onClose,
  locale = defaultLocale,
  initialEmail = '',
}: NewsletterModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const currentLocale = locale || defaultLocale;
  const t = translations[currentLocale as keyof typeof translations]?.newsletter ?? 
            translations.ko.newsletter;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    privacyConsent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [emailWarning, setEmailWarning] = useState<string>('');

  // 퍼블릭 이메일 도메인 리스트
  const PUBLIC_DOMAINS = new Set([
    'gmail.com',
    'naver.com',
    'daum.net',
    'hanmail.net',
    'kakao.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'yahoo.com',
    'yahoo.co.kr',
    'proton.me',
    'protonmail.com',
  ]);

  // 이메일 도메인 추출
  const extractEmailDomain = (email: string): string => {
    const parts = email.trim().toLowerCase().split('@');
    return parts.length === 2 ? parts[1] : '';
  };

  // 회사 이메일 여부 판별
  const isCompanyEmail = (email: string): boolean => {
    const domain = extractEmailDomain(email);
    if (!domain) return false;
    return !PUBLIC_DOMAINS.has(domain);
  };

  // 이메일 validation
  const validateEmail = (email: string): { valid: boolean; isCompany: boolean; warning?: string } => {
    const trimmed = email.trim();
    
    // @ 기준 체크
    if (!trimmed.includes('@')) {
      return { valid: false, isCompany: false };
    }

    // 기본 이메일 형식 체크
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, isCompany: false };
    }

    const isCompany = isCompanyEmail(trimmed);
    const warning = !isCompany 
      ? '회사 이메일 사용을 권장합니다. 회사 이메일을 입력하시면 더 정확한 자료와 B2B 콘텐츠를 받아보실 수 있습니다.'
      : undefined;

    return { valid: true, isCompany, warning };
  };

  // 모달 열기/닫기 처리
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      // 모달이 열릴 때 initialEmail이 있으면 폼에 설정
      if (initialEmail) {
        setFormData((prev) => ({
          ...prev,
          email: initialEmail,
        }));
      }
      // 모달이 완전히 렌더링된 후 성함 입력 필드에 포커스
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      // ESC 키로 닫기 (기본 동작)
    } else {
      dialogRef.current?.close();
      // 모달이 닫힐 때 항상 폼 초기화
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        privacyConsent: false,
      });
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, initialEmail]);

  // 모달 외부 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // 전화번호 포맷팅 (숫자만 입력, 11자리 체크, 하이폰 자동 추가)
  const formatPhoneNumber = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 11자리 제한 (010으로 시작하는 11자리)
    const limited = numbers.slice(0, 11);
    
    // 하이폰 자동 추가
    if (limited.length <= 3) return limited;
    if (limited.length <= 7) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    // 이메일 validation 및 경고 메시지 업데이트
    if (email.trim()) {
      const validation = validateEmail(email);
      setEmailWarning(validation.warning || '');
    } else {
      setEmailWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setEmailWarning('');
  
    try {
      // 정규화 및 재검증
      const emailTrimmed = formData.email.trim().toLowerCase();
      const emailValidation = validateEmail(emailTrimmed);
      
      if (!emailValidation.valid) {
        setSubmitStatus('error');
        setErrorMessage('이메일 형식이 올바르지 않습니다. (@ 표시가 필요합니다)');
        setIsSubmitting(false);
        return;
      }

      // 휴대폰 번호 정규화 (숫자만 추출)
      const phoneDigits = formData.phone.replace(/[^\d]/g, '');
      
      // 11자리 체크 (010으로 시작)
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith('010')) {
        setSubmitStatus('error');
        setErrorMessage('휴대폰 번호는 010으로 시작하는 11자리 숫자여야 합니다.');
        setIsSubmitting(false);
        return;
      }

      // 모든 환경에서 Next.js API Route 프록시 사용 (CORS 문제 방지)
      // App Hosting에서 /api/* 경로가 403으로 차단되므로 /subscribe-api 사용
      const apiUrl = '/subscribe-api';

      // 정규화된 값으로 전송 (이메일: lowercase, 휴대폰: 숫자만)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          company: formData.company.trim(),
          email: emailTrimmed, // 정규화된 이메일
          phone: phoneDigits, // 정규화된 휴대폰 번호 (숫자만)
          privacyConsent: formData.privacyConsent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        // 2초 후 자동으로 닫기
        setTimeout(() => {
          onClose();
        }, 2000);
      } else if (response.status === 409 && data.error === 'ALREADY_SUBSCRIBED') {
        // ✅ 이미 구독 중인 경우 특별 처리
        setSubmitStatus('error');
        setErrorMessage(
          data.message || '이미 구독 신청한 이메일입니다.'
        );
      } else if (response.status === 502 && data.error === 'STIBEE_SYNC_FAILED') {
        // ✅ Stibee API 에러 처리 (이미 존재하는 이메일 포함)
        let detail: any = null;
        try {
          detail = typeof data.detail === 'string' ? JSON.parse(data.detail) : data.detail;
        } catch {
          detail = null;
        }

        // ✅ 이미 존재하는 이메일인 경우
        if (
          detail?.code === 'Errors.List.AlreadyExistEmail' ||
          detail?.message?.includes('이미 구독 중') ||
          data.detail?.includes('AlreadyExistEmail')
        ) {
          setSubmitStatus('error');
          setErrorMessage(
            detail?.message || '이미 구독 신청한 이메일입니다.'
          );
        } else {
          // 기타 Stibee 에러
          setSubmitStatus('error');
          setErrorMessage(
            data.message || data.error || t.errorMessage || '구독 신청 중 오류가 발생했습니다.'
          );
        }
      } else {
        // 기타 에러 처리
        setSubmitStatus('error');
        setErrorMessage(
          data.message || data.error || t.errorMessage || '오류가 발생했습니다.'
        );
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : t.errorMessage || '오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="newsletter-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="newsletter-modal-title"
      aria-describedby="newsletter-modal-description"
    >
      <div className="newsletter-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="newsletter-modal-close"
          onClick={onClose}
          aria-label={t.closeButton || '닫기'}
          type="button"
        >
          ×
        </button>

        <h2 id="newsletter-modal-title" className="newsletter-modal-title">
          {t.title || '뉴스레터 구독'}
        </h2>
        <p id="newsletter-modal-description" className="newsletter-modal-description">
          {t.description || '최신 소식과 업데이트를 받아보세요.'}
        </p>

        {submitStatus === 'success' ? (
          <div className="newsletter-success-message">
            <svg
              className="newsletter-success-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>{t.successMessage || '구독 신청이 완료되었습니다!'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form">
            <div className="newsletter-form-group">
              <label htmlFor="newsletter-name">
                {t.nameLabel || '성함'} <span className="required">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="newsletter-name"
                type="text"
                required
                minLength={2}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                placeholder={t.namePlaceholder || '성함을 입력하세요'}
              />
            </div>

            <div className="newsletter-form-group">
              <label htmlFor="newsletter-company">
                {t.companyLabel || '소속/회사명'} <span className="required">*</span>
              </label>
              <input
                id="newsletter-company"
                type="text"
                required
                minLength={2}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={isSubmitting}
                placeholder={t.companyPlaceholder || '소속 또는 회사명을 입력하세요'}
              />
            </div>

            <div className="newsletter-form-group">
              <label htmlFor="newsletter-email">
                {t.emailLabel || '이메일'} <span className="required">*</span>
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={formData.email}
                onChange={handleEmailChange}
                disabled={isSubmitting}
                placeholder={t.emailPlaceholder || 'example@email.com'}
              />
              {emailWarning && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffc107', 
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#856404'
                }}>
                  ⚠️ {emailWarning}
                </div>
              )}
            </div>

            <div className="newsletter-form-group">
              <label htmlFor="newsletter-phone">
                {t.phoneLabel || '휴대폰 번호'} <span className="required">*</span>
              </label>
              <input
                id="newsletter-phone"
                type="tel"
                required
                pattern="010-\d{4}-\d{4}"
                maxLength={13}
                value={formData.phone}
                onChange={handlePhoneChange}
                disabled={isSubmitting}
                placeholder={t.phonePlaceholder || '010-1234-5678'}
              />
            </div>

            <div className="newsletter-form-group newsletter-checkbox-group">
              <label className="newsletter-checkbox-label">
                <input
                  type="checkbox"
                  required
                  checked={formData.privacyConsent}
                  onChange={(e) =>
                    setFormData({ ...formData, privacyConsent: e.target.checked })
                  }
                  disabled={isSubmitting}
                />
                <span>
                  {t.privacyConsent || '개인정보 처리방침에 동의합니다.'}{' '}
                  <span className="required">*</span>
                  <a
                    href={`/${locale}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="newsletter-privacy-link"
                  >
                    ({t.privacyLink || '자세히 보기'})
                  </a>
                </span>
              </label>
            </div>

            {submitStatus === 'error' && errorMessage && (
              <div className="newsletter-error-message" role="alert">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="newsletter-submit-button"
            >
              {isSubmitting
                ? t.submitting || '처리 중...'
                : t.submitButton || '구독하기'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

