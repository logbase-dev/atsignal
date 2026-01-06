'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function Splash() {
  const ENABLE_SPLASH = false; // disable splash overlay while video is removed
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);

  // 클라이언트에서만 마운트되도록 처리 (Hydration 에러 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 동영상 종료 시 처리
  const handleVideoEnd = () => {
    setIsVisible(false);
  };

  // 클릭 시 스킵
  const handleClick = () => {
    setIsVisible(false);
  };

  // 동영상 로드 실패 시 처리
  const handleVideoError = () => {
    // 동영상 로드 실패 시 즉시 숨김
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isMounted) return;
    if (!ENABLE_SPLASH) {
      setIsVisible(false);
      return;
    }
    
    // 홈페이지(/ 또는 /ko, /en)에서만 스플래시 표시
    // 정규식으로 홈페이지 경로 확인: /, /ko, /en, /ko/, /en/
    const isHomePage = /^\/(ko|en)?\/?$/.test(pathname);
    
    if (isHomePage) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [pathname, isMounted]);

  // 서버 렌더링 시에는 아무것도 렌더링하지 않음 (Hydration 에러 방지)
  if (!isMounted) {
    return null;
  }

  if (!ENABLE_SPLASH) {
    return null;
  }

  return (
    <div 
      className="splash-screen" 
      style={{ 
        display: isVisible ? 'flex' : 'none',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      onClick={handleClick}
    >
      <div className="splash-content">
        {/* Splash video temporarily disabled for replacement */}
        {/* <video
          ref={videoRef}
          className="splash-video"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoError}
        >
          <source src="/videos/main_splash.mp4" type="video/mp4" />
          <source src="/videos/main_splash.mov" type="video/quicktime" />
        </video> */}
      </div>
    </div>
  );
}
