'use client';

import { useEffect, useRef } from 'react';

interface CompanyAboutUsProps {
  locale: string;
}

declare global {
  interface Window {
    VANTA?: any;
    THREE?: any;
  }
}

export default function CompanyAboutUs({ locale }: CompanyAboutUsProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaInstanceRef = useRef<any>(null);

  // Vanta.js 초기화
  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    const initVanta = async () => {
      if (!vantaRef.current) return;

      try {
        // Three.js 로드
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js');
        
        // Vanta 플러그인들 로드
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js');

        if (!window.VANTA || !window.THREE) return;

        // 기존 인스턴스 정리
        if (vantaInstanceRef.current && vantaInstanceRef.current.destroy) {
          vantaInstanceRef.current.destroy();
        }

        // 초마다 다른 배경 선택 (0: 글로브, 1: 웨이브, 2: 클라우드)
        const sec = new Date().getSeconds();
        const pick = sec % 3;

        const base = {
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
        };

        if (pick === 0) {
          vantaInstanceRef.current = window.VANTA.GLOBE({
            ...base,
            color: 0x553fff,
            size: 1.1,
            backgroundColor: 0xd9d4e3,
          });
        } else if (pick === 1) {
          vantaInstanceRef.current = window.VANTA.WAVES({
            ...base,
            color: 0x6089a4,
            shininess: 19.0,
            waveHeight: 5.0,
            waveSpeed: 0.9,
            zoom: 0.92,
          });
        } else {
          vantaInstanceRef.current = window.VANTA.CLOUDS({
            ...base,
            skyColor: 0xeaf2fb,
            cloudColor: 0x9bbad3,
            cloudShadowColor: 0xb5c7de,
            sunColor: 0xffffff,
            sunGlareColor: 0xffffff,
            sunlightColor: 0xf0f4ff,
            speed: 1.0,
          });
        }
      } catch (error) {
        console.error('Failed to initialize Vanta.js:', error);
      }
    };

    if (document.readyState === 'complete') {
      initVanta();
    } else {
      window.addEventListener('load', initVanta);
    }

    const handleResize = () => {
      if (vantaInstanceRef.current && vantaInstanceRef.current.resize) {
        vantaInstanceRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (vantaInstanceRef.current && vantaInstanceRef.current.destroy) {
        vantaInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Vanta 배경 */}
      <div
        id="vanta-bg"
        ref={vantaRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* 메인 컨텐츠 */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '200px 28px 28px 28px',
        }}
      >
        {/* Hero 섹션 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '28px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(16,24,40,0.04)',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '28px', color: '#2e5aac' }}>
              넷스루(Nethru) — 데이터 기반 디지털 마케팅 솔루션 리더
            </h1>
            <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
              넷스루는 데이터 기반의 디지털 마케팅 성과를 높이기 위해, 고객 행동을 안정적으로 수집하고 이를 분석·감지·활용할 수 있는 통합 솔루션을 제공합니다.
            </p>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
              신뢰 가능한 데이터 파이프라인과 직관적인 분석 도구를 바탕으로, 기업이 신속하고 정확한 의사결정을 내리고 실질적인 비즈니스 가치를 만들어가도록 돕습니다.
            </p>
            <div
              style={{
                marginTop: '18px',
                width: '100%',
                height: 0,
                paddingBottom: '56.25%',
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <iframe
                src="https://www.youtube.com/embed/L-4oDnwgLg8?autoplay=1&mute=1&playsinline=1&rel=0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="회사 소개 영상"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
              <i>아래 공식 소개 영상을 음소거 상태로 자동 재생합니다(브라우저 정책에 따라 자동 재생 시 음소거가 적용됩니다).</i>
            </p>
          </div>
        </div>

        {/* 미션 & 핵심 가치 섹션 */}
        <div style={{ marginTop: '28px' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            넷스루의 미션과 핵심 가치
          </h2>
          <div
            style={{
              background: '#fff',
              padding: '28px',
              borderRadius: '12px',
              boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '14px',
                alignItems: 'flex-start',
              }}
              className="mission-grid"
            >
              <style jsx>{`
                @media (min-width: 900px) {
                  .mission-grid {
                    grid-template-columns: 1.4fr 1fr !important;
                  }
                }
              `}</style>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  넷스루는 고객 행동 데이터를 끊김 없이 수집·분석·감지·활용할 수 있는 통합 솔루션으로, 디지털 마케팅의 성과를 꾸준히 높이는 것을 목표로 합니다.
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
                  신뢰 가능한 데이터 파이프라인과 직관적인 분석 경험을 통해, 조직이 숫자에 머무르지 않고 비즈니스의 핵심 가치를 발견하고 실행할 수 있도록 돕습니다.
                </p>
              </div>
              <div>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '12px 0 0',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#eef2ff',
                        color: '#2e5aac',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      R
                    </div>
                    <div>
                      <div>
                        <strong>신뢰성 (Reliability)</strong>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        정확한 데이터 수집과 안정적인 서비스로 고객의 신뢰를 확보합니다.
                      </div>
                    </div>
                  </li>
                  <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#eef2ff',
                        color: '#2e5aac',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      S
                    </div>
                    <div>
                      <div>
                        <strong>간결성 (Simplicity)</strong>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        복잡한 데이터도 직관적으로 활용할 수 있도록 사용성에 집중합니다.
                      </div>
                    </div>
                  </li>
                  <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#eef2ff',
                        color: '#2e5aac',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      E
                    </div>
                    <div>
                      <div>
                        <strong>확장성 (Expandability)</strong>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        비즈니스 성장 단계에 맞춰 유연하게 확장 가능한 요금과 인프라를 설계합니다.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 주요 제품·서비스 섹션 */}
        <div style={{ marginTop: '28px' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            주요 제품·서비스
          </h2>
          <div
            style={{
              background: '#fff',
              padding: '28px',
              borderRadius: '12px',
              boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  padding: '28px',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>고객행동수집 (Collector)</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  웹/앱에서 발생하는 고객 행동을 안정적으로 수집하여 이벤트 기반 데이터 레이크로 전달합니다. 높은 처리량과 안정성을 갖춘 수집 인프라를 제공합니다.
                </p>
                <p style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <a
                    href="https://nethru.co.kr/collector/collector.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    제품 정보 보기 →
                  </a>
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  padding: '28px',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>고객행동분석 (Data Story)</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  수집된 행동 데이터를 분석하여 세그먼트, 리텐션, 전환 흐름 등 마케팅 성과를 시각화하고 인사이트를 제공합니다.
                </p>
                <p style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <a
                    href="https://nethru.co.kr/analysis/datastory.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    제품 정보 보기 →
                  </a>
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  padding: '28px',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>고객참여 강화 (smartCEP)</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  실시간 이벤트 기반 규칙 엔진과 개인화 추천으로 캠페인 자동화 및 고객 참여를 향상시킵니다.
                </p>
                <p style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <a
                    href="https://nethru.co.kr/CEP/smartCEP.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    제품 정보 보기 →
                  </a>
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  padding: '28px',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>컨설팅 & 전문 서비스</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  데이터 아키텍처 설계, ETL 파이프라인 구축, 커스텀 분석 모델 개발 등 고객 맞춤형 컨설팅을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 회사 연혁 섹션 */}
        <section
          style={{
            margin: 0,
            padding: '28px 0',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            회사 연혁
          </h2>
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
            }}
          >
            <HistoryItem
              year="2024년 ~ 현재"
              items={[
                'WiseCollector, GS 품질인증 1등급 획득 (한국정보통신기술협회)',
                '전사 솔루션 통합 플랫폼 개발',
                '가족친화인증기업 인증 (여성가족부)',
              ]}
            />
            <HistoryItem
              year="2019년 ~ 2023"
              items={[
                '실시간 행동감지 솔루션 SmartCEP 출시',
                '실시간 고객행동 수집 솔루션 WiseCollector 출시',
                '성수 SK V1센터 신사옥 이전',
                '데이터바우처 지원 사업 선정 (한국데이터산업진흥원)',
              ]}
            />
            <HistoryItem
              year="2014년 ~ 2018년"
              items={[
                'SW공학기술 현장적용 사업 과제 선정 (미래창조과학부)',
                '청년 친화 강소기업 선정 (고용노동부)',
                '기술평가 우수기업 인증 (NICE평가정보)',
                'DataStory, GS 품질인증 획득 (한국정보통신기술협회)',
                '실시간 분석 솔루션 DataLive 출시',
              ]}
            />
            <HistoryItem
              year="2009년 ~ 2013년"
              items={[
                '중소기업제품상용화 지원사업 과제 선정 (서울시)',
                '산업융합원천기술개발사업 과제 선정 (지식경제부)',
                '취업하고 싶은 강소기업 선정 (중소기업기술혁신협회)',
                '실시간 온라인 마케팅 서비스 SeeToc 오픈',
              ]}
            />
            <HistoryItem
              year="2004년 ~ 2008"
              items={[
                'WiseLog, GS 품질인증 획득 (한국정보통신기술협회)',
                'WiseLog, 행정업무용 소프트웨어 선정',
                '대한민국 e비즈니스 대상 수상 (산업자원부)',
                '신SW상품대상 수상 (정보통신부)',
                '온라인 고객 프로파일링 솔루션 CustomerFocus 출시',
                '개인화 추천 솔루션 SmartOffer 출시',
              ]}
            />
            <HistoryItem
              year="1999년 ~ 2003년"
              items={[
                '포항공대 창업보육센터 내 창업',
                '벤처기업 인증',
                '데이터마이닝 연구소 설립',
                '병역특례업체 선정',
                '웹로그 분석 솔루션 WiseLog 출시',
              ]}
            />
          </div>
        </section>

        {/* 연락처 & 회사 정보 섹션 */}
        <section style={{ marginTop: '28px' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            연락처 & 회사 정보
          </h2>
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
            }}
          >
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              파트너십, 데모 요청, 제품·기술 문의는 아래 연락처로 연락 주세요.
            </p>
            <p style={{ marginTop: '8px' }}>
              <strong>대표</strong> 최원홍
            </p>
            <p>
              <strong>사업자등록번호</strong> 506-81-32824
            </p>
            <p>
              <strong>주소</strong> (04799) 서울시 성동구 광나루로 8길 31 (성수동2가) 성수SK V1센터 2동 7층
            </p>
            <p>
              <strong>대표전화</strong> 02-6243-4160 &nbsp; <strong>팩스</strong> 0505-318-3200
            </p>
            <p>
              <strong>이메일</strong>{' '}
              <a href="mailto:sales@nethru.co.kr">sales@nethru.co.kr</a>
            </p>
            <p style={{ marginTop: '8px' }}>
              <a
                href="https://nethru.co.kr/company/client.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                고객사 보기
              </a>{' '}
              ·{' '}
              <a
                href="https://nethru.co.kr/company/esg.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                ESG 경영
              </a>{' '}
              ·{' '}
              <a
                href="https://nethru.co.kr/policy/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보처리방침
              </a>
            </p>
            <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
              소셜:{' '}
              <a
                href="https://www.facebook.com/nethrumkt"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>{' '}
              ·{' '}
              <a
                href="https://blog.naver.com/nethru_mkt"
                target="_blank"
                rel="noopener noreferrer"
              >
                Blog
              </a>{' '}
              ·{' '}
              <a
                href="https://www.youtube.com/@nethru_mkt"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
            </p>
            <p style={{ marginTop: '8px' }}>
              <a
                href="mailto:sales@nethru.co.kr"
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  background: '#2e5aac',
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                데모 요청하기
              </a>
            </p>
          </div>
        </section>

        {/* 브랜드 스플래시 비디오 */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a' }}>
            브랜드 스플래시
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '28px 0',
            }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{
                maxWidth: '900px',
                width: '100%',
                borderRadius: '8px',
                boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
              }}
            >
              <source src="/videos/splash_atsignal.mp4" type="video/mp4" />
              해당 브라우저는 비디오 태그를 지원하지 않습니다.
            </video>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
            브랜드 무드 스플래시 영상입니다. 무음으로 자동 반복 재생됩니다.
          </p>
        </div>

        {/* 시스템 아키텍처 영상 */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a' }}>
            시스템 아키텍처 영상
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '28px 0',
            }}
          >
            <video
              controls
              preload="metadata"
              style={{
                maxWidth: '900px',
                width: '100%',
                borderRadius: '8px',
                boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
              }}
            >
              <source src="/videos/UF 시스템 아키텍처.mp4" type="video/mp4" />
              해당 브라우저는 비디오 태그를 지원하지 않습니다.
            </video>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
            <i>아래 영상은 자동 재생하지 않습니다. 재생 버튼을 눌러 시청하세요.</i>
          </p>
        </div>
      </div>

    </div>
  );
}

// 연혁 아이템 컴포넌트 (hover 기반 아코디언)
function HistoryItem({ year, items }: { year: string; items: string[] }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 0',
        cursor: 'pointer',
        borderRadius: '8px',
        margin: '10px 0',
        background: 'transparent',
        transition: 'background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease',
        overflow: 'visible',
      }}
      className="history-item"
    >
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          paddingLeft: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        className="history-year"
      >
        {year}
        <span
          style={{
            fontSize: '0.7rem',
            opacity: 0.4,
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
        >
          ﹀
        </span>
      </div>
      <div
        className="history-body"
        style={{
          maxHeight: 0,
          overflow: 'hidden',
          paddingLeft: '28px',
          paddingRight: '8px',
          transition: 'max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease',
          opacity: 0,
          marginTop: 0,
        }}
      >
        <ul
          style={{
            margin: '8px 0 10px',
            paddingLeft: '14px',
            fontSize: '0.86rem',
            lineHeight: 1.6,
            color: '#4b5563',
          }}
        >
          {items.map((item, index) => (
            <li key={index} style={{ marginTop: index > 0 ? '4px' : 0 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
