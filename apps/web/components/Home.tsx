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
  const rollingAnnouncements = [
    '[1.공지] atsignal 베타 서비스 오픈 안내',
    '[2.이벤트] atsignal 무료 데모 체험 이벤트',
    '[3.이벤트] 로그 진단 무료 컨설팅 이벤트 (선착순 10개 기업)',
    '[4.공지] atsignal admin / CMS 업데이트 안내',
    '[5.이벤트] atsignal 뉴스레터 구독 이벤트',
  ];
  const rollingBannerText = rollingAnnouncements.join('                         '); // 25 spaces
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);
  
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
  const featuresContentRef = useRef<HTMLDivElement>(null);
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

  const features = [
    {
      id: 'log-collecting',
      title: 'Log Collecting',
      description: '다양한 디지털 채널에서 발생하는 사용자 행동 로그를 안정적으로 수집하고 표준화합니다. 웹, 모바일, 서버 등 모든 채널을 지원합니다.',
      link: pathToUrl("/product/product-atsignal/log-collecting", currentLocale),
      number: 1,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: '사용자 여정, 퍼널, 리텐션, 캠페인 효과 등 다양한 관점에서 분석 리포트를 제공합니다. 실시간 대시보드로 즉각적인 인사이트를 확인하세요.',
      link: pathToUrl("/product/product-atsignal/analytics", currentLocale),
      number: 2,
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: '외부 BI, CDP, MMP, CRM 등 다양한 플랫폼과 연동하여 데이터 활용의 확장성을 높입니다. 50개 이상의 주요 플랫폼을 지원합니다.',
      link: pathToUrl("/product/product-atsignal/integrations", currentLocale),
      number: 3,
    },
  ];


  // 마우스 드래그로 좌우 스크롤
  useEffect(() => {
    const featuresContent = featuresContentRef.current;
    if (!featuresContent) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    // 초기 스크롤 위치를 0으로 설정 (1번 카드가 좌측 끝에 오도록)
    featuresContent.scrollLeft = 0;

    // 마우스 다운 이벤트
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX - featuresContent.offsetLeft;
      scrollLeft = featuresContent.scrollLeft;
      featuresContent.style.cursor = 'grabbing';
      featuresContent.style.userSelect = 'none';
    };

    // 마우스 이동 이벤트
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - featuresContent.offsetLeft;
      const walk = (x - startX) * 1.5; // 드래그 속도 조절 (1.5배)
      
      // 스크롤 가능한 범위 계산
      const maxScrollLeft = featuresContent.scrollWidth - featuresContent.clientWidth;
      
      // 스크롤 위치를 0과 최대값 사이로 제한
      const newScrollLeft = scrollLeft - walk;
      featuresContent.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
    };

    // 마우스 업 이벤트
    const handleMouseUp = () => {
      isDragging = false;
      featuresContent.style.cursor = 'grab';
      featuresContent.style.userSelect = 'auto';
    };

    // 마우스가 영역을 벗어날 때
    const handleMouseLeave = () => {
      isDragging = false;
      featuresContent.style.cursor = 'grab';
      featuresContent.style.userSelect = 'auto';
    };

    featuresContent.addEventListener('mousedown', handleMouseDown);
    featuresContent.addEventListener('mousemove', handleMouseMove);
    featuresContent.addEventListener('mouseup', handleMouseUp);
    featuresContent.addEventListener('mouseleave', handleMouseLeave);

    // 초기 cursor 스타일 설정
    featuresContent.style.cursor = 'grab';

    return () => {
      featuresContent.removeEventListener('mousedown', handleMouseDown);
      featuresContent.removeEventListener('mousemove', handleMouseMove);
      featuresContent.removeEventListener('mouseup', handleMouseUp);
      featuresContent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="main dark-mode">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <a
            className={`rolling-banner ${isBannerCollapsed ? 'collapsed' : ''}`}
            aria-label="Announcements"
            href="/404"
            onClick={(e) => {
              if (isBannerCollapsed) e.preventDefault();
            }}
          >
            <div
              className="rolling-track"
              data-paused={isBannerPaused}
              onMouseEnter={() => setIsBannerPaused(true)}
              onMouseLeave={() => setIsBannerPaused(false)}
              style={{ ['--rolling-state' as any]: isBannerPaused ? 'paused' : 'running' }}
            >
              <span>{rollingBannerText}</span>
              <span aria-hidden="true">{rollingBannerText}</span>
              <span aria-hidden="true">{rollingBannerText}</span>
            </div>
            <button
              type="button"
              className="rolling-toggle"
              aria-label={isBannerCollapsed ? '공지 펼치기' : '공지 접기'}
              onClick={(e) => {
                e.preventDefault();
                setIsBannerCollapsed((prev) => !prev);
                setIsBannerPaused((prev) => !prev);
              }}
            >
              {isBannerCollapsed ? '▼ 공지 펼치기' : '▲ 공지 접기'}
            </button>
          </a>
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
              {homeMenu?.description || 'atsignal (aka @signal) 의 @은 커뮤니케이션과 소스의 의미입니다.\nsignal은 고객의 행동 log에 담긴 고객의 intention과 insight입니다.\nWe Highlight Signal !'}
            </p>
            <div className="hero-buttons">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsNewsletterModalOpen(true)}
              >
                뉴스레터 신청
              </button>
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
                    const container = featuresContentRef.current;
                    
                    if (element && container) {
                      // 좌측 메뉴 활성화
                      setActiveFeature(feature.id);
                      
                      // getBoundingClientRect를 사용하여 정확한 위치 계산
                      const containerRect = container.getBoundingClientRect();
                      const elementRect = element.getBoundingClientRect();
                      
                      // 카드의 왼쪽 끝이 컨테이너의 왼쪽 끝에 오도록 계산
                      // 현재 scrollLeft + (카드의 화면상 위치 - 컨테이너의 화면상 위치)
                      const currentScrollLeft = container.scrollLeft;
                      const relativeLeft = elementRect.left - containerRect.left;
                      const targetScrollLeft = currentScrollLeft + relativeLeft;
                      
                      // 부드러운 스크롤
                      container.scrollTo({
                        left: targetScrollLeft,
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  {feature.title}
                </button>
              ))}
            </div>

            {/* Right Content - Scrollable */}
            <div ref={featuresContentRef} className="features-content">
              {/* 원본 카드만 표시 */}
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
              {/* 마지막 카드 뒤에 여백 추가 - 마지막 카드가 컨테이너 왼쪽에 정렬될 수 있도록 */}
              <div style={{ 
                minWidth: typeof window !== 'undefined' && window.innerWidth < 768 
                ? '100px'  // 모바일
                : '200px', // 데스크톱
                flexShrink: 0,
                height: '1px' 
              }} />
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
            atsignal을 선택하는 이유
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">App/Web Behavior Log 분석 특화</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">자체 고성능 데이터 처리 엔진</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">유연한 최적 요금제 (MTU, Event 모두 지원)</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">MetaData 관리/탐색 편의성</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">데이터 권한/보안 그룹 공유 기능</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">✓</div>
              <span className="benefit-text">General BI: 포괄적인 분석 기능</span>
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
