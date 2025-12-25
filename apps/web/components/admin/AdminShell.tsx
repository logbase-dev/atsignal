'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminApiUrl } from '@/lib/admin/api';

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);
  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: '10px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        color: active ? '#0b4fd7' : '#111827',
        background: active ? '#e8f0ff' : 'transparent',
        fontWeight: active ? 700 : 600,
      }}
    >
      {label}
    </a>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(getAdminApiUrl('logout'), { method: 'POST', credentials: 'include' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '260px 1fr' }}>
      <aside style={{ borderRight: '1px solid #e5e7eb', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <a href="/admin" style={{ fontWeight: 800, textDecoration: 'none', color: '#111827' }}>
            Admin
          </a>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: '1px solid #e5e7eb',
              background: '#fff',
              padding: '6px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
        <nav style={{ display: 'grid', gap: 6 }}>
          <div style={{ marginTop: 6, marginBottom: 4, fontSize: 12, color: '#6b7280', fontWeight: 700 }}>
            Menus
          </div>
          <NavLink href="/admin/menus/web" label="Web 메뉴" />
          <NavLink href="/admin/menus/docs" label="Docs 메뉴" />
        </nav>
      </aside>

      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}


