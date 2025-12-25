'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface PricingInformationProps {
  locale: string;
}

const PRICE_PER_MTU = 0.85; // 원화 기준 MTU당 단가
const YEARLY_DISCOUNT = 0.166; // 16.6%

// MTU 값에 따른 요금제 매핑
function getPlanForMTU(mtu: number): 'free' | 'basic' | 'core' | 'enterprise' {
  if (mtu <= 15000) return 'free';
  if (mtu <= 100000) return 'basic';
  if (mtu <= 500000) return 'core';
  return 'enterprise';
}

function getPlanStartMTU(planName: 'free' | 'basic' | 'core' | 'enterprise'): number {
  switch (planName) {
    case 'free':
      return 1000;
    case 'basic':
      return 16000;
    case 'core':
      return 101000;
    case 'enterprise':
      return 501000;
    default:
      return 1000;
  }
}

export default function PricingInformation({ locale }: PricingInformationProps) {
  const [mtu, setMtu] = useState(500000);
  const [isYearly, setIsYearly] = useState(false);
  const [focusedPlan, setFocusedPlan] = useState<'free' | 'basic' | 'core' | 'enterprise' | null>(null);
  const mtuSliderRef = useRef<HTMLInputElement>(null);
  const yearlyToggleRef = useRef<HTMLDivElement>(null);

  // MTU 값 업데이트
  const updateMTUValues = () => {
    if (!mtuSliderRef.current) return;
    const mtuValue = parseInt(mtuSliderRef.current.value);
    setMtu(mtuValue);
    
    // 요금제 강조
    const planName = getPlanForMTU(mtuValue);
    setFocusedPlan(planName);
  };

  // 슬라이더 진행 상태 업데이트
  const updateSliderProgress = () => {
    if (!mtuSliderRef.current) return;
    const min = parseInt(mtuSliderRef.current.min);
    const max = parseInt(mtuSliderRef.current.max);
    const value = parseInt(mtuSliderRef.current.value);
    const progress = ((value - min) / (max - min)) * 100;
    mtuSliderRef.current.style.setProperty('--slider-progress', progress + '%');
  };

  // 연간 가격 계산
  const calculateAnnualPrice = () => {
    let annual = mtu * PRICE_PER_MTU;
    if (isYearly) {
      annual = annual * (1 - YEARLY_DISCOUNT);
    }
    return Math.round(annual);
  };

  // MTU 표시 포맷
  const formatMTU = (value: number): string => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else {
      return value >= 1000 ? `${value / 1000}k` : value.toLocaleString();
    }
  };

  // 카드 호버 핸들러
  const handleCardHover = (plan: 'free' | 'basic' | 'core' | 'enterprise') => {
    if (!mtuSliderRef.current) return;
    const start = getPlanStartMTU(plan);
    mtuSliderRef.current.value = start.toString();
    updateMTUValues();
    updateSliderProgress();
  };

  // 토글 클릭 핸들러
  const toggleYearly = () => {
    setIsYearly(!isYearly);
  };

  useEffect(() => {
    updateSliderProgress();
  }, [mtu]);

  const annualPrice = calculateAnnualPrice();

  return (

    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f7f9fc', color: '#222', paddingTop: '100px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '80px 20px', background: '#eef2ff' }}>
        <h1 style={{ fontSize: '40px', marginBottom: '16px', fontWeight: 800, margin: '0 0 16px 0' }}>atsignal pricing</h1>
        <p style={{ fontSize: '18px', color: '#555', margin: '0 0 8px 0' }}>월간 추적 사용자(MTU) 기준으로 계산되는 명확하고 투명한 가격 구조.</p>
        <p style={{ fontSize: '18px', color: '#555', margin: '0 0 24px 0' }}>조직 규모에 따라 가장 적합한 요금제를 선택하세요.</p>
        <div style={{ marginTop: '24px' }}>
          <Link href="#" style={{ display: 'inline-block', margin: '8px', padding: '14px 28px', background: '#2e5aac', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Request Demo
          </Link>
          <Link href="#" style={{ display: 'inline-block', margin: '8px', padding: '14px 28px', background: '#475569', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Contact Sales
          </Link>
        </div>
      </div>

      {/* Pricing Cards */}
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, margin: '60px 0 30px 0' }}>요금제</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', maxWidth: '1200px', margin: '0 auto 60px', padding: '0 20px' }}>
        {/* Free Card */}
        <div
          className={`card card-free ${focusedPlan === 'free' ? 'focused' : ''}`}
          data-plan="free"
          tabIndex={0}
          onMouseEnter={() => handleCardHover('free')}
          onFocus={() => handleCardHover('free')}
          style={{
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            padding: '24px',
            borderRadius: '10px',
            border: focusedPlan === 'free' ? '3px solid #2e5aac' : '1px solid #e5e7eb',
            boxShadow: focusedPlan === 'free' ? '0 12px 30px rgba(46,90,172,0.08)' : '0 3px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.18s ease',
            transform: focusedPlan === 'free' ? 'translateY(-6px)' : 'none',
            cursor: 'pointer',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#111827' }}>Free</h2>
          <p style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 700, color: '#374151' }}>월 500K 이벤트까지 무료</p>
          <p style={{ fontSize: '14px', marginBottom: '16px', color: '#4b5563' }}>atsignal 자동화를 무료로 체험하세요.</p>
          <ul style={{ margin: '0 0 20px 0', paddingLeft: '16px', flexGrow: 1, listStyle: 'disc', color: '#4b5563' }}>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>기본 기능 제공(제한적)</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>기본 모니터링</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>데이터 다운로드 불가</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>허용량 초과 시 자동 정지(상위 요금제 게약시 접속 가능)</li>
          </ul>
          <Link href="#" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', fontSize: '15px', borderRadius: '6px', textDecoration: 'none', color: 'white', background: '#2e5aac', fontWeight: 600, marginTop: 'auto', boxSizing: 'border-box' }}>
            Start for Free
          </Link>
        </div>

        {/* Basic Card */}
        <div
          className={`card card-basic ${focusedPlan === 'basic' ? 'focused' : ''}`}
          data-plan="basic"
          tabIndex={0}
          onMouseEnter={() => handleCardHover('basic')}
          onFocus={() => handleCardHover('basic')}
          style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            padding: '24px',
            borderRadius: '10px',
            border: focusedPlan === 'basic' ? '3px solid #2e5aac' : '1px solid #e9d5ff',
            boxShadow: focusedPlan === 'basic' ? '0 12px 30px rgba(46,90,172,0.08)' : '0 3px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.18s ease',
            transform: focusedPlan === 'basic' ? 'translateY(-6px)' : 'none',
            cursor: 'pointer',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#111827' }}>Basic</h2>
          <p style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 700, color: '#374151' }}>₩56 / 1GB</p>
          <p style={{ fontSize: '14px', marginBottom: '16px', color: '#4b5563' }}>12개월 약정 시 16.6% 할인</p>
          <ul style={{ margin: '0 0 20px 0', paddingLeft: '16px', flexGrow: 1, listStyle: 'disc', color: '#4b5563' }}>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>주요 자동정의/자동검증 기능</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>협업 기능 제공</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>프로젝트 2개</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>이메일 지원</li>
          </ul>
          <Link href="#" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', fontSize: '15px', borderRadius: '6px', textDecoration: 'none', color: 'white', background: '#7c3aed', fontWeight: 600, marginTop: 'auto', boxSizing: 'border-box' }}>
            Upgrade
          </Link>
        </div>

        {/* Core Card */}
        <div
          className={`card card-core ${focusedPlan === 'core' ? 'focused' : ''}`}
          data-plan="core"
          tabIndex={0}
          onMouseEnter={() => handleCardHover('core')}
          onFocus={() => handleCardHover('core')}
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            padding: '24px',
            borderRadius: '10px',
            border: focusedPlan === 'core' ? '3px solid #2e5aac' : '1px solid #bfdbfe',
            boxShadow: focusedPlan === 'core' ? '0 12px 30px rgba(46,90,172,0.08)' : '0 3px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.18s ease',
            transform: focusedPlan === 'core' ? 'translateY(-6px)' : 'none',
            cursor: 'pointer',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#111827' }}>Core</h2>
          <p style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 700, color: '#374151' }}>₩27.9 / 1GB 또는 MTU 기준</p>
          <p style={{ fontSize: '14px', marginBottom: '16px', color: '#4b5563' }}>3년 약정 시 Low Price 옵션</p>
          <ul style={{ margin: '0 0 20px 0', paddingLeft: '16px', flexGrow: 1, listStyle: 'disc', color: '#4b5563' }}>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>스펙 차이 감지 풀옵션</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>프로젝트 무제한</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>SSO 제공</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>SLA 99.9%</li>
          </ul>
          <Link href="#" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', fontSize: '15px', borderRadius: '6px', textDecoration: 'none', color: 'white', background: '#2e5aac', fontWeight: 600, marginTop: 'auto', boxSizing: 'border-box' }}>
            Contact Sales
          </Link>
        </div>

        {/* Enterprise Card */}
        <div
          className={`card card-enterprise ${focusedPlan === 'enterprise' ? 'focused' : ''}`}
          data-plan="enterprise"
          tabIndex={0}
          onMouseEnter={() => handleCardHover('enterprise')}
          onFocus={() => handleCardHover('enterprise')}
          style={{
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            padding: '24px',
            borderRadius: '10px',
            border: focusedPlan === 'enterprise' ? '3px solid #2e5aac' : '1px solid #7dd3fc',
            boxShadow: focusedPlan === 'enterprise' ? '0 12px 30px rgba(46,90,172,0.08)' : '0 3px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.18s ease',
            transform: focusedPlan === 'enterprise' ? 'translateY(-6px)' : 'none',
            cursor: 'pointer',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#111827' }}>Enterprise</h2>
          <p style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 700, color: '#374151' }}>₩8.7 / 1GB</p>
          <p style={{ fontSize: '14px', marginBottom: '16px', color: '#4b5563' }}>대규모 조직을 위한 전용 플랜</p>
          <ul style={{ margin: '0 0 20px 0', paddingLeft: '16px', flexGrow: 1, listStyle: 'disc', color: '#4b5563' }}>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>전용 인프라(VPC)</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>고급 보안 옵션</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>조직 전체 워크스페이스</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>TAM 지원</li>
            <li style={{ fontSize: '14px', marginBottom: '6px' }}>커스텀 Rule Engine</li>
          </ul>
          <Link href="#" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', fontSize: '15px', borderRadius: '6px', textDecoration: 'none', color: 'white', background: '#2e5aac', fontWeight: 600, marginTop: 'auto', boxSizing: 'border-box' }}>
            Contact Sales
          </Link>
        </div>
      </div>

      {/* MTU Calculator */}
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, margin: '60px 0 30px 0' }}>나에게 맞는 요금제 계산하기</h2>

      <div
        className={`mtu-calculator-wrapper ${focusedPlan ? `focused-${focusedPlan}` : ''}`}
        style={{
          maxWidth: '780px',
          margin: '0 auto 80px',
          background: focusedPlan === 'free' ? 'linear-gradient(135deg, #fbfbfc 0%, #f5f7fa 100%)' :
                      focusedPlan === 'basic' ? 'linear-gradient(135deg, #fbf8ff 0%, #f7f1fe 100%)' :
                      focusedPlan === 'core' ? 'linear-gradient(135deg, #fbfdff 0%, #eef8ff 100%)' :
                      focusedPlan === 'enterprise' ? 'linear-gradient(135deg, #fbffff 0%, #eefcff 100%)' : 'white',
          padding: '40px',
          borderRadius: '28px',
          border: focusedPlan === 'free' ? '3px solid #e5e7eb' :
                  focusedPlan === 'basic' ? '3px solid #e9d5ff' :
                  focusedPlan === 'core' ? '3px solid #bfdbfe' :
                  focusedPlan === 'enterprise' ? '3px solid #7dd3fc' : '1px solid #d9e2ec',
          boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          textAlign: 'center',
          transition: 'all 0.25s ease',
        }}
      >
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '32px' }}>아래에서 월별 추적 사용자 수(MTU)를 선택하세요.</p>

        {/* Display Box */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1a2a6c', marginBottom: '4px' }}>{formatMTU(mtu)}</div>
            <div style={{ fontSize: '14px', color: '#777' }}>MTU</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1a2a6c', marginBottom: '4px' }}>₩{PRICE_PER_MTU.toFixed(2)}</div>
            <div style={{ fontSize: '14px', color: '#777' }}>MTU당 가격</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1a2a6c', marginBottom: '4px' }}>₩{annualPrice.toLocaleString()}</div>
            <div style={{ fontSize: '14px', color: '#777' }}>연간 가격</div>
          </div>
        </div>

        {/* Slider */}
        <div style={{ margin: '30px 0', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '8px', padding: '0 11px', position: 'relative' }}>
            {['1k', '10k', '50k', '100k', '300k', '500k', '1M', '2M'].map((label, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <span>{label}</span>
                <span style={{ width: '6px', height: '6px', background: '#cbd5e1', borderRadius: '50%', marginTop: '6px', position: 'absolute', top: '16px' }}></span>
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', padding: '0 11px' }}>
            <input
              ref={mtuSliderRef}
              id="mtu-slider"
              type="range"
              min="1000"
              max="2000000"
              step="1000"
              value={mtu}
              onChange={updateMTUValues}
              onInput={updateMTUValues}
              style={{
                WebkitAppearance: 'none',
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #396afc 0%, #396afc var(--slider-progress, ${((mtu - 1000) / (2000000 - 1000)) * 100}%), #cbd5e1 var(--slider-progress, ${((mtu - 1000) / (2000000 - 1000)) * 100}%), #cbd5e1 100%)`,
                outline: 'none',
                transition: 'none',
                cursor: 'pointer',
              }}
            />
            <style jsx>{`
              #mtu-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #396afc;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(57, 106, 252, 0.4);
                cursor: grab;
                transition: transform 0.1s ease, box-shadow 0.1s ease;
              }
              #mtu-slider::-webkit-slider-thumb:active {
                cursor: grabbing;
                transform: scale(1.15);
                box-shadow: 0 3px 10px rgba(57, 106, 252, 0.6);
              }
              #mtu-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #396afc;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(57, 106, 252, 0.4);
                cursor: grab;
                transition: transform 0.1s ease, box-shadow 0.1s ease;
              }
              #mtu-slider::-moz-range-thumb:active {
                cursor: grabbing;
                transform: scale(1.15);
                box-shadow: 0 3px 10px rgba(57, 106, 252, 0.6);
              }
              #mtu-slider::-moz-range-track {
                height: 6px;
                border-radius: 3px;
                background: #cbd5e1;
              }
            `}</style>
          </div>
        </div>

        {/* Yearly Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '18px', gap: '12px', fontSize: '15px', color: '#444' }}>
          <div>연간 결제</div>
          <div
            ref={yearlyToggleRef}
            onClick={toggleYearly}
            style={{
              position: 'relative',
              width: '48px',
              height: '24px',
              background: isYearly ? '#3b82f6' : '#d1d5db',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: isYearly ? '27px' : '3px',
                width: '18px',
                height: '18px',
                background: 'white',
                borderRadius: '50%',
                transition: 'left 0.25s',
              }}
            />
          </div>
        </div>
      </div>

      {/* Plan Overview Table */}
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, margin: '60px 0 30px 0' }}>
        요금제 핵심 구조 한눈에 보기 <br />(Plan Overview at a Glance)
      </h2>

      <div style={{ maxWidth: '1100px', margin: '0 auto 80px', overflowX: 'auto', padding: '0 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'left' }}>구분</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Free</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Basic</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Core</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: '#fbfdff' }}>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>Usage (사용량)</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>MTU 소규모 트래킹 시작</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>기본 MTU 확장</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>대규모 MTU + 우선 처리</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>무제한 확장 + 전용 인프라</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>Analytics (분석 기능)</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>기본 분석(차트·세그먼트)</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>고급 분석 일부 제공</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>전체 고급 분석 + 협업</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>커스텀 분석 + 조직 전사 운영</td>
            </tr>
            <tr style={{ background: '#fbfdff' }}>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>Data Management (데이터 관리)</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>기본 이벤트 관리</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>스키마 관리 + 태깅</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>데이터 파이프라인 + 자동화</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>엔터프라이즈 데이터 거버넌스</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>Governance & Security (보안/권한)</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>기본 권한</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>역할 기반 권한 제공</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>SSO·고급 정책</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>규제 산업 수준 보안·감사 로그</td>
            </tr>
            <tr style={{ background: '#fbfdff' }}>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>Support & Services (지원)</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>셀프서비스</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>이메일 지원</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>전담 매니저 옵션</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>SLA·전담 팀·기술지원 포함</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Feature Highlights Table */}
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, margin: '60px 0 30px 0' }}>
        요금제별 핵심 기능 하이라이트 <br />(Feature Highlights by Plan)
      </h2>

      <div style={{ maxWidth: '1100px', margin: '0 auto 80px', overflowX: 'auto', padding: '0 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'left' }}>카테고리</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Free</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Basic</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Core</th>
              <th style={{ padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)', color: '#0f172a', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(16,24,40,0.06)', textAlign: 'center' }}>Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: '#fbfdff' }}>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>트래킹 용량</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>가볍게 시작해도 충분한 기본 용량</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>서비스 성장에 맞춘 유연한 확장</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>대규모 환경에서도 안정적인 처리</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>대기업·대규모 트래픽까지 무제한 대응</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>분석 도구</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>필수 분석만 깔끔하게</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>세그먼트·리텐션 등 핵심 고급 기능</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>시그널·임팩트 포함 전 기능 제공</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>조직 전체 의사결정용 맞춤 분석</td>
            </tr>
            <tr style={{ background: '#fbfdff' }}>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>데이터 관리</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>기본 이벤트 구조 지원</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>구조화·정리 기능 강화</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>자동화된 파이프라인·변환 제공</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>엔터프라이즈 데이터 표준화 체계</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>보안·정책</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>기본적인 프로젝트 보호</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>역할 기반 접근 제어</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>SSO·강화된 보안 설정</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>산업별 규제 대응 + 감사 로그</td>
            </tr>
            <tr style={{ background: '#fbfdff' }}>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'left' }}><strong>지원</strong></td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>온라인 가이드</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>이메일 기반 지원</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>전담 매니저 옵션 제공</td>
              <td style={{ padding: '14px 18px', borderBottom: '1px solid rgba(16,24,40,0.04)', color: '#334155', fontSize: '14px', textAlign: 'center' }}>SLA + 우선 대응 지원</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FAQ Section */}
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, margin: '60px 0 30px 0' }}>FAQ</h2>

      <div style={{ maxWidth: '800px', margin: '0 auto 80px', padding: '0 20px' }}>
        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            로그 용량은 어떻게 계산되나요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            atsignal은 월간 업로드된 총 로그 데이터 바이트 기준으로 과금합니다.
          </p>
        </details>

        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            Core와 Enterprise의 차이는 무엇인가요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            Enterprise는 전용 인프라, 고급 보안 옵션, Technical Account Manager를 포함합니다.
          </p>
        </details>

        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            Free 플랜은 무료로 사용할 수 있나요? 제한 사항이 있나요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            Free 플랜은 월 500K Events까지 무료로 제공되며,
            서비스를 처음 경험하시거나 가볍게 테스트하려는 고객에게 적합합니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            다만 무료 플랜에서는 제공되는 기능에 일부 제한이 있을 수 있으며,
            허용된 이벤트 사용량을 초과하면 데이터 수집이 일시적으로 중단될 수 있습니다.
            필요하신 경우 언제든 상위 플랜으로 전환하시면 즉시 정상적으로 이용하실 수 있습니다.
          </p>
        </details>

        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            이벤트 기반 과금(per 1K Events)은 어떻게 계산되나요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            AtSignal은 월간 이벤트 사용량을 기준으로 요금이 책정됩니다.
            수집된 이벤트 수를 1,000건 단위로 계산하여 정해진 단가가 적용됩니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            Basic: ₩56 / 1K Events
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            Core: ₩27.9 / 1K Events
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            Enterprise: ₩8.7 / 1K Events
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            플랜이 올라갈수록 단가가 낮아지므로,
            이벤트 발생량이 많은 서비스일수록 상위 플랜에서 비용 효율을 높일 수 있습니다.
          </p>
        </details>

        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            MTU 기준 과금은 어떤 경우에 선택할 수 있나요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            MTU 기반 과금은 Core 및 Enterprise 플랜에서 선택 가능한 옵션입니다.
            사용자의 활동 패턴이나 서비스 구조에 따라 이벤트 양이 크게 증가하는 서비스라면
            MTU 방식이 비용 예측과 관리에 도움이 될 수 있습니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            이벤트 기반 과금과 MTU 기반 과금 중
            서비스에 가장 적합한 방식을 선택하실 수 있도록 준비되어 있습니다.
          </p>
        </details>

        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            약정을 선택하면 어떤 혜택을 받을 수 있나요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            장기적으로 안정적인 운영을 계획하고 계시다면 약정을 통해 비용을 절감하실 수 있습니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            Basic 플랜: 12개월 약정 + 선결제 시 약 16.6% 할인
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            Core / Enterprise: 3년 약정 시 더 낮은 단가가 적용되며,
            대규모 운영 환경에 적합한 요금 구조를 제공합니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            오래 사용할수록 합리적인 비용으로 AtSignal을 이용하실 수 있도록 구성된 혜택입니다.
          </p>
        </details>

        <details style={{ marginBottom: '20px' }}>
          <summary style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d9e2ec', cursor: 'pointer', fontWeight: 600 }}>
            약정한 이벤트나 MTU 사용량을 초과하면 어떻게 처리되나요?
          </summary>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            약정된 사용량을 초과하더라도 서비스가 중단되지는 않습니다.
            초과된 부분에 대해서만 별도 요금이 부과됩니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: 'none' }}>
            특히 <strong>Core와 Enterprise 플랜은 초과분도 낮은 단가(Low Price Tier)</strong>로 계산되어
            갑작스러운 사용량 증가가 발생하더라도 비용 부담이 커지지 않도록 설계되어 있습니다.
          </p>
          <p style={{ background: 'white', margin: 0, padding: '14px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            안정적인 서비스 운영을 위해 예측 가능한 가격 정책을 제공하고 있습니다.
          </p>
        </details>
      </div>

      {/* CTA Footer */}
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1e293b', color: 'white' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '12px', margin: '0 0 12px 0' }}>atsignal 도입을 고려하고 계신가요?</h2>
        <p style={{ margin: '0 0 14px 0' }}>가장 빠르게 운영 비용을 절감하는 방법입니다.</p>
        <Link href="#" style={{ display: 'inline-block', marginTop: '14px', padding: '14px 30px', background: '#3b82f6', borderRadius: '8px', textDecoration: 'none', color: 'white', fontWeight: 700 }}>
          Contact Sales
        </Link>
      </div>
    </div>
  );
}

