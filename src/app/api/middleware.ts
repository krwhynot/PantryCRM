import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityMiddleware } from '@/middleware/api-security';

// API-specific middleware for Next.js App Router
export function middleware(request: NextRequest) {
  return apiSecurityMiddleware(request);
}

// Configure matcher to apply this middleware to API routes
export const config = {
  matcher: ['/api/:path*'],
};
