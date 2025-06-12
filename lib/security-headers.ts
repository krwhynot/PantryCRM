/**
 * Enhanced Security Headers Middleware
 * Implements comprehensive security headers for web application protection
 * 
 * SECURITY: Addresses multiple OWASP vulnerabilities:
 * - A05:2021 - Security Misconfiguration
 * - A03:2021 - Injection (XSS prevention)
 * - Clickjacking protection
 * - MIME type sniffing prevention
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string | boolean;
  strictTransportSecurity?: string | boolean;
  xFrameOptions?: string | boolean;
  xContentTypeOptions?: boolean;
  referrerPolicy?: string | boolean;
  permissionsPolicy?: string | boolean;
  crossOriginEmbedderPolicy?: string | boolean;
  crossOriginOpenerPolicy?: string | boolean;
  crossOriginResourcePolicy?: string | boolean;
  customHeaders?: Record<string, string>;
}

const DEFAULT_CONFIG: Required<Omit<SecurityHeadersConfig, 'customHeaders'>> & { customHeaders: Record<string, string> } = {
  contentSecurityPolicy: true,
  strictTransportSecurity: true,
  xFrameOptions: true,
  xContentTypeOptions: true,
  referrerPolicy: true,
  permissionsPolicy: true,
  crossOriginEmbedderPolicy: false, // Can break functionality if not configured properly
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  customHeaders: {}
};

/**
 * Generate Content Security Policy header value
 */
function generateCSPHeader(isDevelopment: boolean = false): string {
  const basePolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Relaxed for Next.js
    "style-src 'self' 'unsafe-inline'", // Needed for styled-components/emotion
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'self'",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isDevelopment) {
    // Allow webpack dev server and hot reload
    basePolicy.push(
      "connect-src 'self' ws: wss:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );
  }

  // Production-specific restrictions
  if (!isDevelopment) {
    basePolicy.push(
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    );
  }

  return basePolicy.join('; ');
}

/**
 * Generate Permissions Policy header value
 */
function generatePermissionsPolicyHeader(): string {
  return [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'payment=()',
    'usb=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'picture-in-picture=()'
  ].join(', ');
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Content Security Policy
  if (finalConfig.contentSecurityPolicy) {
    const cspValue = typeof finalConfig.contentSecurityPolicy === 'string'
      ? finalConfig.contentSecurityPolicy
      : generateCSPHeader(isDevelopment);
    response.headers.set('Content-Security-Policy', cspValue);
  }

  // Strict Transport Security (HTTPS only)
  if (finalConfig.strictTransportSecurity && !isDevelopment) {
    const hstsValue = typeof finalConfig.strictTransportSecurity === 'string'
      ? finalConfig.strictTransportSecurity
      : 'max-age=31536000; includeSubDomains; preload';
    response.headers.set('Strict-Transport-Security', hstsValue);
  }

  // X-Frame-Options (Clickjacking protection)
  if (finalConfig.xFrameOptions) {
    const frameValue = typeof finalConfig.xFrameOptions === 'string'
      ? finalConfig.xFrameOptions
      : 'DENY';
    response.headers.set('X-Frame-Options', frameValue);
  }

  // X-Content-Type-Options (MIME sniffing protection)
  if (finalConfig.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Referrer Policy
  if (finalConfig.referrerPolicy) {
    const referrerValue = typeof finalConfig.referrerPolicy === 'string'
      ? finalConfig.referrerPolicy
      : 'strict-origin-when-cross-origin';
    response.headers.set('Referrer-Policy', referrerValue);
  }

  // Permissions Policy
  if (finalConfig.permissionsPolicy) {
    const permissionsValue = typeof finalConfig.permissionsPolicy === 'string'
      ? finalConfig.permissionsPolicy
      : generatePermissionsPolicyHeader();
    response.headers.set('Permissions-Policy', permissionsValue);
  }

  // Cross-Origin Embedder Policy
  if (finalConfig.crossOriginEmbedderPolicy) {
    const coepValue = typeof finalConfig.crossOriginEmbedderPolicy === 'string'
      ? finalConfig.crossOriginEmbedderPolicy
      : 'require-corp';
    response.headers.set('Cross-Origin-Embedder-Policy', coepValue);
  }

  // Cross-Origin Opener Policy
  if (finalConfig.crossOriginOpenerPolicy) {
    const coopValue = typeof finalConfig.crossOriginOpenerPolicy === 'string'
      ? finalConfig.crossOriginOpenerPolicy
      : 'same-origin';
    response.headers.set('Cross-Origin-Opener-Policy', coopValue);
  }

  // Cross-Origin Resource Policy
  if (finalConfig.crossOriginResourcePolicy) {
    const corpValue = typeof finalConfig.crossOriginResourcePolicy === 'string'
      ? finalConfig.crossOriginResourcePolicy
      : 'same-origin';
    response.headers.set('Cross-Origin-Resource-Policy', corpValue);
  }

  // Additional security headers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Expect-CT', 'max-age=86400, enforce');

  // Custom headers
  if (finalConfig.customHeaders) {
    Object.entries(finalConfig.customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Middleware wrapper to add security headers to all responses
 */
export function withSecurityHeaders<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | R>,
  config: SecurityHeadersConfig = {}
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      const response = result instanceof NextResponse ? result : NextResponse.json(result);
      
      return applySecurityHeaders(response, config);
    } catch (error) {
      console.error('[SECURITY_HEADERS] Error applying headers:', error);
      
      // Return error response with security headers
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      return applySecurityHeaders(errorResponse, config);
    }
  };
}

/**
 * Predefined security header configurations for different endpoint types
 */
export const SECURITY_HEADER_CONFIGS = {
  // Strict configuration for sensitive endpoints
  strict: {
    contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'; base-uri 'none';",
    xFrameOptions: 'DENY',
    crossOriginResourcePolicy: 'same-origin',
    crossOriginOpenerPolicy: 'same-origin',
    referrerPolicy: 'no-referrer'
  },

  // API endpoints configuration
  api: {
    contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none';",
    xFrameOptions: 'DENY',
    crossOriginResourcePolicy: 'cross-origin', // Allow CORS for API
    crossOriginOpenerPolicy: 'same-origin',
    referrerPolicy: 'no-referrer'
  },

  // Public content configuration
  public: {
    contentSecurityPolicy: true, // Use default
    xFrameOptions: 'SAMEORIGIN',
    crossOriginResourcePolicy: 'cross-origin',
    referrerPolicy: 'strict-origin-when-cross-origin'
  },

  // Development configuration (relaxed)
  development: {
    contentSecurityPolicy: false, // Disable CSP in development
    strictTransportSecurity: false,
    crossOriginEmbedderPolicy: false
  }
} as const;

/**
 * Get appropriate security configuration based on environment and endpoint type
 */
export function getSecurityConfig(
  endpointType: 'strict' | 'api' | 'public' = 'api'
): SecurityHeadersConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return { ...SECURITY_HEADER_CONFIGS.development, ...SECURITY_HEADER_CONFIGS[endpointType] };
  }
  
  return SECURITY_HEADER_CONFIGS[endpointType];
}

/**
 * Apply security headers to middleware responses (for use in middleware.ts)
 */
export function addSecurityHeadersToMiddleware(response: NextResponse): NextResponse {
  return applySecurityHeaders(response, getSecurityConfig('public'));
}