import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Don't bundle xlsx — use it straight from node_modules so fs/path work normally
  serverExternalPackages: ['xlsx', '@supabase/supabase-js'],
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

export default nextConfig;
