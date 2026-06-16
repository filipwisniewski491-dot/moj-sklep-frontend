import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

// 1. INICJALIZACJA SILNIKA PWA
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    loader: 'custom',
    loaderFile: './lib/bunnyLoader.ts',
    
    remotePatterns: [
      { protocol: 'https', hostname: '**.b-cdn.net' },
      { protocol: 'http', hostname: '178.105.201.145' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'], 
    minimumCacheTTL: 31536000,
    deviceSizes: [256, 384, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'zustand'],
  },

  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

// 2. EKSPORT Z OPAKOWANIEM PWA
export default withPWA(nextConfig);