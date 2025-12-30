'use client';

import { useState } from 'react';
import type { FAQ } from '@/lib/admin/types';
import { getLocaleFromPath } from '@/lib/i18n/getLocale';

interface FAQAccordionProps {
  faqs: FAQ[];
  locale?: string;
}

export function FAQAccordion({ faqs, locale }: FAQAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const currentLocale = locale || (typeof window !== 'undefined' ? getLocaleFromPath(window.location.pathname) : 'ko');

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>FAQ가 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {faqs.map((faq) => {
        if (!faq.id) return null;
        
        const isExpanded = expandedIds.has(faq.id);
        const question = currentLocale === 'en' && faq.question.en 
          ? faq.question.en 
          : faq.question.ko;
        const answer = currentLocale === 'en' && faq.answer.en 
          ? faq.answer.en 
          : faq.answer.ko;

        return (
          <div
            key={faq.id}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              marginBottom: '1rem',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: isExpanded ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => toggleExpanded(faq.id!)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f9f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <h4
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  margin: 0,
                  flex: 1,
                  paddingRight: '1rem',
                  lineHeight: '1.5',
                }}
              >
                {question}
              </h4>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L1 4L2 3L6 7L10 3L11 4L6 9Z"
                    fill="#666"
                  />
                </svg>
              </div>
            </button>

            <div
              style={{
                maxHeight: isExpanded ? '1000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, padding 0.3s ease',
                padding: isExpanded ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem',
              }}
            >
              <div
                style={{
                  color: '#666',
                  lineHeight: '1.8',
                  fontSize: '1rem',
                  paddingTop: isExpanded ? '1rem' : '0',
                  borderTop: isExpanded ? '1px solid #e5e5e5' : 'none',
                }}
                dangerouslySetInnerHTML={{ __html: answer }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

