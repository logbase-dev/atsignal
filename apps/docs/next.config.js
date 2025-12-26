/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Firebase Hosting 배포를 위한 정적 사이트 생성
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // 정적 사이트 생성 시 API 라우트 제외
  distDir: '.next',
};

module.exports = nextConfig;

