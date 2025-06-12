/**
 * Comprehensive Security Configuration
 * Central configuration for all security features
 * 
 * This file provides a unified interface for configuring all security aspects
 * of the PantryCRM application.
 */

import { RateLimitConfig } from '@/lib/enhanced-rate-limiter';
import { SecurityHeadersConfig } from '@/lib/security-headers';
import { CSRFConfig } from '@/lib/csrf-protection';
import { LockoutConfig } from '@/lib/account-lockout';

/**
 * Environment-based security configuration
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Rate limiting configurations for different endpoint types
 */
export const ENHANCED_RATE_LIMITS = {
  // Authentication endpoints - very strict
  authentication: {
    maxAttempts: 5,
    windowMs: 3600000, // 1 hour
    progressivePenalty: true,
    userAware: false
  },

  // Password reset - strict  
  passwordReset: {
    maxAttempts: 3,
    windowMs: 3600000, // 1 hour
    progressivePenalty: true,
    userAware: false
  },

  // API endpoints - moderate
  api: {
    maxAttempts: 20,
    windowMs: 60000, // 1 minute
    progressivePenalty: true,
    userAware: true
  },

  // Search endpoints - lenient with burst allowance
  search: {
    maxAttempts: 50,
    windowMs: 60000, // 1 minute
    progressivePenalty: false,
    userAware: true,
    skipSuccessfulRequests: true
  },

  // Admin endpoints - strict
  admin: {
    maxAttempts: 10,
    windowMs: 60000, // 1 minute
    progressivePenalty: true,
    userAware: true
  },

  // Public endpoints - moderate
  public: {
    maxAttempts: 15,
    windowMs: 60000, // 1 minute
    progressivePenalty: true,
    userAware: false
  },

  // File upload endpoints - very strict
  upload: {
    maxAttempts: 5,
    windowMs: 300000, // 5 minutes
    progressivePenalty: true,
    userAware: true
  }
} as const satisfies Record<string, RateLimitConfig>;

/**
 * Account lockout configurations
 */
export const LOCKOUT_CONFIGS = {
  // Standard lockout for login attempts
  login: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes
    progressiveLockout: true,
    resetSuccessfulLogin: true
  },

  // Stricter lockout for admin actions
  admin: {
    maxAttempts: 3,
    lockoutDuration: 30 * 60, // 30 minutes
    progressiveLockout: true,
    resetSuccessfulLogin: true
  },

  // API key validation lockout
  apiKey: {
    maxAttempts: 3,
    lockoutDuration: 60 * 60, // 1 hour
    progressiveLockout: true,
    resetSuccessfulLogin: false
  }
} as const satisfies Record<string, LockoutConfig>;

/**
 * CSRF protection configurations
 */
export const CSRF_CONFIGS = {
  // Standard web form protection
  forms: {
    cookieName: '__Host-csrf-token',
    headerName: 'x-csrf-token',
    excludePaths: ['/api/auth', '/api/health', '/api/csrf'],
    excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
    secure: isProduction,
    sameSite: 'strict' as const
  },

  // API endpoint protection
  api: {
    cookieName: '__Host-api-csrf-token',
    headerName: 'x-api-csrf-token',
    excludePaths: [
      '/api/auth',
      '/api/health',
      '/api/csrf',
      '/api/crm/leads/create-lead-from-web' // External API
    ],
    excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
    secure: isProduction,
    sameSite: 'strict' as const
  }
} as const satisfies Record<string, CSRFConfig>;

/**
 * Security headers configurations
 */
export const SECURITY_HEADERS_CONFIGS = {
  // Strict configuration for admin pages
  admin: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      isDevelopment ? "" : "upgrade-insecure-requests"
    ].filter(Boolean).join('; '),
    xFrameOptions: 'DENY',
    referrerPolicy: 'no-referrer',
    crossOriginResourcePolicy: 'same-origin'
  },

  // API endpoints configuration
  api: {
    contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none';",
    xFrameOptions: 'DENY',
    crossOriginResourcePolicy: 'cross-origin',
    referrerPolicy: 'no-referrer'
  },

  // Public pages configuration
  public: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Relaxed for Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      isDevelopment ? "" : "upgrade-insecure-requests"
    ].filter(Boolean).join('; '),
    xFrameOptions: 'SAMEORIGIN',
    referrerPolicy: 'strict-origin-when-cross-origin'
  }
} as const satisfies Record<string, SecurityHeadersConfig>;

