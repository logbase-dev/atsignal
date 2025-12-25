import Link from 'next/link';
import { MenuItem } from '@/types/menu';
import { getChildrenByPrefix, pathToUrl } from '@/utils/menu';
import { defaultLocale, Locale } from '@/lib/i18n/getLocale';

interface PageRendererProps {
  item: MenuItem;
  locale?: Locale;
}

// 벌크 데이터 생성 함수들
function generateFeatures(item: MenuItem): string[] {
  const featureMap: Record<string, string[]> = {
    'Log Collecting': [
      '실시간 로그 수집 및 스트리밍',
      '다중 채널 지원 (웹, 모바일, 서버)',
      '자동 스키마 검증 및 표준화',
      '99.9% 수집 안정성 보장',
      '수집량 모니터링 및 알림',
    ],
    'Ingestion Pipeline': [
      '실시간 및 배치 처리 지원',
      '데이터 전처리 및 변환',
      '중복 제거 및 데이터 품질 관리',
      '확장 가능한 파이프라인 아키텍처',
      '자동 장애 복구 및 재처리',
    ],
    'Intra Engine': [
      'AI 기반 이상 탐지',
      '자동 이벤트 식별',
      '데이터 누락 보정',
      '실시간 데이터 검증',
      '머신러닝 기반 패턴 분석',
    ],
    'Analytics': [
      '실시간 대시보드',
      '사용자 여정 분석',
      '퍼널 및 전환율 분석',
      '리텐션 코호트 분석',
      '커스텀 리포트 생성',
    ],
    'Integrations': [
      '50+ 외부 플랫폼 연동',
      'REST API 및 Webhook 지원',
      'ETL 파이프라인 구축',
      '실시간 데이터 동기화',
      '양방향 데이터 연동',
    ],
  };

  return featureMap[item.name] || [
    '고성능 데이터 처리',
    '확장 가능한 아키텍처',
    '실시간 모니터링',
    '엔터프라이즈급 보안',
    '24/7 기술 지원',
  ];
}

function generateStats(): { label: string; value: string }[] {
  return [
    { label: '처리 속도', value: '10M+ 이벤트/초' },
    { label: '가용성', value: '99.99%' },
    { label: '응답 시간', value: '< 100ms' },
    { label: '데이터 정확도', value: '99.9%' },
  ];
}

function generateUseCases(item: MenuItem): { title: string; description: string }[] {
  const useCaseMap: Record<string, { title: string; description: string }[]> = {
    'Funnel Analysis': [
      {
        title: '전환율 최적화',
        description: '구매 퍼널의 각 단계별 이탈률을 분석하여 개선 포인트를 도출하고 전환율을 30% 향상시켰습니다.',
      },
      {
        title: '사용자 여정 개선',
        description: '사용자가 목표 행동에 도달하기까지의 경로를 시각화하여 UX 개선 전략을 수립했습니다.',
      },
    ],
    'A/B Test': [
      {
        title: 'UI/UX 실험',
        description: '두 가지 버전의 랜딩 페이지를 비교하여 전환율이 높은 버전을 선별하고 배포했습니다.',
      },
      {
        title: '기능 출시 검증',
        description: '신규 기능의 사용자 반응을 측정하여 롤백 여부를 데이터 기반으로 결정했습니다.',
      },
    ],
    'Customer LTV': [
      {
        title: '마케팅 ROI 최적화',
        description: '고객 생애 가치를 예측하여 마케팅 예산을 효율적으로 배분하고 ROI를 2배 향상시켰습니다.',
      },
      {
        title: '고객 세그먼트 관리',
        description: 'LTV에 따라 고객을 분류하고 맞춤형 마케팅 전략을 수립하여 리텐션을 개선했습니다.',
      },
    ],
  };

  return useCaseMap[item.name] || [
    {
      title: '데이터 기반 의사결정',
      description: '실시간 데이터 분석을 통해 비즈니스 인사이트를 도출하고 전략적 의사결정을 지원합니다.',
    },
    {
      title: '성능 최적화',
      description: '시스템 성능 지표를 모니터링하여 병목 지점을 파악하고 개선하여 사용자 경험을 향상시킵니다.',
    },
  ];
}

