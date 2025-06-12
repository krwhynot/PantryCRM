/**
 * Security utilities and middleware for the PantryCRM application
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

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
 * Rate limiting for API endpoints
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  
  check(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now >= attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
}

export const rateLimiter = new RateLimiter();

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