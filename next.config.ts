import type { NextConfig } from 'next';
import path from 'path';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
  analyzerMode: 'static',
  reportFilename: '.next/analyze/bundle-analyzer.html',
  generateStatsFile: true,
  statsFilename: '.next/analyze/stats.json',
  defaultSizes: 'gzip',
});

const nextConfig: NextConfig = {
  // Basic configuration optimized for Azure B1
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: process.env.NODE_ENV === 'production',
  compress: true,
  
  // Azure deployment optimization
  output: 'standalone',
  trailingSlash: false,
  
  // TypeScript and ESLint configuration
  typescript: {
    // Enable type checking during builds for production safety
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable linting during builds to catch issues early
    ignoreDuringBuilds: false,
  },
  
  // Next.js 15 compatible server actions with B1 optimizations
  experimental: {
    // React 19 RC compiler support for automatic optimizations
    reactCompiler: true,
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.192.11:3000'],
      bodySizeLimit: '1mb', // Reduced for B1 memory constraints
    },
    optimizeCss: true,
    serverComponentsExternalPackages: ['bcrypt', 'bcryptjs', '@prisma/client'],
    // Memory optimization for B1 (experimental feature)
    memoryOptimization: true,
  },
  
  // Images configuration optimized for 3G and mobile
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 604800, // 7 days caching for B1
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Optimized headers for caching and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations for B1 constraints with error handling
  webpack: (config, { dev }) => {
    try {
      // Memory and performance optimizations for B1
      if (!dev) {
        config.devtool = false;
        
        // Reduce memory usage
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              maxSize: 244000, // ~240KB chunks for better loading
            },
          },
        };
        
        // Tree shaking optimization
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
      }
      
      // Alias for faster imports with proper path resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(process.cwd()),
      };
      
    } catch (error) {
      console.warn('Webpack configuration warning:', error);
      // Continue with default configuration if custom config fails
    }
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);