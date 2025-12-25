'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { adminFetch } from '@/lib/admin/api';

interface AdminInfo {
  id?: string;
  username: string;
  name: string;
}

export default function Header() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const response = await adminFetch('auth/me', { method: 'GET' });
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          setAdmin(data.admin);
        }
      } catch (error) {
        console.error('Failed to load admin info:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadAdmin();
  }, []);

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between">
        <Link href="/admin" className="logo d-flex align-items-center">
          <img src="/assets/img/logo_atsignal.png" alt="" />
          <span className="d-none d-lg-block">atsignal admin</span>
        </Link>
        <i className="bi bi-list toggle-sidebar-btn"></i>
      </div>

      <div className="search-bar">
        <form className="search-form d-flex align-items-center" method="POST" action="#">
          <input type="text" name="query" placeholder="Search" title="Enter search keyword" />
          <button type="submit" title="Search">
            <i className="bi bi-search"></i>
          </button>
        </form>
      </div>

      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">
          <li className="nav-item d-block d-lg-none">
            <a className="nav-link nav-icon search-bar-toggle" href="#">
              <i className="bi bi-search"></i>
            </a>
          </li>

          <li className="nav-item dropdown">
            <a className="nav-link nav-icon" href="#" data-bs-toggle="dropdown">
              <i className="bi bi-bell"></i>
              <span className="badge bg-primary badge-number">0</span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
              <li className="dropdown-header">알림이 없습니다</li>
            </ul>
          </li>

          <li className="nav-item dropdown pe-3">
            <a className="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
              <img src="/assets/img/logo_atsignal-org.png" alt="Profile" className="rounded-circle" />
              <span className="d-none d-md-block dropdown-toggle ps-2">
                {loading ? '...' : admin ? admin.name : '로그인 필요'}
              </span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
              <li className="dropdown-header">
                <h6>{loading ? '로딩 중...' : admin ? admin.name : '로그인 필요'}</h6>
                <span>{loading ? '' : admin ? admin.username : ''}</span>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <LogoutButton />
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
}


