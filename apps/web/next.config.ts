import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Self-contained server bundle for the Docker image (apps/web/Dockerfile).
  output: 'standalone',
  async redirects() {
    // shortcut: always Uzbek; switch to Accept-Language negotiation in proxy.ts once ru content exists.
    return [{ source: '/', destination: '/uz', permanent: false }];
  },
};

export default nextConfig;
