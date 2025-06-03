/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Fix for Next.js 15 - changed from boolean to object
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.192.11:3000'],
      bodySizeLimit: '2mb'
    }
    // Removed optimizeCss - causing critters module error
  },
  
  // Basic security headers
  poweredByHeader: false,
  
  // Keep it simple for now - no advanced optimizations
  images: {
    domains: ['localhost']
  }
};

module.exports = nextConfig;

