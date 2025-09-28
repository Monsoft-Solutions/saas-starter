import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: false,
  },
  turbopack: {
    // Force Turbopack to treat this directory as the workspace root so it can resolve PostCSS config.
    root: __dirname,
  },
};

export default nextConfig;
