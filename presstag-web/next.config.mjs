/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5001',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'dev.sportzpoint.com',
      },
      {
        protocol: 'https',
        hostname: 'sportzpoint.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'dmpsza32x691.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'laudable-integrity-production-cc28.up.railway.app',
      },
    ],
  },
};

export default nextConfig;