/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' 제거 - 개발 모드에서 동적 라우팅을 위해 비활성화
  // 프로덕션 빌드 시 정적 사이트 생성이 필요한 경우에만 활성화
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

