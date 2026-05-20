import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Don't bundle these — keep them as native Node.js modules on the server
  serverExternalPackages: ['xlsx', '@supabase/supabase-js'],
  // Next.js 16 uses Turbopack by default; empty config satisfies the requirement
  turbopack: {},
};

export default nextConfig;
