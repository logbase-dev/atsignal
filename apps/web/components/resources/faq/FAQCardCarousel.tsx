'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import type { FAQ } from '@/lib/admin/types';

interface FAQCardCarouselProps {
  faqs: FAQ[];
  locale: string;
}

export function FAQCardCarousel({ faqs, locale }: FAQCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('FAQCardCarousel received faqs:', faqs.length);

  // FAQ가 4개 미만이면 있는 만큼만 사용 (복제하지 않음)
  let displayFaqs = [...faqs];
  
  // 4개보다 많으면 4개만 선택
  if (displayFaqs.length > 4) {
    displayFaqs = displayFaqs.slice(0, 4);
  }

  // 무한 스크롤을 위해 FAQ를 3배로 복제 (앞, 중간, 뒤) - 단, 4개 이상일 때만
  const extendedFaqs = displayFaqs.length >= 4 
    ? [...displayFaqs, ...displayFaqs, ...displayFaqs]
    : displayFaqs;
  const startIndex = displayFaqs.length >= 4 ? displayFaqs.length : 0; // 중간 세트의 시작 인덱스

  useEffect(() => {
    if (displayFaqs.length === 0 || displayFaqs.length < 4) return;
    
    // 초기 위치를 중간 세트로 설정 (트랜지션 없이)
    setIsTransitioning(false);
    setCurrentIndex(startIndex);
    
    // 다음 프레임에서 트랜지션 활성화
    const timer = setTimeout(() => {
      setIsTransitioning(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [displayFaqs.length, startIndex]);

  useEffect(() => {
    if (displayFaqs.length === 0 || displayFaqs.length < 4 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 3000); // 3초마다 이동

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [displayFaqs.length, isPaused]);

  // 무한 루프 처리 (4개 이상일 때만)
  useEffect(() => {
    if (!isTransitioning || displayFaqs.length < 4) return;

    const handleTransitionEnd = () => {
      // 마지막 세트에 도달하면 중간 세트로 점프
      if (currentIndex >= displayFaqs.length * 2) {
        setIsTransitioning(false);
        setCurrentIndex(startIndex);
        setTimeout(() => setIsTransitioning(true), 50);
      }
      // 첫 번째 세트에 도달하면 중간 세트로 점프
      else if (currentIndex < displayFaqs.length) {
        setIsTransitioning(false);
        setCurrentIndex(startIndex + displayFaqs.length - 1);
        setTimeout(() => setIsTransitioning(true), 50);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('transitionend', handleTransitionEnd);
      return () => container.removeEventListener('transitionend', handleTransitionEnd);
    }
  }, [currentIndex, displayFaqs.length, startIndex, isTransitioning]);

  if (faqs.length === 0) {
    return (
      <div style={{ 
        padding: '3rem 1rem', 
        textAlign: 'center', 
        color: '#666',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>{locale === 'en' ? 'No featured FAQs available.' : '상단 고정 FAQ가 없습니다.'}</p>
      </div>
    );
  }

  // 카드 너비 계산 (실제 FAQ 개수에 맞춰서)
  const cardWidth = 280; // 최소 카드 너비
  const gap = 24; // 1.5rem = 24px
  const visibleCards = Math.min(4, displayFaqs.length); // 실제 표시할 카드 수
  const containerWidth = (cardWidth * visibleCards) + (gap * (visibleCards - 1));

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: `${containerWidth}px`,
        margin: '0 auto',
        padding: '2rem 0',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* 카드 컨테이너 */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: `${gap}px`,
          transform: `translateX(-${currentIndex * (cardWidth + gap)}px)`,
          transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
        }}
      >
        {extendedFaqs.map((faq, index) => {
          if (!faq.id) return null;
          
          const question = locale === 'en' && faq.question.en 
            ? faq.question.en 
            : faq.question.ko;
          const answer = locale === 'en' && faq.answer.en 
            ? faq.answer.en 
            : faq.answer.ko;

          const isExpanded = expandedCardId === `${faq.id}-${index}`;

          return (
            <div
              key={`${faq.id}-${index}`}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '2px solid #20BDFF',
                boxShadow: '0 4px 12px rgba(32, 189, 255, 0.15)',
                padding: '1.5rem',
                minHeight: '180px',
                width: `${cardWidth}px`,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 189, 255, 0.25)';
                setIsPaused(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(32, 189, 255, 0.15)';
                setIsPaused(false);
              }}
              onClick={() => {
                const cardId = `${faq.id}-${index}`;
                setExpandedCardId(expandedCardId === cardId ? null : cardId);
              }}
            >
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '1rem',
                  lineHeight: '1.4',
                  flex: isExpanded ? 'none' : '1',
                  display: 'flex',
                  alignItems: isExpanded ? 'flex-start' : 'center',
                }}
              >
                {question}
              </h3>
              
              {isExpanded && (
                <div
                  style={{
                    flex: 1,
                    color: '#666',
                    lineHeight: '1.6',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e5e5',
                    animation: 'fadeIn 0.3s ease-in-out',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug]}
                    components={{
                      p: ({ children }) => (
                        <p style={{ margin: '0 0 0.75rem 0' }}>{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem' }}>{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem' }}>{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: '0 0 0.25rem 0' }}>{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ fontWeight: '600', color: '#1a1a1a' }}>{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '0.125rem 0.25rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.8125rem',
                          fontFamily: 'monospace'
                        }}>{children}</code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote style={{
                          borderLeft: '4px solid #0070f3',
                          paddingLeft: '1rem',
                          margin: '0.75rem 0',
                          fontStyle: 'italic',
                          color: '#555'
                        }}>{children}</blockquote>
                      ),
                      h1: ({ children }) => (
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.75rem 0', color: '#1a1a1a' }}>{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.75rem 0', color: '#1a1a1a' }}>{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.75rem 0', color: '#1a1a1a' }}>{children}</h3>
                      ),
                      table: ({ children }) => (
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse', 
                          margin: '0.75rem 0',
                          border: '1px solid #e5e5e5'
                        }}>{children}</table>
                      ),
                      thead: ({ children }) => (
                        <thead style={{ backgroundColor: '#f8f9fa' }}>{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th style={{ 
                          padding: '0.5rem 0.75rem', 
                          border: '1px solid #e5e5e5',
                          fontWeight: '600',
                          textAlign: 'left',
                          fontSize: '0.8125rem'
                        }}>{children}</th>
                      ),
                      td: ({ children }) => (
                        <td style={{ 
                          padding: '0.5rem 0.75rem', 
                          border: '1px solid #e5e5e5',
                          fontSize: '0.8125rem'
                        }}>{children}</td>
                      ),
                    }}
                  >
                    {answer}
                  </ReactMarkdown>
                </div>
              )}

              {!isExpanded && (
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    textAlign: 'center',
                    color: '#20BDFF',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  {locale === 'en' ? 'Click to view answer' : '클릭하여 답변 보기'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

