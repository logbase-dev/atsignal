import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const AboutNethru = () => {
  // Note: The original file had some JS for an accordion effect on the history section.
  // This would need to be reimplemented using React state (e.g., useState) for full functionality.
  // This conversion focuses on the static structure and styling.

  return (
    <>
      <Head>
        <title>회사 소개 — Nethru</title>
      </Head>

      <div className="container">

        <div className="hero">
          <div className="hero-inner">
            <h1>넷스루(Nethru) — 데이터 기반 디지털 마케팅 솔루션 리더</h1>
            {/* 새 미션 문구로 리드 교체 */}
            <p className="lead">
              넷스루는 데이터 기반의 디지털 마케팅 성과를 높이기 위해, 고객 행동을 안정적으로 수집하고 이를 분석·감지·활용할 수 있는 통합 솔루션을 제공합니다.
            </p>
            <p className="lead" style={{ marginTop: '4px' }}>
              신뢰 가능한 데이터 파이프라인과 직관적인 분석 도구를 바탕으로, 기업이 신속하고 정확한 의사결정을 내리고 실질적인 비즈니스 가치를 만들어가도록 돕습니다.
            </p>
            <div style={{ marginTop: '18px' }} className="video-embed">
              {/* YouTube autoplay (muted) */}
              <iframe src="https://www.youtube.com/embed/L-4oDnwgLg8?autoplay=1&mute=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title="회사 소개 영상"></iframe>
            </div>
            <p className="video-note"><i>아래 공식 소개 영상을 음소거 상태로 자동 재생합니다(브라우저 정책에 따라 자동 재생 시 음소거가 적용됩니다).</i></p>
          </div>
        </div>

        {/* 미션 & 핵심 가치 섹션 */}
        <div className="section">
          <h2 className="history-title">넷스루의 미션과 핵심 가치</h2>
          <div className="card mission-card">
            <div className="mission-grid">
              <div>
                <p className="muted">
                  넷스루는 고객 행동 데이터를 끊김 없이 수집·분석·감지·활용할 수 있는 통합 솔루션으로, 디지털 마케팅의 성과를 꾸준히 높이는 것을 목표로 합니다.
                </p>
                <p className="muted" style={{ marginTop: '6px' }}>
                  신뢰 가능한 데이터 파이프라인과 직관적인 분석 경험을 통해, 조직이 숫자에 머무르지 않고
                  비즈니스의 핵심 가치를 발견하고 실행할 수 있도록 돕습니다.
                </p>
              </div>
              <div>
                <ul className="value-list">
                  <li className="value-item">
                    <div className="value-icon">R</div>
                    <div>
                      <div><strong>신뢰성 (Reliability)</strong></div>
                      <div className="muted">정확한 데이터 수집과 안정적인 서비스로 고객의 신뢰를 확보합니다.</div>
                    </div>
                  </li>
                  <li className="value-item">
                    <div className="value-icon">S</div>
                    <div>
                      <div><strong>간결성 (Simplicity)</strong></div>
                      <div className="muted">복잡한 데이터도 직관적으로 활용할 수 있도록 사용성에 집중합니다.</div>
                    </div>
                  </li>
                  <li className="value-item">
                    <div className="value-icon">E</div>
                    <div>
                      <div><strong>확장성 (Expandability)</strong></div>
                      <div className="muted">비즈니스 성장 단계에 맞춰 유연하게 확장 가능한 요금과 인프라를 설계합니다.</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 주요 제품·서비스 */}
        <div className="section">
          <h2 className="history-title">주요 제품·서비스</h2>
          <div className="card">
            <div className="grid">
              <div className="card">
                <h3 style={{ margin: '0 0 8px 0' }}>고객행동수집 (Collector)</h3>
                <p className="muted">웹/앱에서 발생하는 고객 행동을 안정적으로 수집하여 이벤트 기반 데이터 레이크로 전달합니다. 높은 처리량과 안정성을 갖춘 수집 인프라를 제공합니다.</p>
                <p className="card-action"><a href="https://nethru.co.kr/collector/collector.html" target="_blank" rel="noopener noreferrer">제품 정보 보기 →</a></p>
              </div>

              <div className="card">
                <h3 style={{ margin: '0 0 8px 0' }}>고객행동분석 (Data Story)</h3>
                <p className="muted">수집된 행동 데이터를 분석하여 세그먼트, 리텐션, 전환 흐름 등 마케팅 성과를 시각화하고 인사이트를 제공합니다.</p>
                <p className="card-action"><a href="https://nethru.co.kr/analysis/datastory.html" target="_blank" rel="noopener noreferrer">제품 정보 보기 →</a></p>
              </div>

              <div className="card">
                <h3 style={{ margin: '0 0 8px 0' }}>고객참여 강화 (smartCEP)</h3>
                <p className="muted">실시간 이벤트 기반 규칙 엔진과 개인화 추천으로 캠페인 자동화 및 고객 참여를 향상시킵니다.</p>
                <p className="card-action"><a href="https://nethru.co.kr/CEP/smartCEP.html" target="_blank" rel="noopener noreferrer">제품 정보 보기 →</a></p>
              </div>

              <div className="card">
                <h3 style={{ margin: '0 0 8px 0' }}>컨설팅 & 전문 서비스</h3>
                <p className="muted">데이터 아키텍처 설계, ETL 파이프라인 구축, 커스텀 분석 모델 개발 등 고객 맞춤형 컨설팅을 제공합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 회사 연혁 */}
        <section className="history-section">
          <h2 className="history-title">회사 연혁</h2>
          <div className="history-timeline">
            {/* Accordion items need state management in React for hover effect */}
            <div className="history-item">
              <div className="history-year">2024년 ~ 현재</div>
              <div className="history-body">
                <ul>
                  <li>WiseCollector, GS 품질인증 1등급 획득 (한국정보통신기술협회)</li>
                  <li>전사 솔루션 통합 플랫폼 개발</li>
                  <li>가족친화인증기업 인증 (여성가족부)</li>
                </ul>
              </div>
            </div>
            <div className="history-item">
              <div className="history-year">2019년 ~ 2023</div>
              <div className="history-body">
                <ul>
                  <li>실시간 행동감지 솔루션 SmartCEP 출시</li>
                  <li>실시간 고객행동 수집 솔루션 WiseCollector 출시</li>
                  <li>성수 SK V1센터 신사옥 이전</li>
                  <li>데이터바우처 지원 사업 선정 (한국데이터산업진흥원)</li>
                </ul>
              </div>
            </div>
            <div className="history-item">
              <div className="history-year">2014년 ~ 2018년</div>
              <div className="history-body">
                <ul>
                  <li>SW공학기술 현장적용 사업 과제 선정 (미래창조과학부)</li>
                  <li>청년 친화 강소기업 선정 (고용노동부)</li>
                  <li>기술평가 우수기업 인증 (NICE평가정보)</li>
                  <li>DataStory, GS 품질인증 획득 (한국정보통신기술협회)</li>
                  <li>실시간 분석 솔루션 DataLive 출시</li>
                </ul>
              </div>
            </div>
            <div className="history-item">
              <div className="history-year">2009년 ~ 2013년</div>
              <div className="history-body">
                <ul>
                  <li>중소기업제품상용화 지원사업 과제 선정 (서울시)</li>
                  <li>산업융합원천기술개발사업 과제 선정 (지식경제부)</li>
                  <li>취업하고 싶은 강소기업 선정 (중소기업기술혁신협회)</li>
                  <li>실시간 온라인 마케팅 서비스 SeeToc 오픈</li>
                </ul>
              </div>
            </div>
            <div className="history-item">
              <div className="history-year">2004년 ~ 2008</div>
              <div className="history-body">
                <ul>
                  <li>WiseLog, GS 품질인증 획득 (한국정보통신기술협회)</li>
                  <li>WiseLog, 행정업무용 소프트웨어 선정</li>
                  <li>대한민국 e비즈니스 대상 수상 (산업자원부)</li>
                  <li>신SW상품대상 수상 (정보통신부)</li>
                  <li>온라인 고객 프로파일링 솔루션 CustomerFocus 출시</li>
                  <li>개인화 추천 솔루션 SmartOffer 출시</li>
                </ul>
              </div>
            </div>
            <div className="history-item">
              <div className="history-year">1999년 ~ 2003년</div>
              <div className="history-body">
                <ul>
                  <li>포항공대 창업보육센터 내 창업</li>
                  <li>벤처기업 인증</li>
                  <li>데이터마이닝 연구소 설립</li>
                  <li>병역특례업체 선정</li>
                  <li>웹로그 분석 솔루션 WiseLog 출시</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 연락처 섹션 */}
        <section className="contact-section">
          <h2 className="history-title">연락처 & 회사 정보</h2>
          <div className="history-timeline"> {/* Reusing class, maybe rename later */}
            <div className="contact-inner">
              <p className="muted">파트너십, 데모 요청, 제품·기술 문의는 아래 연락처로 연락 주세요.</p>
              <p><strong>대표</strong> 최원홍</p>
              <p><strong>사업자등록번호</strong> 506-81-32824</p>
              <p><strong>주소</strong> (04799) 서울시 성동구 광나루로 8길 31 (성수동2가) 성수SK V1센터 2동 7층</p>
              <p><strong>대표전화</strong> 02-6243-4160 &nbsp; <strong>팩스</strong> 0505-318-3200</p>
              <p><strong>이메일</strong> <a href="mailto:sales@nethru.co.kr">sales@nethru.co.kr</a></p>
              <p style={{ marginTop: '8px' }}>
                <a href="https://nethru.co.kr/company/client.html" target="_blank" rel="noopener noreferrer">고객사 보기</a> ·
                <a href="https://nethru.co.kr/company/esg.html" target="_blank" rel="noopener noreferrer">ESG 경영</a> ·
                <a href="https://nethru.co.kr/policy/privacy.html" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
              </p>
              <p style={{ marginTop: '8px' }} className="muted">소셜: <a href="https://www.facebook.com/nethrumkt" target="_blank" rel="noopener noreferrer">Facebook</a> · <a href="https://blog.naver.com/nethru_mkt" target="_blank" rel="noopener noreferrer">Blog</a> · <a href="https://www.youtube.com/@nethru_mkt" target="_blank" rel="noopener noreferrer">YouTube</a></p>
              <p style={{ marginTop: '8px' }} className="contact-cta"><a className="cta" href="mailto:sales@nethru.co.kr">데모 요청하기</a></p>
            </div>
          </div>
        </section>

        {/* 시스템 아키텍처 영상 */}
        <div className="section">
          <h2 className="section-title">시스템 아키텍처 영상</h2>
          <div className="bottom-video">
            <video controls preload="metadata">
              <source src="UF 시스템 아키텍처.mp4" type="video/mp4" />
              해당 브라우저는 비디오 태그를 지원하지 않습니다.
            </video>
          </div>
          <p className="video-note"><i>아래 영상은 자동 재생하지 않습니다. 재생 버튼을 눌러 시청하세요.</i></p>
        </div>
      </div>

      <style jsx global>{`
        :root{
          --blue:#2e5aac;--muted:#6b7280;--card:#fff;--bg:#f7f9fc;
          --animation-speed-multiplier: 1; /* Default speed */
        }
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;margin:0;background:var(--bg);color:#0f172a;overflow-x:hidden}
        .container{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:28px}
        .hero{display:grid;grid-template-columns:1fr;gap:20px;align-items:center}
        .hero-inner{background:var(--card);padding:28px;border-radius:12px;box-shadow:0 8px 24px rgba(16,24,40,0.04)}
        h1{margin:0;font-size:28px;color:var(--blue)}
        p.lead{margin:6px 0 0;color:var(--muted)}
      
        /* video header */
        .video-embed{width:100%;height:0;padding-bottom:56.25%;position:relative;border-radius:10px;overflow:hidden}
        .video-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
        .video-note{font-size:12px;color:var(--muted);margin-top:8px;text-align:center}
        .section{margin-top:28px}
        /* unify card appearance across the page so visible white surfaces match */
        .section .card{background:var(--card);padding:28px;border-radius:12px;box-shadow:0 6px 18px rgba(16,24,40,0.04)}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
      
        /* Make product/service cards equal height and push the action link to the bottom */
        .grid > .card{display:flex;flex-direction:column}
        .grid > .card .card-action{margin-top:auto;padding-top:8px}
        h2.section-title{margin:0 0 12px 0;font-size:20px;color:#0f172a}
        ul{margin:0;padding-left:20px;color:var(--muted)}
      
        /* mission / values */
        .mission-card .mission-grid{display:grid;grid-template-columns:1fr;gap:14px;align-items:flex-start}
        .mission-card .mission-image img{width:100%;height:auto;border-radius:8px;display:block}
        .value-list{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
        .value-item{display:flex;gap:10px;align-items:flex-start}
        .value-icon{width:28px;height:28px;border-radius:6px;background:#eef2ff;color:var(--blue);display:inline-flex;align-items:center;justify-content:center;font-weight:700}
      
        @media (min-width:900px){
          .mission-card .mission-grid{grid-template-columns:1.4fr 1fr}
        }
      
        /* timeline */
        .timeline{display:flex;flex-direction:column;gap:12px}
        .timeline-item{padding:12px 14px;border-left:3px solid rgba(46,90,172,0.12);background:linear-gradient(180deg,#fff,#fbfdff);border-radius:6px}
        .muted{color:var(--muted);font-size:14px}
      
        /* team */
        .avatar{width:56px;height:56px;border-radius:8px;background:#eef2ff;display:inline-flex;align-items:center;justify-content:center;color:var(--blue);font-weight:700;margin-right:12px}
        .team-item{display:flex;align-items:center}
      
        /* bottom video */
        .bottom-video{display:flex;justify-content:center;margin:28px 0}
        video{max-width:900px;width:100%;border-radius:8px;box-shadow:0 6px 18px rgba(16,24,40,0.06)}
      
        /* small screens tweaks */
        @media (min-width:900px){
           /* Change hero to full-width stack so its white surface matches
             other full-width cards; contact column will stack below hero. */
           .hero{grid-template-columns:1fr}
          /* keep hero-inner padding same as other cards for identical white width */
          .hero-inner{padding:28px}
          /* Force product cards to share equal widths on wide screens */
          .grid{grid-template-columns:repeat(4,1fr)}
        }
        
        /* History section styles (from provided snippet) */
        .history-section {
          /* Let the history section flow inside the main container so its
             visible white surface matches other full-width cards. */
          margin: 0;
          padding: 28px 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      
        .history-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
      
        /* Make the timeline itself look like the other white cards so widths match */
        .history-timeline {
          background: var(--card);
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 6px 18px rgba(16,24,40,0.04);
        }
      
        .history-item {
          position: relative;
          padding: 12px 0;
          cursor: pointer;
          border-radius: 8px;
          margin: 10px 0;
          background: transparent;
          transition:
            background 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.15s ease;
          overflow: visible;
        }
      
        .history-item::before {
          content: "";
          position: absolute;
          left: 8px;
          top: 18px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #4f46e5;
        }
      
        .history-year {
          font-size: 0.95rem;
          font-weight: 600;
          padding-left: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      
        .history-year::after {
          content: "﹀";
          font-size: 0.7rem;
          opacity: 0.4;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
      
        .history-body {
          max-height: 0;
          overflow: hidden;
          padding-left: 28px;
          padding-right: 8px;
          transition: max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease;
          opacity: 0;
          margin-top: 0;
        }
      
        .history-body ul {
          margin: 8px 0 10px;
          padding-left: 14px;
          font-size: 0.86rem;
          line-height: 1.6;
          color: #4b5563;
        }
      
        .history-body li + li {
          margin-top: 4px;
        }
      
        /* hover 시 아코디언 오픈 */
        .history-item:hover {
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }
      
        .history-item:hover .history-body {
          max-height: 260px; /* 한 블록에 들어갈 내용 높이에 맞춰 조정 */
          opacity: 1;
          margin-top: 6px;
        }
      
        .history-item:hover .history-year::after {
          transform: rotate(180deg);
          opacity: 0.7;
        }
      
        /* 모바일 대응 */
        @media (max-width: 640px) {
          .history-section {
            padding: 24px 12px;
          }
          .history-title {
            font-size: 1.25rem;
            margin-bottom: 16px;
          }
          .history-item {
            margin: 6px 0;
            padding: 8px 0;
          }
          .history-body ul {
            font-size: 0.8rem;
          }
        }
        /* contact card styles for hero right column */
        .contact-card address{font-size:0.95rem;color:#0f172a;margin-top:6px;line-height:1.4}
        .contact-card dl{margin:8px 0}
        .contact-card dt{display:inline-block;width:64px;color:var(--muted);font-weight:600}
        .contact-card dd{display:inline-block;margin:0}
        .cta{display:inline-block;padding:8px 12px;background:var(--blue);color:#fff;border-radius:8px;text-decoration:none;font-weight:600}
      `}</style>
    </>
  );
};

export default AboutNethru;
