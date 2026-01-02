'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuNode } from '@/types/menu';
import { pathToUrl } from '@/utils/menu';
import { getLocaleFromPath } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';
import NewsletterModal from '@/components/Newsletter/NewsletterModal';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

// SVG 아이콘 상수화
const ChevronRightIcon = (
  <svg 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    style={{ width: '1rem', height: '1rem', display: 'inline-block', marginLeft: '0.5rem', verticalAlign: 'middle' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface HeaderProps {
  menuTree: MenuNode[];
}

export default function Header({ menuTree }: HeaderProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const notchPathD = `
    M 0 0
    C 11 0 22 15.5 34.13 40.5
    C 46.8 65.5 61.02 72 72 72
    L 1368 72
    C 1378.98 72 1393.2 65.5 1405.87 40.5
    C 1418.04 15.5 1429.02 0 1440 0
    Z
  `;
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const navRef = useRef<HTMLElement>(null);
  const navWrapperRef = useRef<HTMLDivElement>(null);
  const [navOverflow, setNavOverflow] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const [contactModalType, setContactModalType] = useState<'demo' | 'sales' | null>(null);

  const handleMouseEnter = (path: string) => {
    const existingTimeout = timeoutRefs.current.get(path);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(path);
    }
    setOpenDropdowns((prev) => new Set(prev).add(path));
  };

  const handleMouseLeave = (path: string) => {
    const timeout = setTimeout(() => {
      setOpenDropdowns((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
      timeoutRefs.current.delete(path);
    }, 200);
    timeoutRefs.current.set(path, timeout);
  };

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      const wrapper = navWrapperRef.current;
      if (!nav || !wrapper) return;
      setNavOverflow(nav.scrollWidth > wrapper.clientWidth);
    };

    measure();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null;

    if (resizeObserver && navWrapperRef.current) {
      resizeObserver.observe(navWrapperRef.current);
    } else {
      window.addEventListener('resize', measure);
    }

    return () => {
      if (resizeObserver && navWrapperRef.current) {
        resizeObserver.unobserve(navWrapperRef.current);
      } else {
        window.removeEventListener('resize', measure);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const isScrollingDown = currentY > lastScrollY.current;
        const pastThreshold = currentY > 120;
        setIsHeaderHidden(isScrollingDown && pastThreshold);
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getNodeHref = (node: MenuNode): string => {
    // 디버깅을 위한 로그 추가
    if (node.name === 'Docs@signal' || node.name?.includes('Docs')) {
      console.log('[Header] Docs 메뉴 디버깅:', {
        name: node.name,
        path: node.path,
        url: node.url,
        pageType: node.pageType,
        isExternal: node.isExternal
      });
    }
    
    // pageType이 'links'이거나 isExternal이 true인 경우 외부 링크로 처리
    if (node.pageType === 'links' || node.isExternal) {
      // url 필드가 있으면 우선 사용, 없으면 path 사용
      let externalUrl = node.url || node.path;
      if (!externalUrl) return '';
      
      console.log('[Header] 외부 링크 처리 (원본):', { 
        name: node.name, 
        externalUrl, 
        pageType: node.pageType, 
        isExternal: node.isExternal 
      });
      
      // path에서 앞의 슬래시 제거 (예: '/https:/docs...' -> 'https:/docs...')
      if (externalUrl.startsWith('/')) {
        externalUrl = externalUrl.substring(1);
      }
      
      // 이미 완전한 URL인 경우 그대로 반환
      if (externalUrl.startsWith('http://') || externalUrl.startsWith('https://')) {
        console.log('[Header] 완전한 URL 반환:', externalUrl);
        return externalUrl;
      }
      
      // https: 형태인 경우 https://로 수정
      if (externalUrl.startsWith('https:') && !externalUrl.startsWith('https://')) {
        externalUrl = externalUrl.replace('https:', 'https://');
        console.log('[Header] https: -> https:// 수정:', externalUrl);
        return externalUrl;
      }
      
      // http: 형태인 경우 http://로 수정
      if (externalUrl.startsWith('http:') && !externalUrl.startsWith('http://')) {
        externalUrl = externalUrl.replace('http:', 'http://');
        console.log('[Header] http: -> http:// 수정:', externalUrl);
        return externalUrl;
      }
      
      // 프로토콜이 없는 경우에만 https:// 추가
      const finalUrl = `https://${externalUrl}`;
      console.log('[Header] 프로토콜 추가된 URL:', finalUrl);
      return finalUrl;
    }
    
    // 일반 페이지의 경우 pathToUrl로 로케일 경로 생성
    const result = pathToUrl(node.path, locale);
    
    if (node.name === 'Docs@signal' || node.name?.includes('Docs')) {
      console.log('[Header] 일반 페이지 처리:', { name: node.name, path: node.path, result });
    }
    
    return result;
  };

  const renderLink = (
    node: MenuNode,
    href: string,
    className: string,
    showArrow: boolean = false,
    style?: React.CSSProperties
  ) => {
    const linkContent = (
      <>
        {node.name}
        {showArrow && ChevronRightIcon}
      </>
    );

    if (node.pageType === 'links' || node.isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          style={style}
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link href={href} className={className} style={style}>
        {linkContent}
      </Link>
    );
  };

  const renderCascadingMenu = (node: MenuNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isOpen = openDropdowns.has(node.path);
    const href = getNodeHref(node);

    if (hasChildren) {
      if (level === 0) {
        return (
          <div key={node.path} className="nav-item">
            <button
              onMouseEnter={() => handleMouseEnter(node.path)}
              onMouseLeave={() => handleMouseLeave(node.path)}
              className="nav-button"
            >
              {node.name}
              {ChevronDownIcon}
            </button>
            {isOpen && (
              <div
                className="dropdown"
                onMouseEnter={() => handleMouseEnter(node.path)}
                onMouseLeave={() => handleMouseLeave(node.path)}
              >
                {node.children?.map((child) => renderCascadingMenu(child, level + 1))}
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={node.path} className="dropdown-item-wrapper">
          <div
            className="dropdown-item"
            onMouseEnter={() => handleMouseEnter(node.path)}
            onMouseLeave={() => handleMouseLeave(node.path)}
          >
            <span className="dropdown-link" style={{ display: 'block', width: '100%', cursor: 'default', pointerEvents: 'none' }}>
              {node.name}
              {ChevronRightIcon}
            </span>
          </div>
          {isOpen && node.children && node.children.length > 0 && (
            <div
              className="cascading-dropdown cascading-dropdown-nested"
              onMouseEnter={() => handleMouseEnter(node.path)}
              onMouseLeave={() => handleMouseLeave(node.path)}
            >
              {node.children.map((child) => renderCascadingMenu(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (level === 0) {
      return (
        <div key={node.path}>{renderLink(node, href, 'nav-link')}</div>
      );
    }

    return (
      <div key={node.path} className="dropdown-item-wrapper">
        <div className="dropdown-item">
          {renderLink(node, href, 'dropdown-link', false, { display: 'block', width: '100%' })}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className={`header header--notch ${isHeaderHidden ? 'header--hidden' : ''}`}>
        <div className="notch-shell">
          <svg className="notch-bg" viewBox="0 0 1440 72" preserveAspectRatio="none" aria-hidden="true">
            <path className="notch-fill" d={notchPathD} />
            {/* Droplet animation disabled */}
          </svg>
          <div className="header-container notch-nav" aria-label="Top navigation">
            <div className="header-content">
              <Link href={`/${locale}`} className="logo notch-logo">
                <img
                  src="/images/logo.svg"
                  alt="AtSignal"
                  className="logo-image"
                />
              </Link>

              <div className="nav-wrapper" ref={navWrapperRef}>
                <nav
                  className={`nav ${navOverflow ? 'nav-overflow' : ''}`}
                  ref={navRef}
                >
                  {menuTree.map((node) => renderCascadingMenu(node, 0))}
                </nav>
              </div>

              <div className="nav-actions">
                <button
                  type="button"
                  className="cta-button"
                  onClick={() => setContactModalType('demo')}
                >
                  Get Demo
                </button>
                <button
                  type="button"
                  className="cta-button"
                  onClick={() => setContactModalType('sales')}
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <NewsletterModal
        isOpen={contactModalType !== null}
        onClose={() => setContactModalType(null)}
        locale={locale}
        variant={contactModalType === 'demo' ? 'demo' : contactModalType === 'sales' ? 'sales' : 'newsletter'}
      />
    </>
  );
}
