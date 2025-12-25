'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SearchOverlay, type SearchIndexItem } from './SearchOverlay';

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  children?: NavItem[];
}

interface HeaderProps {
  navItems: NavItem[];
  locale: 'ko' | 'en';
  searchIndex: SearchIndexItem[];
}

export default function Header({ navItems, locale, searchIndex }: HeaderProps) {
  const pathname = usePathname();
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header style={headerStyle}>
      {/* 상단 헤더: 로고 + 검색 */}
      <div style={topHeaderStyle}>
        <div style={topHeaderContainerStyle}>
          <div style={logoSectionStyle}>
            <Link href={`/${locale}`} style={logoLinkStyle}>
              <div style={logoCircleStyle}>
                <span style={logoIconStyle}>@</span>
              </div>
              <span style={logoTextStyle}>atsignal</span>
            </Link>
            <span style={docsLabelStyle}>DOCUMENTATION</span>
          </div>
          <div style={searchSectionStyle}>
            <div 
              style={searchWrapperStyle}
              onClick={() => setIsSearchOpen(true)}
            >
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
                type="text"
                placeholder="Search"
                onFocus={() => setIsSearchOpen(true)}
                style={searchInputStyle}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 네비게이션 바 */}
      <div style={navBarStyle}>
        <div style={navBarContainerStyle}>
          <nav style={navStyle}>
            {navItems.map((item) => (
              <div
                key={item.href}
                style={navItemWrapperStyle}
                onMouseEnter={() => item.children && setHoveredMenu(item.href)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                {/* 하위 메뉴가 있으면 링크 없이 버튼으로 표시, 없으면 링크 표시 */}
                {item.children && item.children.length > 0 ? (
                  <button
                    className="nav-item-link"
                    style={{
                      ...navItemStyle,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                    <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }}>▼</span>
                  </button>
                ) : item.isExternal ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-item-link"
                    style={{
                      ...navItemStyle,
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="nav-item-link"
                    style={{
                      ...navItemStyle,
                      ...(pathname?.startsWith(item.href) ? navItemActiveStyle : {}),
                    }}
                  >
                    {item.label}
                  </Link>
                )}
                {item.children && item.children.length > 0 && hoveredMenu === item.href && (
                  <div 
                    style={dropdownStyle}
                    onMouseEnter={() => setHoveredMenu(item.href)}
                    onMouseLeave={() => setHoveredMenu(null)}
                  >
                    {item.children.map((child) => 
                      child.isExternal ? (
                        <a
                          key={child.href}
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={dropdownItemStyle}
                        >
                          {child.label}
                        </a>
                      ) : (
                        <Link
                          key={child.href}
                          href={child.href}
                          style={{
                            ...dropdownItemStyle,
                            ...(pathname?.startsWith(child.href) ? dropdownItemActiveStyle : {}),
                          }}
                        >
                          {child.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* 검색 오버레이 */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchIndex={searchIndex}
        locale={locale}
      />
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const topHeaderStyle: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
};

const topHeaderContainerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px',
};

const logoSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const logoLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const logoCircleStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#2563eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoIconStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '1.125rem',
  fontWeight: 700,
};

const logoTextStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: '#2563eb',
};

const docsLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  marginLeft: '0.5rem',
};

const searchSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const searchWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '300px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
};

const searchIconStyle: React.CSSProperties = {
  color: '#9ca3af',
  marginRight: '0.5rem',
  flexShrink: 0,
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontSize: '0.875rem',
  color: '#111827',
  padding: 0,
};

const searchShortcutsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem',
  marginLeft: '0.5rem',
};

const shortcutKeyStyle: React.CSSProperties = {
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

const navBarStyle: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const navBarContainerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 1.5rem',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0',
  position: 'relative',
};

const navItemWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

const navItemStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  textDecoration: 'none',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  borderBottom: '2px solid transparent',
};

const navItemActiveStyle: React.CSSProperties = {
  color: '#2563eb',
  borderBottomColor: '#2563eb',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '0',
  paddingTop: '0.25rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  minWidth: '200px',
  padding: '0.5rem 0',
  zIndex: 1000,
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  color: '#6b7280',
  textDecoration: 'none',
  transition: 'all 0.2s',
};

const dropdownItemActiveStyle: React.CSSProperties = {
  color: '#111827',
  backgroundColor: '#f3f4f6',
};


