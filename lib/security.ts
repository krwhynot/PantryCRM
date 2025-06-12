/**
 * Security utilities and middleware for the PantryCRM application
 * LEGACY NOTICE: This file is being gradually replaced by enhanced security modules
 * 
 * @deprecated Use the following enhanced modules instead:
 * - @/lib/enhanced-rate-limiter for rate limiting
 * - @/lib/input-sanitization for input validation
 * - @/lib/account-lockout for authentication protection
 * - @/lib/csrf-protection for CSRF protection
 * - @/lib/security-headers for security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security-logger";

// Re-export enhanced security modules for backwards compatibility
export { withEnhancedRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/enhanced-rate-limiter';
export { withCSRFProtection, withFormCSRFProtection, withAPICSRFProtection } from '@/lib/csrf-protection';
export { withSecurityHeaders, getSecurityConfig } from '@/lib/security-headers';
export { accountLockoutManager, withAccountLockoutProtection } from '@/lib/account-lockout';

/**
 * Input sanitization function to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .trim()
    .substring(0, 1000); // Limit length to prevent DoS
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Enhanced rate limiting for API endpoints with security logging
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number; firstAttempt: number }>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  check(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now >= attempt.resetTime) {
      this.attempts.set(identifier, { 
        count: 1, 
        resetTime: now + windowMs,
        firstAttempt: now
      });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      // Log rate limit exceeded for security monitoring
      if (attempt.count === maxAttempts) {
        console.warn(`[SECURITY] Rate limit exceeded for ${identifier}. ${maxAttempts} attempts in ${(now - attempt.firstAttempt)}ms`);
      }
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now >= value.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { maxAttempts?: number; windowMs?: number } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { maxAttempts = 100, windowMs = 60000 } = options;
    
    // Create identifier from IP and user agent
    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const identifier = `${ip}:${userAgent.substring(0, 50)}`;
    
    if (!rateLimiter.check(identifier, maxAttempts, windowMs)) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          retryAfter: Math.ceil(windowMs / 1000) 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-RateLimit-Limit': maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
          }
        }
      );
    }
    
    return handler(req);
  };
}

/**
 * Check if current user has admin role
 */
export async function requireAdmin(request?: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { 
      user: null, 
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) 
    };
  }

  const user = await prismadb.user.findFirst({
    where: { email: session.user.email }
  });

  if (user?.role !== "admin") {
    return { 
      user: null, 
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) 
    };
  }

  return { user };
}

/**
 * Check if current user is authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { 
      user: null, 
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) 
    };
  }

  const user = await prismadb.user.findFirst({
    where: { email: session.user.email }
  });

  if (!user?.isActive) {
    return { 
      user: null, 
      error: NextResponse.json({ error: "Account inactive" }, { status: 403 }) 
    };
  }

  return { user };
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent content type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - Enhanced security, removed unsafe directives
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'wasm-unsafe-eval'; " + // Removed unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline'; " + // Keep unsafe-inline for CSS-in-JS frameworks
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.azure.net https://*.azurewebsites.net; " + // Azure services
    "object-src 'none'; " + // Prevent Flash/plugin execution
    "base-uri 'self'; " + // Prevent base tag injection
    "form-action 'self'; " + // Restrict form submissions
    "frame-ancestors 'none'; " + // Enhanced clickjacking protection
    "upgrade-insecure-requests" // Force HTTPS
  );
  
  return response;
}

/**
 * Log security events
 */
export function logSecurityEvent(event: string, details: any, request?: NextRequest): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: {
      ...details,
      ip: request?.ip || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
    }
  };
  
  // In production, send to security monitoring service
  console.warn('[SECURITY]', logEntry);
}

/**
 * Validate and sanitize file upload
 */
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
}