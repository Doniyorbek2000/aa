import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets a phone on the same Wi-Fi load the dev server, e.g. DEV_LAN_ORIGIN=192.168.0.244
  ...(process.env.DEV_LAN_ORIGIN ? { allowedDevOrigins: [process.env.DEV_LAN_ORIGIN] } : {}),
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
};

export default nextConfig;
