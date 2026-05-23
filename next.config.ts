const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'centrumrolnictwa-cdn.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // <--- TO JEST NIEZBĘDNE
      }
    ],
  },
};