/**
 * Input validation configurations
 */
export const INPUT_VALIDATION_CONFIG = {
  // Maximum lengths for different field types
  maxLengths: {
    name: 100,
    email: 255,
    phone: 20,
    address: 500,
    description: 2000,
    notes: 5000,
    url: 2048,
    token: 500
  },

  // Allowed file types for uploads
  allowedFileTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'text/plain', 'application/msword'],
    exports: ['text/csv', 'application/json', 'application/xml']
  },

  // Maximum file sizes (in bytes)
  maxFileSizes: {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    export: 50 * 1024 * 1024 // 50MB
  }
} as const;

/**
 * Security monitoring configuration
 */
export const MONITORING_CONFIG = {
  // Alert thresholds
  alertThresholds: {
    failedLoginsPerHour: 20,
    rateLimitViolationsPerHour: 100,
    suspiciousActivityPerHour: 10,
    accountLockoutsPerHour: 5
  },

  // Log retention periods (in days)
  logRetention: {
    securityEvents: 90,
    authenticationLogs: 180,
    accessLogs: 30,
    errorLogs: 30
  },

  // Security event priorities
  eventPriorities: {
    account_lockout: 'HIGH',
    privilege_escalation: 'CRITICAL',
    unauthorized_access_attempt: 'HIGH',
    suspicious_header_detected: 'MEDIUM',
    rate_limit_exceeded: 'LOW'
  }
} as const;

/**
 * Environment-specific security settings
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    enableSecurityHeaders: false,
    enableCSRFProtection: false,
    enableAccountLockout: false,
    logLevel: 'debug',
    rateLimitMultiplier: 10 // More lenient in development
  },

  staging: {
    enableSecurityHeaders: true,
    enableCSRFProtection: true,
    enableAccountLockout: true,
    logLevel: 'info',
    rateLimitMultiplier: 2 // Slightly more lenient in staging
  },

  production: {
    enableSecurityHeaders: true,
    enableCSRFProtection: true,
    enableAccountLockout: true,
    logLevel: 'warn',
    rateLimitMultiplier: 1 // Standard limits in production
  }
} as const;

/**
 * Get current environment configuration
 */
export function getCurrentEnvironmentConfig() {
  const env = process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIG;
  return ENVIRONMENT_CONFIG[env] || ENVIRONMENT_CONFIG.production;
}

/**
 * Get rate limit configuration with environment adjustments
 */
export function getRateLimitConfig(type: keyof typeof ENHANCED_RATE_LIMITS): RateLimitConfig {
  const baseConfig = ENHANCED_RATE_LIMITS[type];
  const envConfig = getCurrentEnvironmentConfig();
  
  return {
    ...baseConfig,
    maxAttempts: Math.floor(baseConfig.maxAttempts * envConfig.rateLimitMultiplier)
  };
}

/**
 * Check if security feature is enabled in current environment
 */
export function isSecurityFeatureEnabled(feature: keyof typeof ENVIRONMENT_CONFIG['production']): boolean {
  const envConfig = getCurrentEnvironmentConfig();
  return envConfig[feature] as boolean;
}

/**
 * Security configuration validation
 */
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'NEXTAUTH_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check Redis configuration in production
  if (isProduction && !process.env.REDIS_URL && !process.env.AZURE_REDIS_URL) {
    errors.push('Redis URL required for production rate limiting');
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Initialize security configuration
 * Call this on application startup
 */
export function initializeSecurityConfig(): void {
  const validation = validateSecurityConfig();
  
  if (!validation.valid) {
    console.error('[SECURITY_CONFIG] Configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction) {
      throw new Error('Security configuration validation failed in production');
    }
  }

  console.log(`[SECURITY_CONFIG] Initialized for ${process.env.NODE_ENV} environment`);
  console.log(`[SECURITY_CONFIG] Security features enabled:`, {
    securityHeaders: isSecurityFeatureEnabled('enableSecurityHeaders'),
    csrfProtection: isSecurityFeatureEnabled('enableCSRFProtection'),
    accountLockout: isSecurityFeatureEnabled('enableAccountLockout')
  });
}