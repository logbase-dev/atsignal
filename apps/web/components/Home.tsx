'use client';

import Link from "next/link";
import { getMenuByPath, pathToUrl } from "@/utils/menu";
import { useEffect, useState, useRef } from "react";
import { defaultLocale } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';
import NewsletterModal from '@/components/Newsletter/NewsletterModal';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

interface HomeProps {
  locale?: string;
}

export default function Home({ locale }: HomeProps) {
  // locale prop이 있으면 사용, 없으면 defaultLocale 사용
  const currentLocale = locale || defaultLocale;
  const translation = translations[currentLocale as keyof typeof translations] ?? translations[defaultLocale];
  
  // ko.json은 항상 있으므로 fallback으로 사용 (en.json에 없을 수 있음)
  const rollingTexts = translation.home?.rollingTexts ?? translations.ko.home.rollingTexts;
  
  const homeMenu = getMenuByPath('/Direct link');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const statsSectionRef = useRef<HTMLElement>(null);
  const [statsValues, setStatsValues] = useState({
    events: 0,
    availability: 0,
    responseTime: 0,
    platforms: 0,
  });
  const hasAnimatedRef = useRef(false);
  const [activeFeature, setActiveFeature] = useState<string>('log-collecting');
  const featureRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    // 첫 번째 전환은 1초 후
    const firstTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % rollingTexts.length);
      
      // 그 다음부터는 2초마다 순환
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % rollingTexts.length);
      }, 2000);
    }, 1000);

    return () => {
      clearTimeout(firstTimeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [rollingTexts.length]);

  // 카운트업 애니메이션
  useEffect(() => {
    if (!statsSectionRef.current || hasAnimatedRef.current) return;

    const checkIfInCenter = () => {
      if (!statsSectionRef.current) return false;
      
      const rect = statsSectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportCenter = viewportHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      
      // 요소의 중앙이 뷰포트 중앙의 ±150px 범위 내에 있는지 확인
      return Math.abs(elementCenter - viewportCenter) < 150;
    };

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      
      hasAnimatedRef.current = true;
      
      // 애니메이션 지속 시간 (밀리초)
      const duration = 2000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 이징 함수 (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setStatsValues({
          events: Math.floor(easeOut * 10000000),
          availability: easeOut * 99.99,
          responseTime: Math.floor(easeOut * 100),
          platforms: Math.floor(easeOut * 50),
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 최종 값 설정
          setStatsValues({
            events: 10000000,
            availability: 99.99,
            responseTime: 100,
            platforms: 50,
          });
        }
      };

      requestAnimationFrame(animate);
    };

    // IntersectionObserver로 요소가 보이는지 확인
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && checkIfInCenter() && !hasAnimatedRef.current) {
            startAnimation();
            observer.disconnect();
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    observer.observe(statsSectionRef.current);

    // requestAnimationFrame을 사용하여 주기적으로 중앙 위치 체크
    let rafId: number | null = null;
    const checkPosition = () => {
      if (hasAnimatedRef.current) return;
      
      if (checkIfInCenter()) {
        startAnimation();
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        observer.disconnect();
      } else {
        rafId = requestAnimationFrame(checkPosition);
      }
    };

    // 스크롤 이벤트로 트리거
    const handleScroll = () => {
      if (hasAnimatedRef.current) return;
      if (rafId === null) {
        rafId = requestAnimationFrame(checkPosition);
      }
    };

    // 초기 체크
    if (checkIfInCenter()) {
      startAnimation();
      observer.disconnect();
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
      // 주기적으로 체크 시작
      rafId = requestAnimationFrame(checkPosition);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Scroll spy for features section
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-feature-id');
          if (id) {
            setActiveFeature(id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Use setTimeout to ensure refs are set
    const timeoutId = setTimeout(() => {
      Object.values(featureRefs.current).forEach((ref) => {
        if (ref) {
          observer.observe(ref);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      id: 'log-collecting',
      title: 'Log Collecting',
      description: '다양한 디지털 채널에서 발생하는 사용자 행동 로그를 안정적으로 수집하고 표준화합니다. 웹, 모바일, 서버 등 모든 채널을 지원합니다.',
      link: pathToUrl("/Product/Product@signal/Log Collecting", currentLocale),
      number: 1,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: '사용자 여정, 퍼널, 리텐션, 캠페인 효과 등 다양한 관점에서 분석 리포트를 제공합니다. 실시간 대시보드로 즉각적인 인사이트를 확인하세요.',
      link: pathToUrl("/Product/Product@signal/Analytics", currentLocale),
      number: 2,
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: '외부 BI, CDP, MMP, CRM 등 다양한 플랫폼과 연동하여 데이터 활용의 확장성을 높입니다. 50개 이상의 주요 플랫폼을 지원합니다.',
      link: pathToUrl("/Product/Product@signal/Integration", currentLocale),
      number: 3,
    },
  ];

  return (
    <div className="main dark-mode">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div>
            <h1 className="hero-title">
              <span className="rolling-text-container">
                {rollingTexts.map((text, index) => {
                  const isActive = index === currentIndex;
                  const isPrev = index === (currentIndex - 1 + rollingTexts.length) % rollingTexts.length;
                  const isNext = index === (currentIndex + 1) % rollingTexts.length;
                  return (
                    <span
                      key={`${text}-${index}`}
                      className={`rolling-text ${isActive ? 'active' : ''} ${isPrev ? 'prev' : ''} ${isNext && !isActive && !isPrev ? 'next' : ''}`}
                    >
                      {text}
                    </span>
                  );
                })}
              </span>
            </h1>
            <p className="hero-description">
              {homeMenu?.description || '핵심 가치의 전달에 집중, 제품의 기능보다 문제 해결과 가치 중심으로 기술'}
            </p>
            <div className="hero-buttons">
              <Link
                href="/Pricing/Contact Sales"
                className="btn-primary"
              >
                Get Demo
              </Link>
              <Link
                href="/Pricing/Information"
                className="btn-secondary"
              >
                Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* signal main-image Section */}
      <section className="section section-gray">
        <div className="section-container">
          <img
            src="/images/signal-main-image.png"
            alt="signal main image"
            style={{
              width: '100%',
              maxWidth: '1200px',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              borderRadius: '1rem',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
            }}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsSectionRef} className="section section-gray">
        <div className="section-container">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                {(statsValues.events / 1000000).toFixed(1)}M+
              </div>
              <div className="stat-label">이벤트/초 처리</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                {statsValues.availability.toFixed(2)}%
              </div>
              <div className="stat-label">가용성</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                &lt; {statsValues.responseTime}ms
              </div>
              <div className="stat-label">평균 응답 시간</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                {statsValues.platforms}+
              </div>
              <div className="stat-label">연동 플랫폼</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section section-white">
        <div className="section-container">
          <div className="features-layout">
            {/* Left Sidebar - Fixed */}
            <div className="features-sidebar">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  className={`feature-nav-item ${activeFeature === feature.id ? 'active' : ''}`}
                  onClick={() => {
                    const element = featureRefs.current[feature.id];
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {feature.title}
                </button>
              ))}
            </div>

            {/* Right Content - Scrollable */}
            <div className="features-content">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  ref={(el) => {
                    featureRefs.current[feature.id] = el;
                  }}
                  data-feature-id={feature.id}
                  className="feature-card"
                >
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
                    {feature.number}
                  </div>
                  <h3 className="card-title">
                    {feature.title}
                  </h3>
                  <p className="card-description">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.link}
                    className="card-link"
                  >
                    자세히 보기 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="section section-gray">
        <div className="section-container">
          <h2 className="section-title">
            팀별 솔루션
          </h2>
          <div className="grid">
            <div className="card">
              <img 
                src="/images/fi_263142.svg" 
                alt="프로덕트 조직 아이콘" 
                style={{ width: '48px', height: '48px', marginBottom: '1rem' }}
              />
              <h3 className="card-title">프로덕트 조직</h3>
              <p className="card-description">
                퍼널 분석, A/B 테스트, UX 개선 등 제품 개발에 필요한 모든 데이터 분석 도구를 제공합니다.
              </p>
              <Link href={pathToUrl("/Solutions/By Team/Product/Funnel", currentLocale)} className="card-link">
                제품 솔루션 보기 →
              </Link>
            </div>
            <div className="card">
              <img 
                src="/images/fi_263126.svg" 
                alt="마케팅 조직 아이콘" 
                style={{ width: '48px', height: '48px', marginBottom: '1rem' }}
              />
              <h3 className="card-title">마케팅 조직</h3>
              <p className="card-description">
                AARRR 프레임워크, 코호트 분석, 어트리뷰션 모델링으로 마케팅 성과를 정확히 측정하세요.
              </p>
               <Link href={pathToUrl("/Solutions/By Team/Marketing/AARRR", currentLocale)} className="card-link">
                마케팅 솔루션 보기 →
              </Link>
            </div>
            <div className="card">
              <img 
                src="/images/fi_263074.svg" 
                alt="테크 & 개발 조직 아이콘" 
                style={{ width: '48px', height: '48px', marginBottom: '1rem' }}
              />
              <h3 className="card-title">테크 & 개발 조직</h3>
              <p className="card-description">
                로그 모니터링, 에러 추적, Core Web Vitals 측정으로 안정적인 서비스를 운영하세요.
              </p>
               <Link href={pathToUrl("/Solutions/By Team/Engineering/Log Monitoring", currentLocale)} className="card-link">
                엔지니어링 솔루션 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section section-white">
        <div className="section-container">
          <h2 className="section-title">
            AtSignal을 선택하는 이유
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">실시간 데이터 처리 및 분석</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">엔터프라이즈급 보안 및 규정 준수</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">확장 가능한 아키텍처</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">24/7 기술 지원</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">직관적인 대시보드 및 리포트</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">빠른 도입 및 온보딩</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="section section-gray">
        <div className="section-container">
          <h2 className="section-title">
            고객 성공 사례
          </h2>
          <div className="grid">
            <div className="card">
              <h3 className="card-title">전환율 30% 향상</h3>
              <p className="card-description">
                "AtSignal의 퍼널 분석을 통해 구매 프로세스의 병목 지점을 발견하고 개선하여 전환율을 30% 향상시켰습니다."
              </p>
              <div className="testimonial-author">
                - 이커머스 기업 A사
              </div>
            </div>
            <div className="card">
              <h3 className="card-title">마케팅 ROI 2배 증가</h3>
              <p className="card-description">
                "어트리뷰션 모델링을 통해 각 채널의 실제 기여도를 파악하고 예산을 재배분하여 마케팅 ROI를 2배로 늘렸습니다."
              </p>
              <div className="testimonial-author">
                - 핀테크 기업 B사
              </div>
            </div>
            <div className="card">
              <h3 className="card-title">시스템 안정성 개선</h3>
              <p className="card-description">
                "실시간 로그 모니터링과 에러 추적 기능으로 장애를 사전에 예방하고 시스템 가용성을 99.9%로 향상시켰습니다."
              </p>
              <div className="testimonial-author">
                - SaaS 기업 C사
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-gray section-text-center">
        <div className="section-container">
          <div className="form-container">
            <h2 className="section-title">
              지금 시작하세요
            </h2>
            <p className="cta-description">
              Newsletter를 구독하고 최신 소식을 받아보세요
            </p>
            <div className="form-row">
              <input
                type="email"
                placeholder="이메일 주소"
                className="form-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsNewsletterModalOpen(true);
                  }
                }}
              />
              <button
                className="form-button"
                onClick={() => setIsNewsletterModalOpen(true)}
                type="button"
              >
                구독하기
              </button>
            </div>
          </div>
        </div>
      </section>

      <NewsletterModal
        isOpen={isNewsletterModalOpen}
        onClose={() => setIsNewsletterModalOpen(false)}
        locale={currentLocale}
        initialEmail={emailInput}
      />
    </div>
  );
}

