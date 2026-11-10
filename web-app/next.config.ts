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
      // Disable Webpack packfile disk caching on Windows to prevent ENOENT rename crashes
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
