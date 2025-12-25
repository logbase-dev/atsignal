'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  
  const handleGoBack = () => {
    router.back();
  };
    
  return (
    <div className="not-found">
      <div>
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="not-found-text">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link
          href="/"
          className="not-found-button"
        >
            홈으로 돌아가기
        </Link>
          <button
            onClick={handleGoBack}
            className="not-found-button"
            type="button"
          >
            이전 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

