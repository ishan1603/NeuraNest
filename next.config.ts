import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [{ hostname: 'img.clerk.com' }],
  },
};

export default process.env.NODE_ENV === 'production'
  ? withSentryConfig(nextConfig, {
      org: 'ishan-o1',
      project: 'javascript-nextjs',
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
