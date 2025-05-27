
import type {NextConfig} from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in dev mode to avoid caching issues
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Changed to false
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed to false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
      // This domain was provided in a warning from Firebase Studio.
      // It might need to be updated if your Studio preview URL changes.
      '9003-firebase-studio-1748256100233.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev',
    ],
  },
};

export default withPWA(nextConfig);
