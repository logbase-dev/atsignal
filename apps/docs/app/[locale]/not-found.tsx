'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  
  // pathname에서 locale 추출 (예: /ko/... 또는 /en/...)
  const localeMatch = pathname?.match(/^\/(ko|en)/);
  const locale = localeMatch ? localeMatch[1] : 'ko';

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={errorCodeStyle}>404</div>
        <h1 style={titleStyle}>페이지를 찾을 수 없습니다</h1>
        <p style={descriptionStyle}>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        
        <div style={buttonGroupStyle}>
          <Link href={`/${locale}`} className="not-found-primary-button" style={primaryButtonStyle}>
            홈으로 가기
          </Link>
          <button 
            onClick={() => router.back()} 
            className="not-found-secondary-button"
            style={secondaryButtonStyle}
            type="button"
          >
            이전으로 가기
          </button>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 200px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1.5rem',
  maxWidth: '1280px',
  margin: '0 auto',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '600px',
};

const errorCodeStyle: React.CSSProperties = {
  fontSize: '8rem',
  fontWeight: 700,
  color: '#2563eb',
  lineHeight: 1,
  marginBottom: '1rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '1rem',
  margin: '0 0 1rem 0',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  color: '#6b7280',
  marginBottom: '2.5rem',
  lineHeight: 1.6,
  margin: '0 0 2.5rem 0',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#2563eb',
  border: 'none',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 500,
  color: '#374151',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

