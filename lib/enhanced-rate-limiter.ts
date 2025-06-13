/**
 * Enhanced Distributed Rate Limiter with Redis Support
 * Implements progressive penalties and better fingerprinting
 * 
 * SECURITY: Addresses critical rate limiting vulnerabilities
 * - Persistent storage with Redis
 * - Progressive penalties for repeat offenders
 * - Enhanced fingerprinting to prevent bypass
 * - User-aware rate limiting
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/security-logger';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  progressivePenalty?: boolean;
  userAware?: boolean;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Enhanced Rate Limiter with distributed storage and progressive penalties
 */
export class EnhancedRateLimiter {
  private redis: Redis | null = null;
  private fallbackStore = new Map<string, {
    count: number;
    resetTime: number;
    violations: number;
    firstViolation: number;
  }>();

  constructor() {
    this.initializeRedis();
    
    // Cleanup fallback store every 5 minutes
    setInterval(() => {
      this.cleanupFallbackStore();
    }, 5 * 60 * 1000);
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('error', (error) => {
          console.error('[RATE_LIMITER] Redis connection error:', error);
          // Fall back to in-memory storage
          this.redis = null;
        });
      }
    } catch (error) {
      console.error('[RATE_LIMITER] Failed to initialize Redis:', error);
    }
  }

  /**
   * Generate enhanced fingerprint for better uniqueness
   */
  private generateFingerprint(req: NextRequest, user?: any): string {
    if (user) {
      return `user:${user.id}`;
    }

    const ip = this.extractIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const acceptLanguage = req.headers.get('accept-language') || '';
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    
    // Create a more robust fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`)
      .digest('hex')
      .substring(0, 16);

    return `anonymous:${fingerprint}`;
  }

  /**
   * Extract real IP address with proper header checking
   */
  private extractIP(req: NextRequest): string {
    // Try multiple headers in order of preference
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      // Take first IP from comma-separated list
      const firstIP = forwarded.split(',')[0].trim();
      if (this.isValidIP(firstIP)) {
        return firstIP;
      }
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP && this.isValidIP(realIP)) {
      return realIP;
    }

    return req.ip || 'unknown';
  }

  /**
   * Basic IP validation to prevent header manipulation
   */
  private isValidIP(ip: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  }

  /**
   * Check rate limit with Redis or fallback storage
   */
  async checkRateLimit(
    req: NextRequest,
    config: RateLimitConfig,
    user?: any
  ): Promise<RateLimitResult> {
    const identifier = this.generateFingerprint(req, user);
    const key = `rate_limit:${identifier}:${req.nextUrl.pathname}`;
    const violationKey = `violations:${identifier}`;

    try {
      if (this.redis) {
        return await this.checkWithRedis(key, violationKey, config, identifier, req);
      } else {
        return this.checkWithFallback(key, violationKey, config, identifier, req);
      }
    } catch (error) {
      console.error('[RATE_LIMITER] Error checking rate limit:', error);
      // Fail open - allow request but log the error
      return {
        allowed: true,
        limit: config.maxAttempts,
        remaining: config.maxAttempts - 1,
        resetTime: Date.now() + config.windowMs
      };
    }
  }

  /**
   * Redis-based rate limiting
   */
  private async checkWithRedis(
    key: string,
    violationKey: string,
    config: RateLimitConfig,
    identifier: string,
    req: NextRequest
  ): Promise<RateLimitResult> {
    const pipeline = this.redis!.pipeline();
    
    // Get current count and increment
    pipeline.incr(key);
    pipeline.ttl(key);
    
    // Get violation count for progressive penalties
    if (config.progressivePenalty) {
      pipeline.get(violationKey);
    }
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    const [countResult, ttlResult, violationResult] = results;
    const count = countResult?.[1] as number || 0;
    const ttl = ttlResult?.[1] as number || -1;
    const violations = violationResult ? parseInt(violationResult[1] as string || '0') : 0;

    // Set expiration on first request
    if (ttl === -1) {
      await this.redis!.expire(key, Math.ceil(config.windowMs / 1000));
    }

    const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs);
    
    // Apply progressive penalty
    let effectiveLimit = config.maxAttempts;
    let retryAfter: number | undefined;

    if (config.progressivePenalty && violations > 0) {
      // Reduce limit based on violations: each violation reduces limit by 20%
      effectiveLimit = Math.max(1, Math.floor(config.maxAttempts * Math.pow(0.8, violations)));
      
      // Add exponential backoff: 2^violations minutes, max 60 minutes
      if (count > effectiveLimit) {
        retryAfter = Math.min(Math.pow(2, violations) * 60, 3600);
      }
    }

    const allowed = count <= effectiveLimit;
    const remaining = Math.max(0, effectiveLimit - count);

    // Track violations for progressive penalties
    if (!allowed && config.progressivePenalty) {
      await this.redis!.setex(violationKey, 24 * 60 * 60, violations + 1); // 24 hours
      
      logSecurityEvent('rate_limit_exceeded', {
        identifier,
        endpoint: req.nextUrl.pathname,
        attempts: count,
        limit: effectiveLimit,
        violations: violations + 1,
        windowMs: config.windowMs
      }, req);
    }

    return {
      allowed,
      limit: effectiveLimit,
      remaining,
      resetTime,
      retryAfter
    };
  }

  /**
   * Fallback in-memory rate limiting
   */
  private checkWithFallback(
    key: string,
    violationKey: string,
    config: RateLimitConfig,
    identifier: string,
    req: NextRequest
  ): RateLimitResult {
    const now = Date.now();
    const record = this.fallbackStore.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      const newRecord = {
        count: 1,
        resetTime: now + config.windowMs,
        violations: record?.violations || 0,
        firstViolation: record?.firstViolation || 0
      };
      this.fallbackStore.set(key, newRecord);

      return {
        allowed: true,
        limit: config.maxAttempts,
        remaining: config.maxAttempts - 1,
        resetTime: newRecord.resetTime
      };
    }

    record.count++;

    // Apply progressive penalty
    let effectiveLimit = config.maxAttempts;
    let retryAfter: number | undefined;

    if (config.progressivePenalty && record.violations > 0) {
      effectiveLimit = Math.max(1, Math.floor(config.maxAttempts * Math.pow(0.8, record.violations)));
      
      if (record.count > effectiveLimit) {
        retryAfter = Math.min(Math.pow(2, record.violations) * 60, 3600);
      }
    }

    const allowed = record.count <= effectiveLimit;
    const remaining = Math.max(0, effectiveLimit - record.count);

    // Track violations
    if (!allowed && config.progressivePenalty) {
      record.violations++;
      record.firstViolation = record.firstViolation || now;

      logSecurityEvent('rate_limit_exceeded', {
        identifier,
        endpoint: req.nextUrl.pathname,
        attempts: record.count,
        limit: effectiveLimit,
        violations: record.violations,
        windowMs: config.windowMs
      }, req);
    }

    return {
      allowed,
      limit: effectiveLimit,
      remaining,
      resetTime: record.resetTime,
      retryAfter
    };
  }

  /**
   * Clean up expired entries from fallback store
   */
  private cleanupFallbackStore(): void {
    const now = Date.now();
    for (const [key, record] of this.fallbackStore.entries()) {
      if (now > record.resetTime + 86400000) { // Keep for 24 hours for violation tracking
        this.fallbackStore.delete(key);
      }
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    req: NextRequest,
    config: RateLimitConfig,
    user?: any
  ): Promise<RateLimitResult> {
    const identifier = this.generateFingerprint(req, user);
    const key = `rate_limit:${identifier}:${req.nextUrl.pathname}`;

    try {
      if (this.redis) {
        const count = await this.redis.get(key);
        const ttl = await this.redis.ttl(key);
        
        return {
          allowed: (parseInt(count || '0')) < config.maxAttempts,
          limit: config.maxAttempts,
          remaining: Math.max(0, config.maxAttempts - parseInt(count || '0')),
          resetTime: Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs)
        };
      } else {
        const record = this.fallbackStore.get(key);
        return {
          allowed: !record || record.count < config.maxAttempts,
          limit: config.maxAttempts,
          remaining: Math.max(0, config.maxAttempts - (record?.count || 0)),
          resetTime: record?.resetTime || Date.now() + config.windowMs
        };
      }
    } catch (error) {
      console.error('[RATE_LIMITER] Error getting rate limit status:', error);
      return {
        allowed: true,
        limit: config.maxAttempts,
        remaining: config.maxAttempts,
        resetTime: Date.now() + config.windowMs
      };
    }
  }
}

