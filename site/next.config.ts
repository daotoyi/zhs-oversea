import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // sql.js（WASM SQLite）必须作为外部包由 Node 原生 require 加载，
  // 不能被 webpack 打包：其 UMD 包装会在 module.exports 处崩溃。
  // standalone 会自动把该包连同 dist/sql-wasm.wasm 一起拷贝进产物。
  serverExternalPackages: ['sql.js'],
  // 部署用：产出独立可运行的产物，服务器无需 npm install
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy Chinese routes -> English equivalents
      { source: '/art', destination: '/objects', permanent: true },
      { source: '/wisdom', destination: '/classics', permanent: true },
    ];
  },
};

export default nextConfig;
