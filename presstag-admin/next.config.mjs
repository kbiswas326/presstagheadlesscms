///  next.config.mjs//
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",  // ✅ Changed from /api/uploads/** to /uploads/**
      },
    ],
  },
};

export default nextConfig;