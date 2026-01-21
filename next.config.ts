import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Ensure trailing slash handling is consistent
  trailingSlash: false,
  // Enable automatic static optimization
  experimental: {
    optimizeCss: true,
  },
  // Vercel deployment optimizations
  poweredByHeader: false,
  compress: true,
  // Ensure proper handling of dynamic routes
  async rewrites() {
    return [
      {
        source: '/blog/:slug',
        destination: '/blog/:slug',
      },
    ];
  },
};

export default nextConfig;