// Global instance
export const enhancedRateLimiter = new EnhancedRateLimiter();

/**
 * Enhanced rate limiting middleware with progressive penalties
 */
export function withEnhancedRateLimit<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | R>,
  config: RateLimitConfig = { maxAttempts: 15, windowMs: 60000, progressivePenalty: true }
) {
  return async (...args: T): Promise<NextResponse> => {
    const req = args[0] as NextRequest;
    
    try {
      // Extract user if available (this would need integration with auth system)
      const user = undefined; // TODO: Extract from session/token
      
      const result = await enhancedRateLimiter.checkRateLimit(req, config, user);
      
      if (!result.allowed) {
        const response = NextResponse.json(
          { 
            error: 'Too many requests',
            retryAfter: result.retryAfter 
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        
        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString());
        }
        
        return response;
      }
      
      // Process the request
      const handlerResult = await handler(...args);
      const response = handlerResult instanceof NextResponse 
        ? handlerResult 
        : NextResponse.json(handlerResult);
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      
      return response;
      
    } catch (error) {
      console.error('[ENHANCED_RATE_LIMITER] Error in middleware:', error);
      
      // Fail open - continue with request but log error
      const handlerResult = await handler(...args);
      return handlerResult instanceof NextResponse 
        ? handlerResult 
        : NextResponse.json(handlerResult);
    }
  };
}

