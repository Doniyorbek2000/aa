import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
};

export default nextConfig;
