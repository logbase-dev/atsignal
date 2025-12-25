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
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Firebase Functions 엔드포인트 URL
      // 환경변수로 관리하거나 설정 파일에서 가져오기
      const apiUrl = process.env.NEXT_PUBLIC_SUBSCRIBE_API_URL || 
                     'https://asia-northeast3-atsignal.cloudfunctions.net/subscribeNewsletterApi';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          company: formData.company.trim(),
          email: formData.email.trim(),
          phone: formData.phone,
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
      } else {
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
                placeholder={t.emailPlaceholder || 'example@email.com'}
              />
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

