import Link from 'next/link';

export function generateStaticParams() {
  return [
    { locale: 'ko' },
    { locale: 'en' },
  ];
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamicParams = false;

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  const sections = [
    {
      title: 'Administrator',
      description: '시스템 관리 및 설정 가이드',
      href: `/${locale}/administrator`,
      icon: '⚙️',
    },
    {
      title: 'Onboarding guide',
      description: 'AtSignal 시작하기 가이드',
      href: `/${locale}/onboarding-guide`,
      icon: '🚀',
    },
    {
      title: 'Integration',
      description: '다양한 플랫폼과의 통합 방법',
      href: `/${locale}/integration`,
      icon: '🔌',
    },
    {
      title: 'API',
      description: 'API 레퍼런스 및 사용 예제',
      href: `/${locale}/api`,
      icon: '📡',
    },
    {
      title: 'Data structure',
      description: '데이터 구조 및 스키마 설명',
      href: `/${locale}/data-structure`,
      icon: '📊',
    },
    {
      title: 'Technical tips',
      description: '기술 팁 및 베스트 프랙티스',
      href: `/${locale}/technical-tips`,
      icon: '💡',
    },
    {
      title: 'Benchmark',
      description: '성능 벤치마크 및 비교',
      href: `/${locale}/benchmark`,
      icon: '📈',
    },
  ];

  return (
    <div style={containerStyle}>
      <div className="docs-hero">
        <h1 className="docs-hero-title">AtSignal Documentation</h1>
        <p className="docs-hero-description">
          통합 행동데이터 플랫폼 AtSignal의 완전한 문서를 찾아보세요.
        </p>
      </div>

      <div className="docs-sections-grid">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="docs-card" style={cardStyle}>
            <div style={cardIconStyle}>{section.icon}</div>
            <h2 style={cardTitleStyle}>{section.title}</h2>
            <p style={cardDescriptionStyle}>{section.description}</p>
          </Link>
        ))}
      </div>

      <div style={popularSectionStyle}>
        <h2 style={popularTitleStyle}>인기 콘텐츠</h2>
        <div className="docs-popular-list">
          <Link href={`/${locale}/onboarding-guide/getting-started`} className="docs-popular-item" style={popularItemStyle}>
            <span style={popularItemTitleStyle}>시작하기</span>
            <span style={popularItemDescStyle}>AtSignal을 처음 사용하는 경우</span>
          </Link>
          <Link href={`/${locale}/api/authentication`} className="docs-popular-item" style={popularItemStyle}>
            <span style={popularItemTitleStyle}>인증 가이드</span>
            <span style={popularItemDescStyle}>API 인증 방법</span>
          </Link>
          <Link href={`/${locale}/integration/webhook`} className="docs-popular-item" style={popularItemStyle}>
            <span style={popularItemTitleStyle}>Webhook 설정</span>
            <span style={popularItemDescStyle}>Webhook 연동 방법</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '2rem 1.5rem',
};



const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '2rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  textDecoration: 'none',
  transition: 'all 0.2s',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const cardIconStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '1rem',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '0.5rem',
  margin: '0 0 0.5rem 0',
};

const cardDescriptionStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.6,
  margin: 0,
};

const popularSectionStyle: React.CSSProperties = {
  marginTop: '4rem',
  paddingTop: '3rem',
  borderTop: '1px solid #e5e7eb',
};

const popularTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '1.5rem',
  margin: '0 0 1.5rem 0',
};


const popularItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  transition: 'all 0.2s',
};

const popularItemTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '0.25rem',
};

const popularItemDescStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
};

