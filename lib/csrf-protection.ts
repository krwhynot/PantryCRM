/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern and SameSite cookies
 * 
 * SECURITY: Prevents Cross-Site Request Forgery attacks
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logSecurityEvent } from '@/lib/security-logger';

export interface CSRFConfig {
  cookieName?: string;
  headerName?: string;
  excludePaths?: string[];
  excludeMethods?: string[];
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  cookieName: '__Host-csrf-token',
  headerName: 'x-csrf-token',
  excludePaths: ['/api/auth', '/api/health'],
  excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
  secure: true,
  sameSite: 'strict'
};

/**
 * Generate cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Validate CSRF token using constant-time comparison
 */
export function validateCSRFToken(tokenFromHeader: string, tokenFromCookie: string): boolean {
  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  try {
    const headerBuffer = Buffer.from(tokenFromHeader, 'base64url');
    const cookieBuffer = Buffer.from(tokenFromCookie, 'base64url');

    if (headerBuffer.length !== cookieBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(headerBuffer, cookieBuffer);
  } catch {
    return false;
  }
}

/**
 * Check if path should be excluded from CSRF protection
 */
function shouldExcludePath(pathname: string, excludePaths: string[]): boolean {
  return excludePaths.some(path => pathname.startsWith(path));
}

/**
 * CSRF protection middleware
 */
export function withCSRFProtection<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | R>,
  config: CSRFConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (...args: T): Promise<NextResponse> => {
    const req = args[0] as NextRequest;
    const pathname = req.nextUrl.pathname;
    const method = req.method;

    // Skip CSRF protection for excluded methods
    if (finalConfig.excludeMethods.includes(method)) {
      const result = await handler(...args);
      return result instanceof NextResponse ? result : NextResponse.json(result);
    }

    // Skip CSRF protection for excluded paths
    if (shouldExcludePath(pathname, finalConfig.excludePaths)) {
      const result = await handler(...args);
      return result instanceof NextResponse ? result : NextResponse.json(result);
    }

    try {
      // Get CSRF token from cookie
      const cookies = req.cookies;
      const cookieToken = cookies.get(finalConfig.cookieName)?.value;

      // Get CSRF token from header
      const headerToken = req.headers.get(finalConfig.headerName);

      // Validate CSRF tokens
      if (!cookieToken || !headerToken || !validateCSRFToken(headerToken, cookieToken)) {
        logSecurityEvent('csrf_token_validation_failed', {
          endpoint: pathname,
          method,
          hasCookieToken: !!cookieToken,
          hasHeaderToken: !!headerToken,
          userAgent: req.headers.get('user-agent') || 'unknown'
        }, req);

        return NextResponse.json(
          { error: 'CSRF token validation failed' },
          { status: 403 }
        );
      }

      // Process the request
      const result = await handler(...args);
      const response = result instanceof NextResponse ? result : NextResponse.json(result);

      // Rotate CSRF token for additional security (optional)
      if (Math.random() < 0.1) { // 10% chance to rotate
        const newToken = generateCSRFToken();
        response.cookies.set(finalConfig.cookieName, newToken, {
          httpOnly: true,
          secure: finalConfig.secure,
          sameSite: finalConfig.sameSite,
          path: '/',
          maxAge: 24 * 60 * 60 // 24 hours
        });
      }

      return response;

    } catch (error) {
      console.error('[CSRF_PROTECTION] Error in middleware:', error);
      
      // Log security event for debugging
      logSecurityEvent('csrf_middleware_error', {
        endpoint: pathname,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, req);

      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Initialize CSRF token endpoint - call this from a GET endpoint
 */
export function initializeCSRFToken(config: CSRFConfig = {}): NextResponse {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const token = generateCSRFToken();

  const response = NextResponse.json({ csrfToken: token });
  
  response.cookies.set(finalConfig.cookieName, token, {
    httpOnly: true,
    secure: finalConfig.secure,
    sameSite: finalConfig.sameSite,
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  });

  return response;
}

/**
 * Middleware for protecting form submissions
 */
export function withFormCSRFProtection<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | R>
) {
  return withCSRFProtection(handler, {
    excludeMethods: ['GET', 'HEAD', 'OPTIONS'], // Only protect state-changing operations
    excludePaths: ['/api/auth', '/api/health', '/api/csrf'], // Exclude auth and health endpoints
  });
}

/**
 * Middleware for protecting API endpoints
 */
export function withAPICSRFProtection<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | R>
) {
  return withCSRFProtection(handler, {
    excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
    excludePaths: [
      '/api/auth',
      '/api/health', 
      '/api/csrf',
      '/api/crm/leads/create-lead-from-web' // External API endpoint
    ],
    headerName: 'x-csrf-token'
  });
}

/**
 * Get CSRF token from request (utility function)
 */
export function getCSRFTokenFromRequest(req: NextRequest, config: CSRFConfig = {}): string | null {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return req.cookies.get(finalConfig.cookieName)?.value || null;
}