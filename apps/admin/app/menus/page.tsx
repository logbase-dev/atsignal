'use client';

import Link from 'next/link';

export default function MenusPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>메뉴 관리</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <Link 
          href="/menus/web" 
          style={{
            padding: '2rem',
            border: '1px solid #e5e5e5',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: '#fff',
            transition: 'box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Web 사이트 메뉴</h2>
          <p style={{ color: '#666' }}>atsignal.io 사이트의 메뉴를 관리합니다.</p>
        </Link>

        <Link 
          href="/menus/docs" 
          style={{
            padding: '2rem',
            border: '1px solid #e5e5e5',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: '#fff',
            transition: 'box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Docs 사이트 메뉴</h2>
          <p style={{ color: '#666' }}>docs.atsignal.io 사이트의 메뉴를 관리합니다.</p>
        </Link>
      </div>
    </div>
  );
}

