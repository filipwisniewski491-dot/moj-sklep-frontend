/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // AKTYWUJEMY GLOBALNY OPTYMALIZATOR BUNNY CDN
    loader: 'custom',
    loaderFile: './lib/bunnyLoader.ts',
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.b-cdn.net', 
      },
      {
        protocol: 'http',
        hostname: '178.105.201.145', 
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'], // AVIF z przodu, jest lżejszy i łapie lepsze oceny LCP
    minimumCacheTTL: 31536000,
    // DODANO: 256 dla perfekcyjnego ucięcia wagi kafelków na smartfonach
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

  // Dodajemy sztywne nagłówki dla Best Practices (Lighthouse 100/100)
  async headers() {
    return [
      {
        // Globalne nagłówki bezpieczeństwa
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache na mur-beton dla zdjęć
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;