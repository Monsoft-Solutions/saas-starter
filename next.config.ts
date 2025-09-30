import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: false,
  },
  // Externalize packages with dynamic requires
  serverExternalPackages: ['winston', 'winston-daily-rotate-file'],
  turbopack: {
    // Force Turbopack to treat this directory as the workspace root so it can resolve PostCSS config.
    root: __dirname,
  },
};

export default nextConfig;
