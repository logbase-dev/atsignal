/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebase App Hosting은 서버 사이드 렌더링 지원하므로 output: 'export' 제거
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  distDir: '.next',
  trailingSlash: false,
};

module.exports = nextConfig;

