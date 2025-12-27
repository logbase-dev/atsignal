
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getLocaleFromPath, defaultLocale } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';
import { useMemo } from 'react';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

// 경로를 URL-safe한 형태로 변환 (Next.js Link에서 사용)
function pathToUrl(path: string, locale: string): string {
  if (!path) return `/${locale}`;
  
  // path가 이미 locale을 포함하고 있는지 확인
  const parts = path.split('/').filter(Boolean);
  const hasLocalePrefix = parts.length > 0 && (parts[0] === 'ko' || parts[0] === 'en');
  
  if (hasLocalePrefix) {
    return '/' + parts.map((part) => encodeURIComponent(part)).join('/');
  }
  
  // locale을 앞에 추가
  return `/${locale}/${path.split('/').filter(Boolean).map((part) => encodeURIComponent(part)).join('/')}`;
}

interface FooterProps {
  menus?: any[]; // Firestore에서 가져온 메뉴 배열 (전체 메뉴 포함)
}

export default function Footer({ menus = [] }: FooterProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const translation = translations[locale] ?? translations[defaultLocale];
  const footerDescription = translation.footer?.description ?? translations.ko.footer.description;
  const currentYear = new Date().getFullYear();

  // 메뉴를 parentId 기반으로 그룹화
  const footerLinks = useMemo(() => {
    if (!menus || menus.length === 0) {
      console.log('[Footer] 메뉴가 없습니다.');
      return {};
    }

    console.log('[Footer] 전체 메뉴:', menus);
    
    // 루트 메뉴들 (parentId가 없거나 '0'인 메뉴들) - order로 정렬
    const rootMenus = menus
      .filter((menu: any) => !menu.parentId || menu.parentId === '0' || menu.parentId === 0)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    
    console.log('[Footer] 루트 메뉴:', rootMenus);

    // 각 루트 메뉴의 직접 자식들만 찾아서 구조화 (depth 1만)
    const result: Record<string, Array<{ name: string; path: string; pageType?: string; url?: string }>> = {};

    rootMenus.forEach((parentMenu: any) => {
      const children = menus
        .filter((menu: any) => menu.parentId === parentMenu.id)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((menu: any) => {
          // depth1 메뉴의 실제 링크 경로 찾기
          let actualPath = menu.path || '';
          let pageType = menu.pageType;
          let url = menu.url || '';
          
          // depth1의 자식들(depth2) 찾기
          const depth2Children = menus
            .filter((m: any) => m.parentId === menu.id)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          
          if (depth2Children.length > 0) {
            // depth2의 첫 번째 자식(depth3) 찾기
            const firstDepth2 = depth2Children[0];
            const depth3Children = menus
              .filter((m: any) => m.parentId === firstDepth2.id)
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            
            if (depth3Children.length > 0) {
              // depth3가 있으면
              const firstDepth3 = depth3Children[0];
              const depth4Children = menus
                .filter((m: any) => m.parentId === firstDepth3.id)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
              
              if (depth4Children.length > 0) {
                // depth3가 자식(depth4)이 있으면, depth3의 첫 번째 자식(depth4)의 path 사용
                const firstDepth4 = depth4Children[0];
                if (firstDepth4.path) {
                  actualPath = firstDepth4.path;
                  pageType = firstDepth4.pageType;
                  url = firstDepth4.url || '';
                }
              } else {
                // depth3가 자식이 없으면, depth3의 path 사용
                if (firstDepth3.path) {
                  actualPath = firstDepth3.path;
                  pageType = firstDepth3.pageType;
                  url = firstDepth3.url || '';
                }
              }
            } else {
              // depth3가 없으면, depth2의 path 사용
              if (firstDepth2.path) {
                actualPath = firstDepth2.path;
                pageType = firstDepth2.pageType;
                url = firstDepth2.url || '';
              }
            }
          }
          
          return {
            name: menu.labels?.[locale] || menu.labels?.ko || menu.label || '',
            path: actualPath,
            pageType,
            url,
          };
        });

      // 메뉴 이름을 소문자로 변환하여 키로 사용 (예: "Product" -> "product")
      const parentLabel = parentMenu.labels?.[locale] || parentMenu.labels?.ko || parentMenu.label || '';
      const key = parentLabel.toLowerCase().replace(/\s+/g, '');
      
      console.log(`[Footer] 루트 메뉴 "${parentLabel}" (key: ${key})의 자식 개수:`, children.length);
      
      // 자식이 없어도 루트 메뉴 자체가 path를 가지고 있으면 표시
      // 또는 자식이 있으면 표시
      if (children.length > 0 || parentMenu.path) {
        // 자식이 없고 루트 메뉴 자체가 링크인 경우, 루트 메뉴를 자식으로 추가
        if (children.length === 0 && parentMenu.path) {
          result[key] = [{
            name: parentLabel,
            path: parentMenu.path,
            pageType: parentMenu.pageType,
            url: parentMenu.url || '',
          }];
        } else {
          result[key] = children;
        }
      }
    });

    console.log('[Footer] 최종 결과:', result);
    return result;
  }, [menus, locale]);

  // 링크 href 생성 함수
  const getLinkHref = (link: { path: string; pageType?: string; url?: string }): string => {
    if (link.pageType === 'links') {
      // pageType이 'links'이면 path에 외부 URL이 저장되어 있음
      // url이 있으면 url 사용, 없으면 path 사용
      return link.url || link.path;
    }
    return pathToUrl(link.path, locale);
  };

  return (
    <footer style={footerStyle}>
      <div style={footerContainerStyle}>
        <div style={footerContentStyle}>
          {/* 동적 메뉴 링크 */}
          {Object.entries(footerLinks).map(([key, links]) => {
            if (!links || links.length === 0) return null;
            
            // 루트 메뉴에서 원본 이름 찾기
            const parentMenu = menus.find((menu: any) => {
              const parentLabel = menu.labels?.[locale] || menu.labels?.ko || menu.label || '';
              const menuKey = parentLabel.toLowerCase().replace(/\s+/g, '');
              return (!menu.parentId || menu.parentId === '0' || menu.parentId === 0) && menuKey === key;
            });
            
            const title = parentMenu 
              ? (parentMenu.labels?.[locale] || parentMenu.labels?.ko || parentMenu.label || '')
              : key.charAt(0).toUpperCase() + key.slice(1);
            
            return (
              <div key={key} style={footerSectionStyle}>
                <h3 style={footerTitleStyle}>{title}</h3>
                <ul style={footerListStyle}>
                  {links.map((link, index) => {
                    const href = getLinkHref(link);
                    const isExternal = link.pageType === 'links';
                    
                    return (
                      <li key={`${link.path}-${index}`}>
                        {isExternal ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={footerLinkStyle}
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link href={href} style={footerLinkStyle}>
                            {link.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <div style={footerBottomStyle}>
          <p style={footerCopyrightStyle}>© {currentYear} AtSignal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #e5e7eb',
  marginTop: '4rem',
};

const footerContainerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '3rem 1.5rem 1.5rem',
};

const footerContentStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', // 200px -> 150px로 변경
  gap: '1rem', // 2rem -> 1rem으로 변경
  marginBottom: '2rem',
};

const footerSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const footerTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '1rem',
  margin: 0,
};

const footerListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const footerLinkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

const footerBottomStyle: React.CSSProperties = {
  paddingTop: '2rem',
  // borderTop: '1px solid #e5e7eb',
};

const footerCopyrightStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: 0,
};
