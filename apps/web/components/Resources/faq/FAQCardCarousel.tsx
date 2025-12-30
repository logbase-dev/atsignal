'use client';

import { useEffect, useState, useRef } from 'react';
import type { FAQ } from '@/lib/admin/types';
import { getLocaleFromPath } from '@/lib/i18n/getLocale';

interface FAQCardCarouselProps {
  faqs: FAQ[];
  locale?: string;
}

export function FAQCardCarousel({ faqs, locale }: FAQCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLocale = locale || (typeof window !== 'undefined' ? getLocaleFromPath(window.location.pathname) : 'ko');

  // 무한 순환을 위해 FAQ를 3배로 복제
  const duplicatedFaqs = [...faqs, ...faqs, ...faqs];
  const startIndex = faqs.length; // 중간 세트의 시작 인덱스

  useEffect(() => {
    if (faqs.length === 0) return;
    
    // 초기 인덱스를 중간 세트의 시작으로 설정
    setCurrentIndex(startIndex);

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          // 마지막 세트의 끝에 도달하면 중간 세트의 시작으로 점프
          if (next >= faqs.length * 2) {
            return startIndex;
          }
          return next;
        });
      }, 3000); // 3초마다 이동
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [faqs.length, startIndex, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const next = prev - 1;
      // 첫 번째 세트의 시작에 도달하면 중간 세트의 끝으로 점프
      if (next < 0) {
        return startIndex + faqs.length - 1;
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // 마지막 세트의 끝에 도달하면 중간 세트의 시작으로 점프
      if (next >= faqs.length * 2) {
        return startIndex;
      }
      return next;
    });
  };

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
        <p>FAQ가 없습니다.</p>
      </div>
    );
  }

  const currentFAQ = duplicatedFaqs[currentIndex];
  const question = currentLocale === 'en' && currentFAQ.question.en 
    ? currentFAQ.question.en 
    : currentFAQ.question.ko;
  const answer = currentLocale === 'en' && currentFAQ.answer.en 
    ? currentFAQ.answer.en 
    : currentFAQ.answer.ko;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '1rem',
              lineHeight: '1.4',
            }}
          >
            {question}
          </h3>
        </div>
        
        <div
          style={{
            flex: 1,
            color: '#666',
            lineHeight: '1.8',
            fontSize: '1rem',
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: answer }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e5e5',
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#333',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e5e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            ← 이전
          </button>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            {faqs.map((_, index) => {
              const displayIndex = ((currentIndex % faqs.length) + faqs.length) % faqs.length;
              return (
                <div
                  key={index}
                  style={{
                    width: displayIndex === index ? '12px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: displayIndex === index ? '#0070f3' : '#ddd',
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNext}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#333',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e5e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}

