import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'centrumrolnictwa-cdn.b-cdn.net',
      },
    ],
  },
};

export default nextConfig;