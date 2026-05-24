/** @type {import('next').NextConfig} */
const nextConfig = {
  // === KLUCZOWE USTAWIENIA POD 100/100 Lighthouse ===
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'centrumrolnictwa-cdn.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
    minimumCacheTTL: 31536000, // 1 rok cache dla obrazów
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Optymalizacje kompilacji
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  swcMinify: true,

  // Eksperymentalne optymalizacje
  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'lodash', 'date-fns'],
    scrollRestoration: true,
  },

  // Kompresja i cache
  compress: true,

  // Nagłówki bezpieczeństwa i cache
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;