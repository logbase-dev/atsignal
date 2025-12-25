'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuNode } from '@/types/menu';
import { pathToUrl } from '@/utils/menu';
import { getLocaleFromPath, defaultLocale } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

interface HeaderProps {
  menuTree: MenuNode[];
}

export default function Header({ menuTree }: HeaderProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const contactCta = translations[locale]?.header?.contactCta ?? translations.ko.header.contactCta;
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleMouseEnter = (path: string) => {
    const existingTimeout = timeoutRefs.current.get(path);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(path);
    }
    
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      next.add(path);
      return next;
    });
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

  const getNodeHref = (node: MenuNode): string => {
    if (node.isExternal && node.url) {
      return node.url;
    }
    return pathToUrl(node.path, locale);
  };

  // 공통 링크 렌더링 함수
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
        {showArrow && (
          <svg 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ width: '1rem', height: '1rem', display: 'inline-block', marginLeft: '0.5rem', verticalAlign: 'middle' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </>
    );

    if (node.isExternal) {
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

  // Cascading Dropdown을 위한 재귀 렌더링 함수
  const renderCascadingMenu = (node: MenuNode, level: number = 0): React.ReactNode => {
      const hasChildren = node.children && node.children.length > 0;
    const isOpen = openDropdowns.has(node.path);
    const isExternal = node.isExternal || false;
    const href = getNodeHref(node);

      if (hasChildren) {
      // level 0 (depth1)은 nav-item으로 렌더링
      if (level === 0) {
        return (
          <div key={node.path} className="nav-item">
            <button
              onMouseEnter={() => handleMouseEnter(node.path)}
              onMouseLeave={() => handleMouseLeave(node.path)}
              className="nav-button"
            >
              {node.name}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
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

      // level 1 이상은 dropdown-item으로 렌더링 (하위 메뉴가 있으면 링크 없음)
      return (
        <div key={node.path} className="dropdown-item-wrapper">
          <div
            className="dropdown-item"
            onMouseEnter={() => handleMouseEnter(node.path)}
            onMouseLeave={() => handleMouseLeave(node.path)}
          >
            {/* 하위 메뉴가 있으면 링크 없이 텍스트만 표시 */}
            <span className="dropdown-link" style={{ display: 'block', width: '100%', cursor: 'default', pointerEvents: 'none' }}>
          {node.name}
              <svg 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ width: '1rem', height: '1rem', display: 'inline-block', marginLeft: '0.5rem', verticalAlign: 'middle' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
          {isOpen && node.children && node.children.length > 0 && (
            <div
              className="dropdown cascading-dropdown cascading-dropdown-nested"
              onMouseEnter={() => handleMouseEnter(node.path)}
              onMouseLeave={() => handleMouseLeave(node.path)}
            >
              {node.children.map((child) => renderCascadingMenu(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // children이 없는 경우 (가장 깊은 depth) - 링크 표시
    if (level === 0) {
      return (
        <div key={node.path}>
          {renderLink(node, href, 'nav-link')}
        </div>
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
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <Link href={`/${locale}`} className="logo">
            <img
              src="/images/logo.svg"
              alt="AtSignal"
              className="logo-image"
            />
          </Link>
          
          <nav className="nav">
            {menuTree.map((node) => renderCascadingMenu(node, 0))}
          </nav>

          <div>
            <Link
              href={pathToUrl("/Pricing/Contact Sales", locale)}
              className="cta-button"
            >
              {contactCta}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
