/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' 제거 - Middleware를 사용하려면 정적 사이트 생성 모드 비활성화 필요
  // Vercel에서는 Middleware가 Edge Functions로 실행되므로 output: 'export' 사용 불가
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

