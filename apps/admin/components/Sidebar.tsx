'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        <li className="nav-item">
          <Link href="/" className={`nav-link ${pathname === '/' ? '' : 'collapsed'}`}>
            <i className="bi bi-grid"></i>
            <span>Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <a 
            className={`nav-link ${pathname?.startsWith('/menus') ? '' : 'collapsed'}`}
            data-bs-target="#menus-nav"
            data-bs-toggle="collapse"
            href="#"
          >
            <i className="bi bi-menu-button-wide"></i>
            <span>메뉴 관리</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </a>
          <ul 
            id="menus-nav" 
            className={`nav-content collapse ${pathname?.startsWith('/menus') ? 'show' : ''}`}
            data-bs-parent="#sidebar-nav"
          >
            <li>
              <Link 
                href="/menus/web" 
                className={pathname === '/menus/web' ? 'active' : ''}
              >
                <i className="bi bi-circle" ></i>
                <span>Web 사이트</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/menus/docs"
                className={pathname === '/menus/docs' ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>Docs 사이트</span>
              </Link>
            </li>
          </ul>
        </li>
        {/* 페이지 관리 기능 비활성화
        <li className="nav-item">
          <a 
            className={`nav-link ${pathname?.startsWith('/pages') ? '' : 'collapsed'}`}
            data-bs-target="#pages-nav"
            data-bs-toggle="collapse"
            href="#"
          >
            <i className="bi bi-file-text"></i>
            <span>페이지 관리</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </a>
          <ul 
            id="pages-nav" 
            className={`nav-content collapse ${pathname?.startsWith('/pages') ? 'show' : ''}`}
            data-bs-parent="#sidebar-nav"
          >
            <li>
              <Link 
                href="/pages/web"
                className={pathname?.startsWith('/pages/web') ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>Web 사이트</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/pages/docs"
                className={pathname?.startsWith('/pages/docs') ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>Docs 사이트</span>
              </Link>
            </li>
          </ul>
        </li>
        */}
        <li className="nav-item">
          <a 
            className={`nav-link ${pathname?.startsWith('/blog') || pathname?.startsWith('/faq') ? '' : 'collapsed'}`}
            data-bs-target="#board-nav"
            data-bs-toggle="collapse"
            href="#"
          >
            <i className="bi bi-journal-text"></i>
            <span>게시판 관리</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </a>
          <ul 
            id="board-nav" 
            className={`nav-content collapse ${pathname?.startsWith('/blog') || pathname?.startsWith('/faq') ? 'show' : ''}`}
            data-bs-parent="#sidebar-nav"
          >
            <li>
              <Link 
                href="/blog"
                className={pathname === '/blog' ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>블로그 관리</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/faq"
                className={pathname?.startsWith('/faq') ? 'active' : ''}
              >
                <i className="bi bi-circle"></i>
                <span>FAQ 관리</span>
              </Link>
            </li>
          </ul>
        </li>

        {/* 관리자 관리 기능 추가 */}
        <li className="nav-item">
          <Link 
            href="/admins"
            className={`nav-link ${pathname?.startsWith('/admins') ? '' : 'collapsed'}`}
          >
            <i className="bi bi-person-gear"></i>
            <span>관리자 관리</span>
          </Link>
        </li>
        
      </ul>
    </aside>
  );
}
