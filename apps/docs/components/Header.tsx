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

// 재귀적으로 메뉴 아이템을 렌더링하는 컴포넌트
function NavMenuItem({ item, pathname, level = 0 }: { item: NavItem; pathname: string | null; level?: number }) {
  const [hoveredSubMenu, setHoveredSubMenu] = useState<string | null>(null);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="dropdown-item-wrapper"
      style={{
        ...dropdownItemWrapperStyle,
        position: hasChildren ? 'relative' : 'static',
      }}
      onMouseEnter={() => hasChildren && setHoveredSubMenu(item.href)}
      onMouseLeave={(e) => {
        // nested dropdown으로 마우스가 이동하면 hover 상태 유지
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget) {
          // 현재 wrapper 내부의 nested dropdown으로 이동 중이면 hover 상태 유지
          const currentWrapper = e.currentTarget as HTMLElement;
          const nestedDropdown = currentWrapper.querySelector('.nested-dropdown');
          if (nestedDropdown && (nestedDropdown.contains(relatedTarget) || nestedDropdown === relatedTarget)) {
            return; // nested dropdown으로 이동 중이면 hover 상태 유지
          }
          // 같은 레벨의 다른 wrapper로 이동하는 경우는 제외
          if (relatedTarget.closest('.dropdown-item-wrapper') && !currentWrapper.contains(relatedTarget)) {
            // 다른 메뉴 아이템으로 이동하는 경우는 숨기기
            setHoveredSubMenu(null);
            return;
          }
        }
        // 완전히 아웃되었을 때는 즉시 숨기기
        setHoveredSubMenu(null);
      }}
    >
      {hasChildren ? (
        <>
          <div 
            className={`dropdown-item ${pathname?.startsWith(item.href) ? 'active' : ''}`}
            style={{
              ...dropdownItemStyle,
              ...(pathname?.startsWith(item.href) ? { backgroundColor: '#eff6ff' } : {}),
            }}
          >
            {item.isExternal ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...dropdownItemLinkStyle,
                  ...(pathname?.startsWith(item.href) ? { color: '#2563eb' } : {}),
                }}
              >
                {item.label}
              </a>
            ) : (
              <Link
                href={item.href}
                style={{
                  ...dropdownItemLinkStyle,
                  ...(pathname?.startsWith(item.href) ? { color: '#2563eb' } : {}),
                }}
              >
                {item.label}
              </Link>
            )}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={chevronIconStyle}
            >
              <path
                d="M4.5 3L7.5 6L4.5 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {hoveredSubMenu === item.href && (
            <div
              className="nested-dropdown"
              style={{
                ...nestedDropdownStyle,
                top: 0,
              }}
              onMouseEnter={() => setHoveredSubMenu(item.href)}
              onMouseLeave={(e) => {
                // 부모 wrapper로 마우스가 이동하면 hover 상태 유지
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget) {
                  // 부모 wrapper로 이동 중이면 hover 상태 유지
                  const currentDropdown = e.currentTarget as HTMLElement;
                  const parentWrapper = currentDropdown.closest('.dropdown-item-wrapper') as HTMLElement;
                  if (parentWrapper && (parentWrapper.contains(relatedTarget) || parentWrapper === relatedTarget)) {
                    return; // 부모 wrapper로 이동 중이면 hover 상태 유지
                  }
                  // 같은 레벨의 다른 nested dropdown으로 이동하는 경우는 제외
                  if (relatedTarget.closest('.nested-dropdown') && !currentDropdown.contains(relatedTarget)) {
                    // 다른 nested dropdown으로 이동하는 경우는 숨기기
                    setHoveredSubMenu(null);
                    return;
                  }
                }
                // 완전히 아웃되었을 때는 즉시 숨기기
                setHoveredSubMenu(null);
              }}
            >
              {item.children!.map((child) => (
                <NavMenuItem
                  key={child.href}
                  item={child}
                  pathname={pathname}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div 
          className={`dropdown-item ${pathname?.startsWith(item.href) ? 'active' : ''}`}
          style={{
            ...dropdownItemStyle,
            ...(pathname?.startsWith(item.href) ? { backgroundColor: '#eff6ff' } : {}),
          }}
        >
          {item.isExternal ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...dropdownItemLinkStyle,
                ...(pathname?.startsWith(item.href) ? { color: '#2563eb' } : {}),
              }}
            >
              {item.label}
            </a>
          ) : (
            <Link
              href={item.href}
              style={{
                ...dropdownItemLinkStyle,
                ...(pathname?.startsWith(item.href) ? { color: '#2563eb' } : {}),
              }}
            >
              {item.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
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
            {navItems.map((item) => {
              // 현재 경로가 해당 메뉴의 하위 메뉴인지 확인
              const isCurrentPageInSubMenu = item.children && item.children.length > 0 && 
                pathname && 
                pathname.startsWith(item.href) && 
                pathname !== item.href;
              
              // 파란 배경과 하단 파란줄을 위한 클래스 (현재 페이지가 하위 메뉴에 있거나 마우스 오버 시)
              const hasDropdownOpen = hoveredMenu === item.href || isCurrentPageInSubMenu;
              
              // 드롭다운 표시 여부 (마우스 오버했을 때만)
              const shouldShowDropdown = hoveredMenu === item.href;
              
              return (
              <div
                key={item.href}
                style={navItemWrapperStyle}
                onMouseEnter={() => item.children && setHoveredMenu(item.href)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                {/* 하위 메뉴가 있으면 링크 없이 버튼으로 표시, 없으면 링크 표시 */}
                {item.children && item.children.length > 0 ? (
                  <button
                    className={`nav-item-link ${hasDropdownOpen ? 'has-dropdown-open' : ''}`}
                    style={{
                      ...navItemStyle,
                      background: 'none',
                      border: 'none',
                      borderBottom: '2px solid transparent', /* 하단 파란줄을 위해 border-bottom 유지 */
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ marginLeft: '0.25rem', flexShrink: 0 }}
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
                {item.children && item.children.length > 0 && shouldShowDropdown && (
                  <div 
                    style={dropdownStyle}
                    onMouseEnter={() => setHoveredMenu(item.href)}
                    onMouseLeave={() => setHoveredMenu(null)}
                  >
                    {item.children.map((child) => (
                      <NavMenuItem
                        key={child.href}
                        item={child}
                        pathname={pathname}
                        level={1}
                      />
                    ))}
                  </div>
                )}
              </div>
              );
            })}
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
  backgroundColor: '#ffffff',
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
  padding: '0.5rem 0 0.5rem 3px', /* 왼쪽에 파란줄 공간 확보 */
  zIndex: 1000,
  overflow: 'visible', /* 왼쪽 파란줄이 보이도록 */
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.5rem 1rem 0.5rem 0.75rem', /* 왼쪽 패딩을 줄여서 chevron 아이콘 공간 확보 */
  fontSize: '0.875rem',
  color: '#6b7280',
  textDecoration: 'none',
  transition: 'all 0.2s',
  position: 'relative',
  backgroundColor: '#ffffff',
  /* width: 100% 제거 - flex로 자동 조정 */
};

const dropdownItemActiveStyle: React.CSSProperties = {
  color: '#2563eb', /* 파란색 텍스트 */
  backgroundColor: '#eff6ff', /* 연한 파란 배경 */
};

const dropdownItemWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

const dropdownItemLinkStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  color: '#6b7280',
  textDecoration: 'none',
  transition: 'all 0.2s',
  flex: 1,
  minWidth: 0, /* flex 아이템이 부모를 넘지 않도록 */
  overflow: 'hidden', /* 텍스트가 길 경우 처리 */
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const chevronIconStyle: React.CSSProperties = {
  color: '#9ca3af',
  marginLeft: '0.5rem',
  flexShrink: 0,
};

const nestedDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  marginTop: '0',
  paddingTop: '0.25rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  minWidth: '200px',
  padding: '0.5rem 0 0.5rem 3px', /* 왼쪽에 파란줄 공간 확보 */
  zIndex: 1001,
  overflow: 'visible', /* 왼쪽 파란줄이 보이도록 */
  left: '100%', /* 부모 dropdown과 바로 붙여서 간격 최소화 */
  marginLeft: '-1px', /* 부모 dropdown과 약간 겹치게 하여 마우스 이동 시 hover 유지 */
};


