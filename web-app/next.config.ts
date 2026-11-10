import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@payshield/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use in-memory caching to prevent Windows filesystem ENOENT file locks while ensuring CSS modules compile properly
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
