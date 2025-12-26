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
  const contactCta = translations[locale]?.header?.contactCta ?? translations.ko.header.contactCta;
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
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const [notchAnimStyle, setNotchAnimStyle] = useState<React.CSSProperties>({});

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
    }, 90); // quicker hide while keeping show timing intact
    timeoutRefs.current.set(path, timeout);
  };

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
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

  useEffect(() => {
    const duration = 6 + Math.random() * 3; // 6s to 9s
    const stroke = 4 + Math.random() * 2; // 4 to 6
    const distance = 1000 + Math.random() * 300; // 1000 to 1300
    setNotchAnimStyle({
      ['--notch-drop-duration' as any]: `${duration}s`,
      ['--notch-drop-stroke' as any]: stroke,
      ['--notch-drop-distance' as any]: distance,
    });
  }, []);
  useEffect(() => {
    // randomize droplet speed/stroke per mount
    const duration = 7 + Math.random() * 4; // 7s to 11s
    const stroke = 4 + Math.random() * 2; // 4 to 6
    const distance = 2800 + Math.random() * 800; // travel distance
    setNotchAnimStyle({
      ['--notch-drop-duration' as any]: `${duration}s`,
      ['--notch-drop-stroke' as any]: stroke,
      ['--notch-drop-distance' as any]: distance,
    });
  }, []);

  const getNodeHref = (node: MenuNode): string => {
    if (node.pageType === 'links') {
      const externalUrl = node.url || node.path;
      if (!externalUrl) return '';
      
      if (externalUrl.startsWith('http://') || externalUrl.startsWith('https://')) {
        return externalUrl;
      }
      
      return `https://${externalUrl}`;
    }
    return pathToUrl(node.path, locale);
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

    if (node.pageType === 'links') {
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
    <header className={`header header--notch ${isHeaderHidden ? 'header--hidden' : ''}`}>
      <div className="notch-shell">
        <svg className="notch-bg" viewBox="0 0 1440 72" preserveAspectRatio="none" aria-hidden="true">
          <path className="notch-fill" d={notchPathD} />
          {/* Droplet animation disabled */}
        </svg>
        <nav className="notch-nav" aria-label="Top navigation">
          <Link href={`/${locale}`} className="logo notch-logo">
            <img
              src="/images/logo.svg"
              alt="AtSignal"
              className="logo-image"
            />
          </Link>

          <div className="nav-menu-items notch-nav-menu-items">
            {menuTree.map((node) => renderCascadingMenu(node, 0))}
          </div>

          <div className="nav-actions">
            <Link href={pathToUrl("/Pricing/Contact Sales", locale)} className="cta-button">
              Get Demo
            </Link>
            <Link href={pathToUrl("/Pricing/Contact Sales", locale)} className="cta-button">
              Contact Sales
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
