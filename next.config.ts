import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'centrumrolnictwa-cdn.b-cdn.net', // Twoja domena Bunny
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Pozostałe zdjęcia (Doradca)
      },
    ],
  },
};

export default nextConfig;