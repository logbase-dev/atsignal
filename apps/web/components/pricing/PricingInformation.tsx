'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NewsletterModal from '@/components/Newsletter/NewsletterModal';

interface PricingInformationProps {
  locale: string;
}

type Plan = 'free' | 'basic' | 'power' | 'enterprise';
type ChartSize = 'medium' | 'mdsmall' | 'small';
type SliderStyle = CSSProperties & { '--slider-progress'?: string };

const EVENT_VALUES = [100000, 500000, 20000000, 40000000, 60000000, 80000000, 100000000, 200000000, 400000000, 600000000, 800000000, 1000000000];
const UNIT_PRICES = [0, 28.0, 22.4, 17.9, 14.3, 11.5, 8.6, 6.5, 4.8, 3.6, 2.7, 2.0];
const MONTHLY_FEES = [0, 546000, 994000, 1352400, 1639120, 1868496, 2728656, 4018896, 4986576, 5712336, 6256656, 8256656];
const ANNUAL_FEES = [0, 454982, 828300, 1126955, 1365879, 1557018, 2273789, 3348946, 4155314, 4760090, 5213671, 6880271];
const SLIDER_MIN = 0;
const SLIDER_MAX = 1100;
const PLAN_START_EVENTS: Record<Plan, number> = {
  free: EVENT_VALUES[0],
  basic: EVENT_VALUES[1],
  power: EVENT_VALUES[6],
  enterprise: EVENT_VALUES[11],
};
const BASE_WIDTH = 320;
const BASE_HEIGHT = 240;