function generateBenefits(item: MenuItem): string[] {
  return [
    '비즈니스 성장 가속화',
    '데이터 기반 의사결정 지원',
    '운영 효율성 향상',
    '고객 경험 개선',
    '비용 절감 및 ROI 극대화',
  ];
}

export default function PageRenderer({ item, locale = defaultLocale }: PageRendererProps) {
  const children = getChildrenByPrefix(item.fullPath);
  const hasChildren = children.length > 0;
  const features = generateFeatures(item);
  const stats = generateStats();
  const useCases = generateUseCases(item);
  const benefits = generateBenefits(item);
  const category = item.depth1;
  const isBlog = item.fullPath.includes('Blogs@signal');

  return (
    <div className={isBlog ? '' : 'dark-mode'}>
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div>
            <h1 className="hero-title">{item.name}</h1>
            <p className="hero-description">{item.description}</p>
            <div className="hero-buttons">
              {item.url ? (
                <a
                  href={`https://${item.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  공식 문서 보기
                </a>
              ) : (
                <Link href={pathToUrl("/Pricing/Contact Sales", locale)} className="btn-primary">
                  무료 체험 시작하기
                </Link>
              )}
              <Link href={pathToUrl("/Pricing/Information", locale)} className="btn-secondary">
                가격 정보
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section section-white">
        <div className="section-container">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {stats.map((stat, index) => (
              <div key={index} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--blue-600)', marginBottom: '0.5rem' }}>
                  {stat.value}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section section-gray">
        <div className="section-container">
          <h2 className="section-title">주요 기능</h2>
          <div className="grid">
            {features.map((feature, index) => (
              <div key={index} className="card">
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  borderRadius: '0.5rem', 
                  background: 'linear-gradient(135deg, var(--blue-600), var(--blue-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                <h3 className="card-title" style={{ fontSize: '1.125rem' }}>{feature}</h3>
                <p className="card-description">
                  {item.name}의 핵심 기능으로, 안정적이고 확장 가능한 솔루션을 제공합니다.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      {useCases.length > 0 && (
        <section className="section section-white">
          <div className="section-container">
            <h2 className="section-title">사용 사례</h2>
            <div className="grid">
              {useCases.map((useCase, index) => (
                <div key={index} className="card">
                  <h3 className="card-title">{useCase.title}</h3>
                  <p className="card-description">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="section section-gray">
        <div className="section-container">
          <h2 className="section-title">기대 효과</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <div className="benefit-icon">
                  ✓
                </div>
                <span className="benefit-text">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Children Section */}
      {hasChildren && (
        <section className="section section-white">
          <div className="section-container">
            <h2 className="section-title">관련 항목</h2>
            <div className="grid">
              {children.map((child) => (
                <div key={child.fullPath} className="card">
                  <h3 className="card-title">{child.name}</h3>
                  <p className="card-description">{child.description}</p>
                  <Link href={pathToUrl(child.fullPath, locale)} className="card-link">
                    자세히 보기 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="section section-gray section-text-center">
        <div className="section-container">
          <div className="form-container">
            <h2 className="section-title">지금 시작하세요</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', marginBottom: '2rem' }}>
              {item.name}를 통해 데이터 기반 의사결정의 첫걸음을 내딛어보세요
            </p>
            <div className="form-row">
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                className="form-input"
              />
              <button className="form-button">
                무료 체험 시작
              </button>
            </div>
            <p className="form-footer-text">
              신용카드 불필요 · 14일 무료 체험 · 언제든지 취소 가능
            </p>
          </div>
        </div>
      </section>
    </>
    </div>
  );
}
