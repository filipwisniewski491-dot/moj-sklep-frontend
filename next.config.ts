/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.b-cdn.net', // Odblokowuje wszystkie zdjęcia z BunnyCDN
      },
      {
        protocol: 'http',
        hostname: '178.105.201.145', // Odblokowuje zdjęcia bezpośrednio ze Strapi
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'zustand'],
  },

  output: 'standalone',
};

module.exports = nextConfig;