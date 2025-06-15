import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/security-logger';

// IP whitelist for admin routes - update with your approved IP addresses
const ADMIN_IP_WHITELIST = [
  '203.0.113.42/32', // Example IP from your request
  '127.0.0.1',       // Localhost for development
  '::1'              // IPv6 localhost
];

// Helper function to check if IP is in CIDR range or exact match
function isIpInRange(ip: string, cidr: string): boolean {
  // Handle exact match
  if (!cidr.includes('/')) {
    return ip === cidr;
  }
  
  // Simple CIDR implementation for common cases
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits, 10);
  
  // Convert IP to numeric format (simplified for IPv4)
  function ipToLong(ipAddress: string): number {
    return ipAddress.split('.')
      .reduce((sum, part) => (sum << 8) + parseInt(part, 10), 0) >>> 0;
  }
  
  // Calculate if IP is in range
  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);
  const maskLong = ~((1 << (32 - mask)) - 1) >>> 0;
  
  return (ipLong & maskLong) === (rangeLong & maskLong);
}

// Check if route is considered an admin route
function isAdminRoute(path: string): boolean {
  return path.includes('/api/admin') || 
         path.includes('/api/settings') || 
         path.includes('/api/migration');
}

export function apiSecurityMiddleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only apply to API routes
  if (!path.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Get client IP address
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('x-real-ip') || 
                   '0.0.0.0';
                   
  // Set standard CORS headers for all API responses
  const response = NextResponse.next();
  
  // Apply appropriate CORS policy based on route type
  if (isAdminRoute(path)) {
    // Restricted CORS for admin routes
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || 'https://pantry-crm-prod-app.azurewebsites.net');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Check IP whitelist for admin routes
    const isIpAllowed = ADMIN_IP_WHITELIST.some(allowedIp => isIpInRange(clientIp, allowedIp));
    
    if (!isIpAllowed) {
      // Log unauthorized admin access attempt
      logSecurityEvent('unauthorized_access_attempt', {
        path,
        ip: clientIp,
        userAgent: request.headers.get('user-agent') || 'unknown'
      }, request);
      
      // Return 403 Forbidden
      return new NextResponse(JSON.stringify({ 
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this endpoint'
      }), { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          // Maintain CORS headers even in error responses
          'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'https://pantry-crm-prod-app.azurewebsites.net',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
  } else {
    // Standard CORS for public API routes
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  // Handle preflight requests for all API routes
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Max-Age': '86400' // 24 hours
      }
    });
  }
  
  return response;
}