/**
 * Enhanced rate limit configurations with tiered user limits
 */
export const RATE_LIMIT_CONFIGS = {
  authentication: {
    basic: {
      maxAttempts: 5,
      windowMs: 3600000, // 1 hour
      progressivePenalty: true,
      userAware: false
    },
    premium: {
      maxAttempts: 15,
      windowMs: 3600000, // 1 hour
      progressivePenalty: false, // Reduced penalty for premium users
      userAware: false
    }
  },
  search: {
    authenticated: {
      maxAttempts: 50,
      windowMs: 60000, // 1 minute
      progressivePenalty: false,
      userAware: true,
      skipSuccessfulRequests: true,
      burstAllowance: 10 // Allow burst requests
    },
    anonymous: {
      maxAttempts: 15,
      windowMs: 60000, // 1 minute
      progressivePenalty: true,
      userAware: false,
      burstAllowance: 3
    }
  },
  reports: {
    concurrent: 2, // Max concurrent reports per user
    maxAttempts: 10,
    windowMs: 3600000, // 1 hour
    progressivePenalty: true,
    userAware: true,
    queueDepth: 5
  },
  crud: {
    read: {
      maxAttempts: 100,
      windowMs: 60000, // 1 minute
      progressivePenalty: false,
      userAware: true
    },
    write: {
      maxAttempts: 20,
      windowMs: 60000, // 1 minute
      progressivePenalty: true,
      userAware: true
    },
    delete: {
      maxAttempts: 5,
      windowMs: 60000, // 1 minute
      progressivePenalty: true, // Strict penalty for deletions
      userAware: true
    }
  },
  admin: {
    maxAttempts: 10,
    windowMs: 60000, // 1 minute
    progressivePenalty: true,
    userAware: true
  },
  public: {
    maxAttempts: 15,
    windowMs: 60000, // 1 minute
    progressivePenalty: true,
    userAware: false
  }
} as const;

/**
 * User role types for tiered rate limiting
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM = 'premium',
  BASIC = 'basic'
}

/**
 * Enhanced rate limiting with user role support
 */
export interface EnhancedRateLimitConfig extends RateLimitConfig {
  burstAllowance?: number;
  concurrent?: number;
  queueDepth?: number;
}

/**
 * Get appropriate rate limit config based on user role and operation type
 */
export function getRateLimitConfig(
  operation: string,
  userRole?: UserRole,
  isAuthenticated = false
): EnhancedRateLimitConfig {
  switch (operation) {
    case 'authentication':
      return userRole === UserRole.PREMIUM || userRole === UserRole.ADMIN
        ? RATE_LIMIT_CONFIGS.authentication.premium
        : RATE_LIMIT_CONFIGS.authentication.basic;
    
    case 'search':
      return isAuthenticated
        ? RATE_LIMIT_CONFIGS.search.authenticated
        : RATE_LIMIT_CONFIGS.search.anonymous;
    
    case 'reports':
      return RATE_LIMIT_CONFIGS.reports;
    
    case 'crud_read':
      return RATE_LIMIT_CONFIGS.crud.read;
    
    case 'crud_write':
      return RATE_LIMIT_CONFIGS.crud.write;
    
    case 'crud_delete':
      return RATE_LIMIT_CONFIGS.crud.delete;
    
    case 'admin':
      return RATE_LIMIT_CONFIGS.admin;
    
    default:
      return RATE_LIMIT_CONFIGS.public;
  }
}