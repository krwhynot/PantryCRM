/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
  analyzerMode: 'static',
  reportFilename: '.next/analyze/bundle-analyzer.html',
  generateStatsFile: true,
  statsFilename: '.next/analyze/stats.json',
  defaultSizes: 'gzip',
});

const nextConfig = {
  // Basic configuration
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: process.env.NODE_ENV === 'production',
  
  // Disable static optimization for build issues
  output: 'standalone',
  trailingSlash: false,
  
  // Disable static generation during build
  ...(process.env.CI && {
    experimental: {
      isrMemoryCacheSize: 0, // Directly define experimental settings
      serverActions: {
        allowedOrigins: ['localhost:3000', '192.168.192.11:3000'],
        bodySizeLimit: '2mb',
      },
      optimizeCss: true,
    },
    generateBuildId: async () => 'build-' + Date.now(),
  }),
  
  // Ignore build errors for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Next.js 15 compatible server actions (fallback for non-CI builds)
  ...(!process.env.CI && {
    experimental: {
      serverActions: {
        allowedOrigins: ['localhost:3000', '192.168.192.11:3000'],
        bodySizeLimit: '2mb',
      },
      optimizeCss: true,
    },
  }),
  
  // Images configuration
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  
  // Simple webpack config - no complex optimizations
  webpack: (config, { webpack, dev }) => {
    // Only disable source maps in production for faster builds
    if (!dev) {
      config.devtool = false;
    }
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);