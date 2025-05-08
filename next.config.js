/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/BXluQx4ige9GuW0Ia56BHw/**',
      },
    ],
  },
  // Add logging configuration
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'error' : 'warn',
  },
  // Suppress module trace in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
};

module.exports = nextConfig; 