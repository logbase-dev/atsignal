'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { pathToUrl } from '@/utils/menu';
import { getLocaleFromPath, defaultLocale } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';
import { useMemo } from 'react';

const translations = {
  ko: koMessages,
  en: enMessages,
} as const;

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
      return {};
    }

    // 루트 메뉴들 (parentId가 없거나 '0'인 메뉴들) - order로 정렬
    const rootMenus = menus
      .filter((menu: any) => !menu.parentId || menu.parentId === '0' || menu.parentId === 0)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

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
      
      if (children.length > 0) {
        result[key] = children;
      }
    });

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
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo and Description */}
          <div className="footer-brand">
            <Link href={`/${locale}`} className="footer-logo">
              <img
                src="/images/logo.svg"
                alt="AtSignal"
                className="footer-logo-image"
              />
            </Link>
            <p className="footer-description">
              {footerDescription}
            </p>
          </div>

          {/* Links Grid */}
          <div className="footer-links">
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
                <div key={key} className="footer-column">
                  <h3 className="footer-column-title">{title}</h3>
              <ul className="footer-link-list">
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
                              className="footer-link"
                            >
                      {link.name}
                            </a>
                          ) : (
                            <Link href={href} className="footer-link">
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
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>© {currentYear} Nethru. All rights reserved.</p>
          </div>
          <div className="footer-legal">
            <Link href={pathToUrl("/Product/Security&Privacy", locale)} className="footer-legal-link">
              Privacy Policy
            </Link>
            <span className="footer-separator">·</span>
            <Link href={pathToUrl("/Pricing/Contact Sales", locale)} className="footer-legal-link">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}



