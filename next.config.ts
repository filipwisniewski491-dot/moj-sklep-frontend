/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'centrumrolnictwa-cdn.b-cdn.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
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