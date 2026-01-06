'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// getSearchIndex에서 가져온 타입
export interface SearchIndexItem {
  id: string;
  slug: string;
  titleKo: string;
  titleEn?: string;
  contentTextKo: string;
  contentTextEn?: string;
  locale: 'ko' | 'en';
}

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  locale: 'ko' | 'en';
  priority?: number;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchIndex: SearchIndexItem[];
  locale: 'ko' | 'en';
}

export function SearchOverlay({ isOpen, onClose, searchIndex, locale }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 검색 로직
  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const matched: SearchResult[] = [];

    searchIndex.forEach((item) => {
      // 현재 locale에 맞는 데이터 사용
      const title = locale === 'en' && item.titleEn ? item.titleEn : item.titleKo;
      const contentText = locale === 'en' && item.contentTextEn 
        ? item.contentTextEn 
        : item.contentTextKo;

      const titleMatch = title.toLowerCase().includes(normalizedQuery);
      const contentMatch = contentText.toLowerCase().includes(normalizedQuery);

      if (titleMatch || contentMatch) {
        // 제목 매치가 더 높은 우선순위
        const priority = titleMatch ? 1 : 2;
        
        // 검색어 주변 텍스트 추출 (excerpt)
        let excerpt = '';
        if (contentMatch) {
          const index = contentText.toLowerCase().indexOf(normalizedQuery);
          const start = Math.max(0, index - 50);
          const end = Math.min(contentText.length, index + normalizedQuery.length + 50);
          excerpt = contentText.substring(start, end);
          if (start > 0) excerpt = '...' + excerpt;
          if (end < contentText.length) excerpt = excerpt + '...';
        }

        matched.push({
          id: item.id,
          slug: item.slug,
          title,
          excerpt: excerpt || contentText.substring(0, 100) + '...',
          locale: item.locale,
          priority,
        });
      }
    });

    // 우선순위로 정렬 (제목 매치가 먼저)
    return matched.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [query, searchIndex, locale]);

  // 오버레이가 열릴 때 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    router.push(`/${locale}/${result.slug}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        style={overlayBackdropStyle}
        onClick={onClose}
      />
      
      {/* 검색 패널 */}
      <div style={overlayPanelStyle}>
        {/* 검색 입력 */}
        <div style={searchInputWrapperStyle}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={searchIconStyle}
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M10.5 10.5L13.5 13.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Search 'instrumentation', 'Export API'`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={searchInputStyle}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={clearButtonStyle}
              aria-label="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* 검색 결과 */}
        <div ref={resultsRef} style={resultsContainerStyle}>
          {!query ? (
            <div style={emptyStateStyle}>
              <p style={emptyStateTextStyle}>No recent searches</p>
            </div>
          ) : results.length === 0 ? (
            <div style={emptyStateStyle}>
              <p style={emptyStateTextStyle}>No results found</p>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                style={{
                  ...resultItemStyle,
                  ...(index === selectedIndex ? resultItemActiveStyle : {}),
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={resultIconStyle}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 3h10v10H3V3z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M3 3l10 10M13 3L3 13"
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  </svg>
                </div>
                <div style={resultContentStyle}>
                  <div style={resultTitleStyle}>{result.title}</div>
                  {result.excerpt && (
                    <div style={resultExcerptStyle}>{result.excerpt}</div>
                  )}
                </div>
                {index === selectedIndex && (
                  <div style={resultEnterIconStyle}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 12l4-4-4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 하단 힌트 */}
        {query && results.length > 0 && (
          <div style={footerStyle}>
            <div style={footerHintsStyle}>
              <span style={hintTextStyle}>
                <span style={hintKeyStyle}>←</span> to select
              </span>
              <span style={hintTextStyle}>
                <span style={hintKeyStyle}>↓</span>
                <span style={hintKeyStyle}>↑</span> to navigate
              </span>
              <span style={hintTextStyle}>
                <span style={hintKeyStyle}>esc</span> to close
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// 스타일 정의
const overlayBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 999,
};

const overlayPanelStyle: React.CSSProperties = {
  position: 'fixed',
  top: '128px', // 헤더 높이 (64px) + 네비게이션 바 (64px)
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90%',
  maxWidth: '640px',
  backgroundColor: '#ffffff',
  borderRadius: '0.75rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  zIndex: 1000,
  maxHeight: 'calc(100vh - 200px)',
  display: 'flex',
  flexDirection: 'column',
};

const searchInputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '1rem',
  borderBottom: '1px solid #e5e7eb',
  gap: '0.75rem',
};

const searchIconStyle: React.CSSProperties = {
  color: '#9ca3af',
  flexShrink: 0,
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  fontSize: '1rem',
  color: '#111827',
  backgroundColor: 'transparent',
};

const clearButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  flexShrink: 0,
};

const resultsContainerStyle: React.CSSProperties = {
  maxHeight: '400px',
  overflowY: 'auto',
  padding: '0.5rem 0',
};

const emptyStateStyle: React.CSSProperties = {
  padding: '3rem 1.5rem',
  textAlign: 'center',
};

const emptyStateTextStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '0.875rem',
};

const resultItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  padding: '0.75rem 1rem',
  cursor: 'pointer',
  gap: '0.75rem',
  transition: 'background-color 0.15s',
};

const resultItemActiveStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
};

const resultIconStyle: React.CSSProperties = {
  color: '#6b7280',
  flexShrink: 0,
  marginTop: '0.125rem',
};

const resultContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const resultTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#111827',
  marginBottom: '0.25rem',
};

const resultExcerptStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#6b7280',
  lineHeight: 1.5,
};

const resultEnterIconStyle: React.CSSProperties = {
  color: '#2563eb',
  flexShrink: 0,
  marginTop: '0.125rem',
};

const footerStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const footerHintsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
};

const hintTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const hintKeyStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 0.25rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#6b7280',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '0.25rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

