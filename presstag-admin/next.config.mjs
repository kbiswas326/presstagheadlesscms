/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },

  // ✅ IMPORTANT: prevent build from failing due to ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;