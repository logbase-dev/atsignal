'use client';

import { useState, useRef, useEffect } from 'react';
import { defaultLocale } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  initialEmail?: string;
  variant?: 'newsletter' | 'demo' | 'sales' | 'event';
  customTitle?: string;
  customSubmitLabel?: string;
  eventId?: string; // 이벤트 참가 신청시 필요
}

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiry: string;
  privacyConsent: boolean;
}

export default function ContactModal({
  isOpen,
  onClose,
  locale = defaultLocale,
  initialEmail = '',
  variant = 'newsletter',
  customTitle,
  customSubmitLabel,
  eventId,
}: ContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const currentLocale = locale || defaultLocale;
  const t = translations[currentLocale as keyof typeof translations]?.newsletter ?? 
            translations.ko.newsletter;
  const isContactVariant = variant === 'demo' || variant === 'sales';
  const modalTitle =
    customTitle ||
    (variant === 'demo'
      ? '데모 요청하기'
      : variant === 'sales'
        ? '구입 문의하기'
        : variant === 'event'
          ? '이벤트 참가 신청'
          : t.title || '뉴스레터 구독');
  const submitLabel =
    customSubmitLabel ||
    (variant === 'demo'
      ? '요청하기'
      : variant === 'sales'
        ? '문의하기'
        : variant === 'event'
          ? '참가 신청하기'
          : t.submitButton || '구독하기');
  const modalDescription =
    variant === 'newsletter'
      ? t.description || '최신 소식과 업데이트를 받아보세요.'
      : variant === 'event'
        ? '이벤트 참가를 위한 정보를 입력해 주세요.'
        : '필요한 내용을 작성해 주세요.';

  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    inquiry: '',
    privacyConsent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
        inquiry: '',
        privacyConsent: false,
      });
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, initialEmail]);

  // 전화번호 포맷팅 (010-1234-5678)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이미 처리 중이면 무시 (중복 클릭 방지)
    if (isSubmitting) {
      console.log('[ContactModal] Already submitting, ignoring duplicate click');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
  
    try {
      // API URL 결정
      let apiUrl: string;
      if (variant === 'event') {
        // 이벤트 참가 신청 API - Next.js API Route 사용
        apiUrl = '/api/events/participate';
      } else if (variant === 'demo') {
        // 데모 요청 API - Next.js API Route 사용
        apiUrl = '/api/demo';
      } else if (variant === 'sales') {
        // 구매 문의 API - Next.js API Route 사용
        apiUrl = '/api/sales';
      } else {
        // 뉴스레터 구독 API - Next.js API Route 사용
        apiUrl = '/api/subscribe';
      }

      const requestBody = variant === 'event' 
        ? {
            eventId,
            name: formData.name.trim(),
            company: formData.company.trim(),
            email: formData.email.trim(),
            phone: formData.phone,
            privacyConsent: formData.privacyConsent,
          }
        : {
            name: formData.name.trim(),
            company: formData.company.trim(),
            email: formData.email.trim(),
            phone: formData.phone,
            inquiry: formData.inquiry.trim(),
            variant,
            privacyConsent: formData.privacyConsent,
          };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        // 2초 후 자동으로 닫기
        setTimeout(() => {
          onClose();
        }, 2000);
      } else if (variant === 'event') {
        // 이벤트 참가 신청 에러 처리
        setSubmitStatus('error');
        if (response.status === 409) {
          setErrorMessage(data.message || '이미 해당 이벤트에 참가신청 했습니다.');
        } else if (response.status === 403) {
          setErrorMessage(data.message || '권한이 없습니다.');
        } else if (response.status === 400) {
          setErrorMessage(data.message || '입력 정보를 확인해 주세요.');
        } else {
          setErrorMessage(data.message || '참가 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } else if (variant === 'demo') {
        // 데모 요청 에러 처리
        setSubmitStatus('error');
        if (response.status === 409) {
          setErrorMessage(data.message || '이미 데모 요청을 하셨습니다.');
        } else if (response.status === 400) {
          setErrorMessage(data.message || '입력 정보를 확인해 주세요.');
        } else {
          setErrorMessage(data.message || '데모 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } else if (variant === 'sales') {
        // 구매 문의 에러 처리
        setSubmitStatus('error');
        if (response.status === 409) {
          setErrorMessage(data.message || '이미 구매 문의를 하셨습니다.');
        } else if (response.status === 400) {
          setErrorMessage(data.message || '입력 정보를 확인해 주세요.');
        } else {
          setErrorMessage(data.message || '구매 문의 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } else if (response.status === 409 && data.error === 'ALREADY_SUBSCRIBED') {
        // ✅ 이미 구독 중인 경우 특별 처리
        setSubmitStatus('error');
        setErrorMessage(
          data.message || '이미 구독 중인 이메일입니다.'
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
          detail?.message?.includes('이미 존재하는 이메일') ||
          data.detail?.includes('AlreadyExistEmail')
        ) {
          setSubmitStatus('error');
          setErrorMessage(
            detail?.message || '이미 구독 중인 이메일입니다.'
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
      className="contact-modal"
      onClose={onClose}
      onCancel={(e) => e.preventDefault()} // ESC로 닫히지 않도록 방지
      aria-labelledby="contact-modal-title"
      aria-describedby="contact-modal-description"
    >
      <div className="contact-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="contact-modal-close"
          onClick={onClose}
          aria-label={t.closeButton || '닫기'}
          type="button"
        >
          ×
        </button>

        <h2 id="contact-modal-title" className="contact-modal-title">
          {modalTitle}
        </h2>
        <p id="contact-modal-description" className="contact-modal-description">
          {modalDescription}
        </p>

        {submitStatus === 'success' ? (
          <div className="contact-success-message">
            <svg
              className="contact-success-icon"
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
            <p>
              {variant === 'event' 
                ? '이벤트 참가 신청이 완료되었습니다!'
                : variant === 'demo'
                  ? '데모 요청이 완료되었습니다!'
                  : variant === 'sales'
                    ? '구매 문의가 완료되었습니다!'
                    : t.successMessage || '구독 신청이 완료되었습니다!'
              }
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="contact-form-group contact-form-inline">
              <label htmlFor="contact-name">
                {t.nameLabel || '성함'} <span className="required">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="contact-name"
                type="text"
                required
                minLength={2}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                placeholder={t.namePlaceholder || '성함을 입력하세요'}
              />
            </div>

            <div className="contact-form-group contact-form-inline">
              <label htmlFor="contact-company">
                {t.companyLabel || '소속/회사명'} <span className="required">*</span>
              </label>
              <input
                id="contact-company"
                type="text"
                required
                minLength={2}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={isSubmitting}
                placeholder={t.companyPlaceholder || '소속 또는 회사명을 입력하세요'}
              />
            </div>

            <div className="contact-form-group contact-form-inline">
              <label htmlFor="contact-email">
                {t.emailLabel || '이메일'} <span className="required">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
                placeholder={t.emailPlaceholder || 'example@email.com'}
              />
            </div>

            <div className="contact-form-group contact-form-inline">
              <label htmlFor="contact-phone">
                {t.phoneLabel || '휴대폰 번호'} <span className="required">*</span>
              </label>
              <input
                id="contact-phone"
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

            {isContactVariant && (
              <div className="contact-form-group">
                <label htmlFor="contact-inquiry">
                  문의/요청 내용 <span className="required">*</span>
                </label>
                <textarea
                  id="contact-inquiry"
                  required
                  minLength={5}
                  rows={4}
                  value={formData.inquiry}
                  onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="필요한 내용을 작성해 주세요"
                />
              </div>
            )}

            <div className="contact-form-group contact-checkbox-group">
              <label className="contact-checkbox-label">
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
                    className="contact-privacy-link"
                  >
                    ({t.privacyLink || '자세히 보기'})
                  </a>
                </span>
              </label>
            </div>

            {submitStatus === 'error' && errorMessage && (
              <div className="contact-error-message" role="alert">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="contact-submit-button"
            >
              {isSubmitting
                ? t.submitting || '처리 중...'
                : submitLabel}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}