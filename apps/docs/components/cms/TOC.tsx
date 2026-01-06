'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TOCProps {
  content: string;
}

export function TOC({ content }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<TOCItem[]>([]);

  // DOM에서 실제 헤딩 요소 추출 (rehype-slug가 생성한 ID 사용)
  useEffect(() => {
    // ReactMarkdown 렌더링 완료를 기다림
    const timer = setTimeout(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(
        (el) => el.id // ID가 있는 헤딩만 (rehype-slug가 생성한 것)
      ) as HTMLElement[];

      const extracted: TOCItem[] = headingElements.map((el) => {
        const level = parseInt(el.tagName.charAt(1), 10);
        const text = el.textContent?.trim() || '';
        const id = el.id;

        return { id, text, level };
      });

      setHeadings(extracted);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  // 스크롤 스파이
  useEffect(() => {
    if (headings.length === 0) return;

    const observerOptions = {
      rootMargin: '-20% 0% -35% 0%',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // 헤더 높이 고려
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="toc-container">
      <div className="toc-header">
        <span className="toc-title">On this page</span>
      </div>
      {headings.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '0.5rem 0' }}>
          No headings
        </div>
      ) : (
        <ul className="toc-list">
          {headings.map((heading, index) => (
            <li
              key={`${heading.id}-${index}`}
              className={`toc-item toc-level-${heading.level} ${activeId === heading.id ? 'toc-active' : ''}`}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(heading.id, e)}
                className="toc-link"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

