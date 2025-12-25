'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function withAdminPrefix(href: string): string {
  if (href === '/') return '/admin';
  if (href.startsWith('/admin')) return href;
  return `/admin${href}`;
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        <li className="nav-item">
          <Link href="/admin" className={`nav-link ${pathname === '/admin' ? '' : 'collapsed'}`}>
            <i className="bi bi-grid"></i>
            <span>Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <a
            className={`nav-link ${pathname?.startsWith('/admin/menus') || pathname?.startsWith('/admin/pages') || pathname?.startsWith('/admin/menus/docs') ? '' : 'collapsed'}`}
            data-bs-target="#menus-nav"
            data-bs-toggle="collapse"
            href="#"
          >
            <i className="bi bi-menu-button-wide"></i>
            <span>메뉴</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </a>
          <ul
            id="menus-nav"
            className={`nav-content collapse ${pathname?.startsWith('/admin/menus') || pathname?.startsWith('/admin/pages') || pathname?.startsWith('/admin/menus/docs') ? 'show' : ''}`}
            data-bs-parent="#sidebar-nav"
          >
            <li>
              <Link href={withAdminPrefix('/menus/web')} className={pathname === '/admin/menus/web' || pathname === '/admin/pages/web' ? 'active' : ''}>
                <i className="bi bi-circle"></i>
                <span>Web 사이트</span>
              </Link>
            </li>
            <li>
              <Link href={withAdminPrefix('/menus/docs')} className={pathname === '/admin/menus/docs' || pathname === '/admin/pages/docs' ? 'active' : ''}>
                <i className="bi bi-circle"></i>
                <span>Docs 사이트</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link href="/admin/blog" className={`nav-link ${pathname?.startsWith('/admin/blog') ? '' : 'collapsed'}`}>
            <i className="bi bi-journal"></i>
            <span>Blog</span>
            </Link>
        </li>

        <li className="nav-item">
          <Link href="/admin/notice" className={`nav-link ${pathname?.startsWith('/admin/notice') ? '' : 'collapsed'}`}>
            <i className="bi bi-megaphone"></i>
            <span>공지사항</span>
            </Link>
        </li>

        <li className="nav-item">
          <Link href="/admin/faq" className={`nav-link ${pathname?.startsWith('/admin/faq') ? '' : 'collapsed'}`}>
            <i className="bi bi-question-circle"></i>
            <span>FAQ</span>
            </Link>
        </li>

        <li className="nav-item">
          <a
            className={`nav-link ${pathname?.startsWith('/admin/newsletter') ? '' : 'collapsed'}`}
            data-bs-target="#newsletter-nav"
            data-bs-toggle="collapse"
            href="#"
          >
            <i className="bi bi-envelope-paper"></i>
            <span>뉴스레터</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </a>
          <ul
            id="newsletter-nav"
            className={`nav-content collapse ${pathname?.startsWith('/admin/newsletter') ? 'show' : ''}`}
            data-bs-parent="#sidebar-nav"
          >
            <li>
              <Link
                href={withAdminPrefix('/newsletter/subscribers')}
                className={pathname === '/admin/newsletter/subscribers' ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>가입자</span>
              </Link>
            </li>
            <li>
              <Link
                href={withAdminPrefix('/newsletter/send-history')}
                className={pathname?.startsWith('/admin/newsletter/send-history') ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>발송 이력</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link href="/admin/admins" className={`nav-link ${pathname?.startsWith('/admin/admins') ? '' : 'collapsed'}`}>
            <i className="bi bi-person-gear"></i>
            <span>운영자 계정</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
}


