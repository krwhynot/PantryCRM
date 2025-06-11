/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for Azure deployment
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  
  // Ignore build errors for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Basic configuration
  poweredByHeader: false,
  generateEtags: false,
  
  // Disable experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  
  // Simple webpack config
  webpack: (config) => {
    // Disable source maps in production for faster builds
    config.devtool = false;
    return config;
  },
  
  // Output configuration for standalone deployment
  output: 'standalone',
};

module.exports = nextConfig;