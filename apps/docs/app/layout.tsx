import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}

// 더미 코멘트 추가 2/19 오후2시 by 김현득
