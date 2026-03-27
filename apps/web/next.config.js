/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // output: 'export' 제거 - Middleware를 사용하려면 정적 사이트 생성 모드 비활성화 필요
  // Vercel에서는 Middleware가 Edge Functions로 실행되므로 output: 'export' 사용 불가
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  distDir: '.next',
  trailingSlash: false,
  // Admin API를 Functions로 프록시
  async rewrites() {
    const functionsUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://asia-northeast3-atsignal-landing-dev-e8547.cloudfunctions.net';
    return [
      {
        source: '/admin-api/:path*',
        destination: `${functionsUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

module.exports = nextConfig;