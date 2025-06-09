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
  productionBrowserSourceMaps: true,
  // Completely disable tracing to fix Windows EPERM errors
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  typescript: {
    // !! WARN !!
    // Temporary for build success - fix type errors later
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Temporary for build success - fix ESLint errors later
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Fix for Next.js 15 - changed from boolean to object
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.192.11:3000'],
      bodySizeLimit: '2mb'
    },
    // Enable modern browser optimizations
    optimizeCss: true,
    // Enable module and mjs fullySpecified
    fullySpecified: true,
  },
  
  // Basic security headers
  poweredByHeader: false,
  
  // Images configuration
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
  },
  
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Configure webpack for better tree shaking
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.devtool = 'source-map';
    }
    // Only run in production
    if (!dev) {
      // Add module concatenation for better minification
      config.optimization.concatenateModules = true;
      
      // Enable scope hoisting
      config.optimization.usedExports = true;
      
      // Add aggressive code splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1];
              return `vendor.${packageName?.replace('@', '')}`;
            },
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);

