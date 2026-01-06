/** @type {import('next').NextConfig} */
const path = require('path');

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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

module.exports = nextConfig;