export default function PricingInformation({ locale: _locale }: PricingInformationProps) {
  const [sliderValue, setSliderValue] = useState(0);
  const [chartSize, setChartSize] = useState<ChartSize>('mdsmall');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [focusedPlan, setFocusedPlan] = useState<Plan | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);

  const chartScale = useMemo(() => {
    if (chartSize === 'medium') return 0.7;
    if (chartSize === 'mdsmall') return 0.55;
    if (chartSize === 'small') return 0.4;
    return 0.7;
  }, [chartSize]);

  const getInterpolatedEvent = (value: number) => {
    const segmentIndex = Math.floor(value / 100);
    const nextSegmentIndex = segmentIndex + 1;
    const hasNext = nextSegmentIndex < EVENT_VALUES.length;
    const segmentProgress = (value % 100) / 100;
    return hasNext
      ? EVENT_VALUES[segmentIndex] + (EVENT_VALUES[nextSegmentIndex] - EVENT_VALUES[segmentIndex]) * segmentProgress
      : EVENT_VALUES[EVENT_VALUES.length - 1];
  };

  const getPlanForEvent = (event: number): Plan => {
    if (event < PLAN_START_EVENTS.basic) return 'free';
    if (event < PLAN_START_EVENTS.power) return 'basic';
    if (event < PLAN_START_EVENTS.enterprise) return 'power';
    return 'enterprise';
  };

  const getSliderValueForEvent = (event: number) => {
    const index = EVENT_VALUES.findIndex((value) => value === event);
    if (index >= 0) return index * 100;
    if (event >= EVENT_VALUES[EVENT_VALUES.length - 1]) return SLIDER_MAX;
    const ratio = event / EVENT_VALUES[EVENT_VALUES.length - 1];
    return Math.round(ratio * SLIDER_MAX);
  };

  const handleSliderChange = (value: number) => {
    const eventValue = getInterpolatedEvent(value);
    setSliderValue(value);
    setFocusedPlan(getPlanForEvent(eventValue));
  };

  const handlePlanFocus = (plan: Plan) => {
    const startEvent = PLAN_START_EVENTS[plan];
    const sliderAtStart = getSliderValueForEvent(startEvent);
    setSliderValue(sliderAtStart);
    setFocusedPlan(plan);
  };

  useEffect(() => {
    const initialEvent = getInterpolatedEvent(sliderValue);
    setFocusedPlan(getPlanForEvent(initialEvent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPlan = focusedPlan || getPlanForEvent(getInterpolatedEvent(sliderValue));

  const derived = useMemo(() => {
    const segmentIndex = Math.floor(sliderValue / 100);
    const nextSegmentIndex = segmentIndex + 1;
    const hasNext = nextSegmentIndex < EVENT_VALUES.length;
    const segmentProgress = (sliderValue % 100) / 100;

    const interpolatedEvent = hasNext
      ? EVENT_VALUES[segmentIndex] + (EVENT_VALUES[nextSegmentIndex] - EVENT_VALUES[segmentIndex]) * segmentProgress
      : EVENT_VALUES[EVENT_VALUES.length - 1];
    const interpolatedUnitPrice = hasNext
      ? UNIT_PRICES[segmentIndex] + (UNIT_PRICES[nextSegmentIndex] - UNIT_PRICES[segmentIndex]) * segmentProgress
      : UNIT_PRICES[UNIT_PRICES.length - 1];
    const interpolatedMonthlyRaw = hasNext
      ? MONTHLY_FEES[segmentIndex] + (MONTHLY_FEES[nextSegmentIndex] - MONTHLY_FEES[segmentIndex]) * segmentProgress
      : MONTHLY_FEES[MONTHLY_FEES.length - 1];
    const interpolatedAnnualRaw = hasNext
      ? ANNUAL_FEES[segmentIndex] + (ANNUAL_FEES[nextSegmentIndex] - ANNUAL_FEES[segmentIndex]) * segmentProgress
      : ANNUAL_FEES[ANNUAL_FEES.length - 1];
    const interpolatedMonthly = interpolatedEvent < 500000 ? 0 : interpolatedMonthlyRaw;
    const interpolatedAnnual = interpolatedEvent < 500000 ? 0 : interpolatedAnnualRaw;

    const svgWidth = BASE_WIDTH * chartScale;
    const svgHeight = BASE_HEIGHT * chartScale;
    const padding = { top: 10, right: 10, bottom: 20, left: 20 };
    const graphWidth = svgWidth - padding.left - padding.right;
    const graphHeight = svgHeight - padding.top - padding.bottom;
    const minEvent = EVENT_VALUES[0];
    const maxEvent = EVENT_VALUES[EVENT_VALUES.length - 1];
    const minFee = Math.min(...MONTHLY_FEES);
    const maxFee = Math.max(...MONTHLY_FEES);
    const getX = (event: number) => padding.left + (graphWidth * (event - minEvent)) / (maxEvent - minEvent);
    const getY = (fee: number) => padding.top + graphHeight - (graphHeight * (fee - minFee)) / (maxFee - minFee);
    const startPoint = { x: getX(minEvent), y: getY(minFee) };
    const endPoint = { x: getX(maxEvent), y: getY(maxFee) };
    const controlPoint = { x: startPoint.x, y: endPoint.y };
    const pathData = `M ${startPoint.x.toFixed(2)},${startPoint.y.toFixed(2)} Q ${controlPoint.x.toFixed(2)},${controlPoint.y.toFixed(2)} ${endPoint.x.toFixed(2)},${endPoint.y.toFixed(2)}`;
    const markerX = getX(interpolatedEvent);
    const tSquared = (markerX - startPoint.x) / (endPoint.x - startPoint.x);
    const t = Math.sqrt(Math.max(0, tSquared));
    const markerY = Math.pow(1 - t, 2) * startPoint.y + (2 * t - tSquared) * endPoint.y;
    const gridY = Array.from({ length: 5 }, (_, index) => padding.top + (graphHeight / 4) * index);
    const gridX = Array.from({ length: 6 }, (_, index) => padding.left + (graphWidth / 5) * index);
    const dynamicFontSize = (svgWidth / BASE_WIDTH) * 16;
    const progress = Math.min(Math.max(((sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100, 0), 100);

    return {
      interpolatedEvent,
      interpolatedUnitPrice,
      interpolatedMonthly,
      interpolatedAnnual,
      svgWidth,
      svgHeight,
      padding,
      gridX,
      gridY,
      pathData,
      markerX,
      markerY,
      dynamicFontSize,
      progress,
    };
  }, [chartScale, sliderValue]);

  const sliderStyle: SliderStyle = { '--slider-progress': `${derived.progress}%` };
  const planModalTitle: Record<Plan, string> = {
    free: 'Start for Free 이용신청',
    basic: 'Basic 요금제 업그레이드',
    power: 'Power 요금제 업그레이드',
    enterprise: 'Enterprise 요금제 업그레이드',
  };
  const planLabel: Record<Plan, string> = {
    free: 'Free',
    basic: 'Basic',
    power: 'Power',
    enterprise: 'Enterprise',
  };

  return (
    <div className="pricing-root">
      <div className="hero">
        <h1>atsignal pricing</h1>
        <p>월간 추적 이벤트(event)수 기준으로 계산되는 명확하고 투명한 가격 구조.</p>
        <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p>
      </div>

      <h2 className="section-title">요금제</h2>
      <div className="pricing-container">
        <div
          className={`card card-free ${focusedPlan === 'free' ? 'active' : ''}`}
          data-plan="free"
          tabIndex={0}
          onMouseEnter={() => handlePlanFocus('free')}
          onFocus={() => handlePlanFocus('free')}
        >
          <h2>Free</h2>
          <p className="price">월 500K 이벤트까지 무료</p>
          <p className="desc">atsignal을 무료로 체험하세요.</p>
          <ul>
            <li>기본 분석 기능 제공</li>
            <li>프로젝트 1개, 10 Reports</li>
            <li>데이터 다운로드 불가</li>
            <li>500K 초과시 접속 불가(이벤트 수집은 지속되며, 상위 요금제 계약시 접속 가능)</li>
          </ul>
          <button type="button" className="cta-btn" onClick={() => setSelectedPlan('free')}>
            Start for Free
          </button>
        </div>

        <div
          className={`card card-basic ${focusedPlan === 'basic' ? 'active' : ''}`}
          data-plan="basic"
          tabIndex={0}
          onMouseEnter={() => handlePlanFocus('basic')}
          onFocus={() => handlePlanFocus('basic')}
        >
          <h2>Basic</h2>
          <p className="price">
            ~200M 이벤트
            <br />
            (₩28.0~₩18.8 / 1K events)
          </p>
          <p className="desc">12개월 약정 시 16.6% 할인</p>
          <ul>
            <li>주요 자동정의/자동검증 기능</li>
            <li>프로젝트 3개, 300 Reports</li>
            <li>MTU기반 요금제 선택 가능</li>
            <li>SLA 99.9% uptime (한국 평일 기준)</li>
          </ul>
          <button type="button" className="cta-btn secondary" onClick={() => setSelectedPlan('basic')}>
            Upgrade
          </button>
        </div>

        <div
          className={`card card-power ${focusedPlan === 'power' ? 'active' : ''}`}
          data-plan="power"
          tabIndex={0}
          onMouseEnter={() => handlePlanFocus('power')}
          onFocus={() => handlePlanFocus('power')}
        >
          <h2>Power</h2>
          <p className="price">
            ~1,000M 이벤트
            <br />
            (₩13.4~₩5.5 / 1K events)
          </p>
          <p className="desc">3년 약정 시 월별 Low Price(MTU or Event) 보장</p>
          <ul>
            <li>로그 스펙 이상 감지 옵션</li>
            <li>프로젝트 10개, Reports 무제한</li>
            <li>Real-time Streaming &lt; 30% events</li>
            <li>SLA 99.9% uptime(공휴일 포함)</li>
          </ul>
          <button type="button" className="cta-btn" onClick={() => setSelectedPlan('power')}>
            Upgrade
          </button>
        </div>

        <div
          className={`card card-enterprise ${focusedPlan === 'enterprise' ? 'active' : ''}`}
          data-plan="enterprise"
          tabIndex={0}
          onMouseEnter={() => handlePlanFocus('enterprise')}
          onFocus={() => handlePlanFocus('enterprise')}
        >
          <h2>Enterprise</h2>
          <p className="price">별도 협의에 의해 가격을 산정합니다.</p>
          <p className="desc">대규모 조직을 위한 전용 플랜</p>
          <ul>
            <li>전용 인프라(VPC)</li>
            <li>고급 보안 옵션 (CMK / BYOK)</li>
            <li>Real-time Streaming 무제한</li>
            <li>분기별 Healthcheck 방문 지원</li>
          </ul>
          <button type="button" className="cta-btn" onClick={() => setSelectedPlan('enterprise')}>
            Contact Sales
          </button>
        </div>
      </div>

      <h2 className="section-title">나에게 맞는 요금제 계산하기</h2>
      <div className="main-container">
        <div className="graph-container">
          <div className="graph-plan-label">{focusedPlan ? planLabel[focusedPlan] : ''}</div>
          <div className="graph-mtu-info">
            <div className="graph-mtu-value">{Math.round(derived.interpolatedEvent).toLocaleString()}</div>
            <div className="graph-mtu-label">이벤트 수</div>
          </div>
          <svg id="price-graph" width={derived.svgWidth} height={derived.svgHeight}>
            <g className="grid">
              {derived.gridY.map((y, idx) => (
                <line key={`y-${idx}`} x1={derived.padding.left} y1={y} x2={derived.padding.left + (derived.svgWidth - derived.padding.left - derived.padding.right)} y2={y} />
              ))}
              {derived.gridX.map((x, idx) => (
                <line key={`x-${idx}`} x1={x} y1={derived.padding.top} x2={x} y2={derived.padding.top + (derived.svgHeight - derived.padding.top - derived.padding.bottom)} />
              ))}
            </g>
            <text
              className="chart-title"
              x={derived.padding.left + (derived.svgWidth - derived.padding.left - derived.padding.right) - 10}
              y={derived.padding.top + (derived.svgHeight - derived.padding.top - derived.padding.bottom) - 10}
              textAnchor="end"
              fontSize={`${derived.dynamicFontSize.toFixed(1)}px`}
              fill="rgba(15, 23, 42, 0.45)"
              fontStyle="italic"
            >
              이벤트 별 가격의 증가폭
            </text>
            <path className="graph-line" d={derived.pathData} />
            <circle id="graph-marker-circle" r="6" className="graph-marker" cx={derived.markerX} cy={derived.markerY} />
          </svg>
          {/*
          <div className="graph-controls">
            <label>
              <input type="radio" name="chart-size" value="medium" checked={chartSize === 'medium'} onChange={() => setChartSize('medium')} />
              Medium
            </label>
            <label>
              <input type="radio" name="chart-size" value="mdsmall" checked={chartSize === 'mdsmall'} onChange={() => setChartSize('mdsmall')} />
              MdSmall
            </label>
            <label>
              <input type="radio" name="chart-size" value="small" checked={chartSize === 'small'} onChange={() => setChartSize('small')} />
              Small
            </label>
          </div>
          */}
        </div>

        <div className="mtu-calculator-wrapper">
          <p className="subtitle">아래에서 월별 이벤트 수를 선택하세요.</p>
          <div className="mtu-slider-container">
            <div className="mtu-slider-track">
              {['100K', '500K', '20M', '40M', '60M', '80M', '100M', '200M', '400M', '600M', '800M', '1G'].map((label) => (
                <div className="mtu-track-item" key={label}>
                  <span>{label}</span>
                  <span className="mtu-marker" />
                </div>
              ))}
            </div>
            <div className="mtu-slider-wrapper">
              <input
                id="mtu-slider"
                type="range"
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={1}
                value={sliderValue}
                onChange={(event) => handleSliderChange(parseInt(event.target.value, 10))}
                style={sliderStyle}
              />
            </div>
          </div>
          {currentPlan === 'enterprise' ? (
            <div className="mtu-display-box enterprise-contact">
              <div className="mtu-label">담당자에게 문의하기</div>
              <button
                type="button"
                className="cta-button"
                onClick={() => setSelectedPlan('enterprise')}
              >
                Contact Sales
              </button>
            </div>
          ) : (
            <div className="mtu-display-box fee-row">
              <div className="mtu-fee-item">
                <div className="mtu-value-small" id="display-monthly-fee">
                  ₩{Math.round(derived.interpolatedMonthly).toLocaleString()}
                </div>
                <div className="mtu-label">월별 요금</div>
              </div>
              <div className="mtu-fee-item">
                <div className="mtu-value-small" id="display-annual-fee">
                  ₩{Math.round(derived.interpolatedAnnual).toLocaleString()}
                </div>
                <div className="mtu-label">연선납시 월별요금</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title">
        요금제 핵심 구조 한눈에 보기 <br />
        <span className="section-subtitle-en">(Plan Overview at a Glance)</span>
      </h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>구분</th>
              <th>Free</th>
              <th>Basic</th>
              <th>Power</th>
              <th>Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  Usage
                  <br />
                  (사용량)
                </strong>
              </td>
              <td>500K Event이하 트래킹</td>
              <td>
                Event 또는 MTU 선택가능
                <br />
                고객당 event수 패턴에 따라
                <br />
                고객사가 직접 결정
              </td>
              <td>
                Dynamic Low Price
                <br />
                MTU요금 또는 Event요금중
                <br />
                저렴한 요금으로 적용
              </td>
              <td>무제한 확장 + 전용 인프라</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  Analytics
                  <br />
                  (분석 기능)
                </strong>
              </td>
              <td>
                기본 분석
                <br />
                Segmentation
                <br />
                Retention
                <br />
                Cohort개수 제한
              </td>
              <td>
                전체 분석 기능 가능
                <br />
                Segmentation
                <br />
                Retention
                <br />
                Funnel
                <br />
                UserFlow
                <br />
                Attribution
                <br />
                Cohort
              </td>
              <td>
                협업
                <br />
                Anomaly Detection
                <br />
                Forecasting Feature
                <br />
                Service API
              </td>
              <td>
                Multiple Entity
                <br /> & <br />
                Multiple Service 통합
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  Project&Report
                  <br />
                  (리포트개수)
                </strong>
              </td>
              <td>
                1 Project
                <br />
                5 Boards
                <br />
                50 Cards
              </td>
              <td>
                3 Projects
                <br />
                50 Boards
                <br />
                500 Cards
              </td>
              <td>
                10 Projects
                <br /> &infin; Boards
                <br />
                &infin; Cards
              </td>
              <td>Unlimited</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  Data Collection Latency
                  <br />
                  (데이터 입수 지연)
                </strong>
              </td>
              <td>1 hour latency</td>
              <td>
                Near Real-time
                <br />
                (30초이하)
              </td>
              <td>
                Near Real-time
                <br />
                (30초이하)
              </td>
              <td>
                Near Real-time
                <br />
                (30초이하)
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  Data Retention & Access
                  <br />
                  (데이터 보관)
                </strong>
              </td>
              <td>
                90일
                <br />
                일괄분석가능기간=90일
              </td>
              <td>
                2년
                <br />
                일괄분석가능기간=2년
              </td>
              <td>
                Unlimited
                <br />
                일괄분석가능기간=3년
              </td>
              <td>Unlimited</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  PII & 민감정보 & 위치정보
                  <br />
                  (개인정보 보안)
                </strong>
              </td>
              <td>PII 제외 수집</td>
              <td>
                암호화(단방향)
                <br />
                Masking
              </td>
              <td>
                암호화(단방향+양방향)
                <br />
                Masking
              </td>
              <td>CMK 기능 제공</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>
                  Real-time Data Streaming
                  <br />
                  (실시간 데이터 전송)
                </strong>
              </td>
              <td>N/A</td>
              <td>
                전월 Event수의 10%
                <br />
                일별 최대치 = 1M
              </td>
              <td>
                전월 Event수의 20%
                <br />
                일별 최대치 = 10M
              </td>
              <td>별도 협의</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>Support & Services (지원)</strong>
              </td>
              <td>셀프서비스</td>
              <td>
                셀프서비스
                <br />
                이메일
                <br />
                원격 지원
              </td>
              <td>
                셀프서비스
                <br />
                이메일
                <br />
                원격 지원
                <br />
                방문지원
              </td>
              <td>+전담 팀·기술지원</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="section-title">
        요금제별 분석 기능 하이라이트 <br />
        <span className="section-subtitle-en">(Feature Highlights by Plan)</span>
      </h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>카테고리</th>
              <th>Free</th>
              <th>Basic</th>
              <th>Power</th>
              <th>Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>트래킹 용량</strong>
              </td>
              <td>가볍게 시작해도 충분한 기본 용량</td>
              <td>서비스 성장에 맞춘 유연한 확장</td>
              <td>대규모 환경에서도 안정적인 처리</td>
              <td>대기업·대규모 트래픽까지 무제한 대응</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>분석 도구</strong>
              </td>
              <td>필수 분석만 깔끔하게</td>
              <td>세그먼트·리텐션 등 핵심 고급 기능</td>
              <td>시그널·임팩트 포함 전 기능 제공</td>
              <td>조직 전체 의사결정용 맞춤 분석</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>데이터 관리</strong>
              </td>
              <td>기본 이벤트 구조 지원</td>
              <td>구조화·정리 기능 강화</td>
              <td>자동화된 파이프라인·변환 제공</td>
              <td>엔터프라이즈 데이터 표준화 체계</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>보안·정책</strong>
              </td>
              <td>기본적인 프로젝트 보호</td>
              <td>역할 기반 접근 제어</td>
              <td>SSO·강화된 보안 설정</td>
              <td>산업별 규제 대응 + 감사 로그</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>
                <strong>지원</strong>
              </td>
              <td>온라인 가이드</td>
              <td>이메일 기반 지원</td>
              <td>전담 매니저 옵션 제공</td>
              <td>SLA + 우선 대응 지원</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="section-title">FAQ</h2>
      <div className="faq">
        <div className="faq-item">
          <details>
            <summary>로그 용량은 어떻게 계산되나요?</summary>
            <p>atsignal은 월간 업로드된 총 로그 데이터의 이벤트 수 기준으로 과금합니다. 유료 요금제(Basic, Power, Enterprise)부터는 MTU기준 요금제도 제공합니다.</p>
          </details>
        </div>
        <div className="faq-item">
          <details>
            <summary>Power와 Enterprise의 차이는 무엇인가요?</summary>
            <p>Enterprise는 고급 보안 옵션(CMK: Cutomer Maneged Key)을 기반으로 강력한 보안을 제공하며, 이벤트당 요금도 가장 저렴합니다. 기타 기술 지원 및 SLA 수준이 가장 높습니다.</p>
          </details>
        </div>
        <div className="faq-item">
          <details>
            <summary>Free 플랜은 무료로 사용할 수 있나요? 제한 사항이 있나요?</summary>
            <p>
              Free 플랜은 월 500K Events까지 무료로 제공되며,
              서비스를 처음 경험하시거나 가볍게 테스트하려는 고객에게 적합합니다.
            </p>
            <p>
              다만 무료 플랜에서는 제공되는 기능에 일부 제한이 있을 수 있으며,
              허용된 이벤트 사용량을 초과하면 데이터 수집이 일시적으로 중단될 수 있습니다.
              필요하신 경우 언제든 상위 플랜으로 전환하시면 즉시 정상적으로 이용하실 수 있습니다.
            </p>
          </details>
        </div>
        <div className="faq-item">
          <details>
            <summary>이벤트 기반 과금(per 1K Events)은 어떻게 계산되나요?</summary>
            <p>
              atsignal은 월간 이벤트 사용량을 기준으로 요금이 책정됩니다.
              수집된 이벤트 수를 1,000건 단위로 계산하여 정해진 단가가 적용됩니다.
            </p>
            <p>
              Basic: 한달동안 500K~200M 범위로 Event가 수집되는 경우에 적합합니다. 1K 이벤트당 ₩28.8부터 시작하여 이벤트수가 늘어날 수록 단위가격은 ₩18.8까지 저렴해지는 구조입니다.
            </p>
            <p>
              Power: 200M초과시부터 1,000M 이벤트가 발생하는 경우 1K 이벤트당 ₩13.4 ~ ₩5.5가 적용됩니다.
            </p>
            <p>Enterprise: 별도 계약에 의해 산정됩니다.</p>
            <p>
              플랜이 올라갈수록 단가가 낮아지므로,
              이벤트 발생량이 많은 서비스일수록 상위 플랜에서 비용 효율을 높일 수 있습니다.
            </p>
          </details>
        </div>
        <div className="faq-item">
          <details>
            <summary>MTU 기준 과금은 어떤 경우에 선택할 수 있나요?</summary>
            <p>
              MTU 기반 과금은 고객수가 적지만, 고객당 이벤트수가 많은 경우 사용하시면 경제적입니다.
              사용자의 활동 패턴이나 서비스 구조에 따라 이벤트 양이 크게 증가하는 서비스라면
              MTU 방식이 비용 예측과 관리에 도움이 될 수 있습니다.
            </p>
            <p>
              이벤트 기반 과금과 MTU 기반 과금 중
              서비스에 가장 적합한 방식을 선택하실 수 있도록 준비되어 있습니다.
            </p>
          </details>
        </div>
        <div className="faq-item">
          <details>
            <summary>약정을 선택하면 어떤 혜택을 받을 수 있나요?</summary>
            <p>장기적으로 안정적인 운영을 계획하고 계시다면 약정을 통해 비용을 절감하실 수 있습니다.</p>
            <p>Basic 플랜: 12개월 약정 + 선결제 시 약 16.67% 할인</p>
            <p>
              Power / Enterprise: 3년 약정 시 더 낮은 단가가 적용되며,
              대규모 운영 환경에 적합한 요금 구조를 제공합니다. 3년 약정을 하시더라도 과금은 1년 단위로 선청구됩니다.
            </p>
            <p>오래 사용할수록 합리적인 비용으로 atsignal을 이용하실 수 있도록 구성된 혜택입니다.</p>
          </details>
        </div>
        <div className="faq-item">
          <details>
            <summary>약정한 이벤트나 MTU 사용량을 초과하면 어떻게 처리되나요?</summary>
            <p>
              약정된 사용량을 초과하더라도 서비스가 중단되지는 않습니다.
              초과된 부분에 대해서만 별도 요금이 부과됩니다. 한편, 연선납을 하는 경우에는 연간 총 이벤트수 이내리먄, 월별로 초과/부족이 발생해도 추가 요금이 발생하지 않습니다.
            </p>
            <p>
              특히 <strong>Power와 Enterprise 플랜은 초과분이 발생해도 낮은 단가(Low Price Tier)</strong>로 계산되어
              갑작스러운 사용량 증가가 발생하더라도 비용 부담이 커지지 않도록 설계되어 있습니다.
            </p>
          </details>
        </div>
      </div>

      <div className="bottom-cta">
        <h2>atsignal 도입을 고려하고 계신가요?</h2>
        <p>가장 빠르게 운영 비용을 절감하는 방법입니다.</p>
        <button
          type="button"
          className="cta-button bottom-cta-btn"
          onClick={() => setShowSalesModal(true)}
        >
          Contact Sales
        </button>
      </div>

      <style jsx>{`
        .pricing-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 0;
          background: #f7f9fc;
          color: #222222;
        }
        .hero {
          text-align: center;
          padding: 80px 20px;
          background: #e1f6ff;
        }
        .hero h1 {
          font-size: 40px;
          margin-bottom: 16px;
          font-weight: 800;
        }
        .hero p {
          font-size: 18px;
          color: #e1f6ff;
        }
        .section-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          margin: 60px 0 30px 0;
          color: #0f172a;
        }
        .section-title .section-subtitle-en {
          display: block;
          font-size: 14px;
          font-weight: 400;
          color: #94a3b8;
          margin-top: 4px;
        }
        .pricing-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto 60px;
          padding: 0 20px;
        }
        .card {
          background: white;
          padding: 24px;
          border-radius: 10px;
          border: 3px solid transparent;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        .card:hover,
        .card:focus-visible {
          border: 3px solid #2e5aac;
        }
        .card.active {
          border: 3px solid #2e5aac;
          box-shadow: 0 12px 30px rgba(46, 90, 172, 0.12);
          transform: translateY(-4px);
        }
        .card-free {
          background: linear-gradient(135deg, #f9fafb 0%, #b4e7ff 100%);
          color: #1e293b;
          border-color: #bfdbfe;
        }
        .card-basic {
          background: linear-gradient(135deg, #f9fafb 0%, #b4e7ff 100%);
          color: #1e293b;
          border-color: #bfdbfe;
        }
        .card-power {
          background: linear-gradient(135deg, #f9fafb 0%, #b4e7ff 100%);
          color: #1e293b;
          border-color: #bfdbfe;
        }
        .card-enterprise {
          background: linear-gradient(135deg, #f9fafb 0%, #b4e7ff 100%);
          color: #1e293b;
          border-color: #bfdbfe;
        }
        .card h2 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        .price {
          font-size: 18px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .desc {
          font-size: 14px;
          margin-bottom: 16px;
        }
        .card ul {
          margin: 0 0 20px 0;
          padding-left: 16px;
          flex-grow: 1;
        }
        .card ul li {
          font-size: 14px;
          margin-bottom: 6px;
        }
        .pricing-root :global(.cta-btn) {
          display: block;
          width: 100%;
          padding: 12px;
          text-align: center;
          font-size: 15px;
          border-radius: 8px;
          text-decoration: none;
          color: #0f172a;
          background: #ffffff;
          font-weight: 700;
          margin-top: auto;
          box-sizing: border-box;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
          border: 1px solid #9acff7;
          transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .pricing-root :global(.cta-btn:hover) {
          background: #4cbdfd;
          color: #ffffff;
          box-shadow: 0 10px 20px rgba(76, 189, 253, 0.35);
          border-color: #2fa7f1;
        }
        .table-wrapper {
          max-width: 1100px;
          margin: 0 auto 80px;
          overflow-x: auto;
          padding: 0 20px;
        }
        .table-wrapper table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(16, 24, 40, 0.04);
        }
        .table-wrapper thead th {
          padding: 16px 18px;
          background: linear-gradient(180deg, #f8fafc 0%, #e9ebee 100%);
          color: #0f172a;
          font-weight: 700;
          font-size: 14px;
          border-bottom: 1px solid rgba(16, 24, 40, 0.06);
        }
        .table-wrapper tbody td {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(16, 24, 40, 0.04);
          color: #334155;
          font-size: 14px;
        }
        .table-wrapper tbody tr:nth-child(even) {
          background: #fbfdff;
        }
        .table-wrapper tbody tr:hover {
          background: #e1f6ff;
        }
        .table-wrapper th:first-child,
        .table-wrapper td:first-child {
          text-align: left;
          border-right: 1px solid #f7f8f9;
        }
        .table-wrapper th,
        .table-wrapper td {
          text-align: center;
          vertical-align: middle;
        }
        .faq {
          max-width: 800px;
          margin: 0 auto 80px;
          padding: 0 20px;
        }
        .faq-item {
          margin-bottom: 20px;
        }
        .faq-item summary {
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #d9e2ec;
          cursor: pointer;
          font-weight: 600;
        }
        .faq-item p {
          background: white;
          margin: 0;
          padding: 14px;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-top: none;
          border-bottom: none;
          border-radius: 0;
        }
        .faq-item p:last-child {
          border-bottom: 1px solid #e2e8f0;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .bottom-cta {
          text-align: center;
          padding: 60px 20px;
          background: #20bdff;
          color: #222222;
        }
        .bottom-cta h2 {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .bottom-cta a {
          text-decoration: none;
        }
        .pricing-root :global(.bottom-cta-btn) {
          display: inline-block;
          margin-top: 16px;
        }
        .main-container {
          display: flex;
          justify-content: center;
          align-items: stretch;
          gap: 40px;
          margin: 0 auto 80px;
          max-width: 1200px;
          padding: 0 20px;
          flex-wrap: wrap;
        }
        .graph-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding: 24px;
          border-radius: 24px;
          background: linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%);
          border: 1px solid #d9e2ec;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
          min-width: 320px;
        }
        .graph-mtu-info {
          text-align: center;
          margin-bottom: 12px;
        }
        .graph-mtu-value {
          font-size: 28px;
          font-weight: 800;
          color: #1a2a6c;
        }
        .graph-mtu-label {
          font-size: 13px;
          color: #6b7280;
        }
        .graph-plan-label {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.2px;
          text-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
          margin-bottom: 10px;
        }
        .pill-label {
          align-self: flex-start;
          padding: 6px 12px;
          background: #e0f2ff;
          color: #0f172a;
          font-weight: 700;
          font-size: 12px;
          border-radius: 999px;
          margin-bottom: 10px;
        }
        .graph-controls {
          margin-top: 15px;
          display: flex;
          justify-content: center;
          gap: 15px;
          font-size: 14px;
          color: #555;
        }
        .graph-controls label {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        #price-graph .grid {
          stroke: #e2e8f0;
          stroke-width: 1;
          stroke-dasharray: 2, 2;
        }
        #price-graph .graph-line {
          stroke: #396afc;
          stroke-width: 3;
          fill: none;
        }
        #price-graph .graph-marker {
          fill: #396afc;
          stroke: white;
          stroke-width: 2;
        }
        #price-graph .chart-title {
          fill: rgba(15, 23, 42, 0.45);
          font-weight: 600;
          font-style: italic;
        }
        .mtu-calculator-wrapper {
          flex: 2;
          background: linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%);
          padding: 40px;
          border-radius: 24px;
          border: 1px solid #d9e2ec;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
          text-align: center;
        }
        .subtitle {
          color: #666;
          font-size: 15px;
          margin-bottom: 32px;
        }
        .mtu-display-box {
          display: flex;
          justify-content: space-around;
          margin-bottom: 32px;
        }
        .mtu-display-item {
          text-align: center;
        }
        .mtu-value {
          font-size: 32px;
          font-weight: 800;
          color: #1a2a6c;
          margin-bottom: 4px;
        }
        .mtu-value-small {
          font-size: 24px;
          font-weight: 700;
          color: #1a2a6c;
          margin-bottom: 4px;
        }
        .mtu-display-item-stacked {
          text-align: center;
        }
        .fee-row {
          gap: 40px;
          justify-content: center;
          align-items: flex-start;
        }
        .enterprise-contact {
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .mtu-fee-item:first-child {
          margin-bottom: 16px;
        }
        .mtu-label {
          font-size: 14px;
          color: #777;
        }
        .mtu-slider-container {
          margin: 30px 0;
          position: relative;
        }
        .mtu-slider-track {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #555;
          margin-bottom: 0px;
          padding: 0 11px;
          position: relative;
          height: 20px;
        }
        .mtu-track-item {
          position: relative;
        }
        .mtu-track-item > span:first-child {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
        }
        .mtu-marker {
          width: 6px;
          height: 6px;
          background: #cbd5e1;
          border-radius: 50%;
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
        }
        .mtu-slider-wrapper {
          position: relative;
          padding: 0;
        }
        #mtu-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, #396afc 0%, #396afc var(--slider-progress, 0%), #cbd5e1 var(--slider-progress, 0%), #cbd5e1 100%);
          outline: none;
          transition: none;
          cursor: pointer;
        }
        #mtu-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #396afc;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(57, 106, 252, 0.4);
          cursor: grab;
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

      <NewsletterModal
        isOpen={selectedPlan !== null || showSalesModal}
        onClose={() => {
          setSelectedPlan(null);
          setShowSalesModal(false);
        }}
        locale={_locale}
        variant="sales"
        customTitle={!showSalesModal && selectedPlan ? planModalTitle[selectedPlan] : undefined}
        customSubmitLabel="요청하기"
      />
    </div>
  );
}
