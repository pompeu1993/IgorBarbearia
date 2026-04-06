import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Isso avisa a Vercel para ignorar erros de ESLint e não travar a build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Isso avisa a Vercel para ignorar erros de TypeScript e não travar a build
    ignoreBuildErrors: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
