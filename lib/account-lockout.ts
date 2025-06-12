/**
 * Account Lockout Protection
 * Implements progressive account lockout to prevent brute force attacks
 * 
 * SECURITY: Addresses OWASP A07:2021 - Identification and Authentication Failures
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */

import { NextRequest } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security-logger';
import Redis from 'ioredis';

export interface LockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // in seconds
  progressiveLockout: boolean;
  resetSuccessfulLogin: boolean;
}

export interface LockoutResult {
  isLocked: boolean;
  attemptsRemaining?: number;
  lockoutExpiresAt?: Date;
  nextLockoutDuration?: number;
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60, // 15 minutes
  progressiveLockout: true,
  resetSuccessfulLogin: true
};

/**
 * Account Lockout Manager
 */
export class AccountLockoutManager {
  private redis: Redis | null = null;
  private fallbackStore = new Map<string, {
    attempts: number;
    lockedUntil?: Date;
    lockoutCount: number;
    lastAttempt: Date;
  }>();

  constructor() {
    this.initializeRedis();
    
    // Cleanup fallback store every 10 minutes
    setInterval(() => {
      this.cleanupFallbackStore();
    }, 10 * 60 * 1000);
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
          console.error('[ACCOUNT_LOCKOUT] Redis connection error:', error);
          this.redis = null;
        });
      }
    } catch (error) {
      console.error('[ACCOUNT_LOCKOUT] Failed to initialize Redis:', error);
    }
  }

  /**
   * Check if account is currently locked
   */
  async isAccountLocked(
    identifier: string, 
    config: LockoutConfig = DEFAULT_CONFIG
  ): Promise<LockoutResult> {
    try {
      if (this.redis) {
        return await this.checkLockoutWithRedis(identifier, config);
      } else {
        return this.checkLockoutWithFallback(identifier, config);
      }
    } catch (error) {
      console.error('[ACCOUNT_LOCKOUT] Error checking lockout status:', error);
      // Fail open - assume not locked but log the error
      return { isLocked: false };
    }
  }

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(
    identifier: string,
    req: NextRequest,
    config: LockoutConfig = DEFAULT_CONFIG
  ): Promise<LockoutResult> {
    try {
      const result = this.redis
        ? await this.recordFailedAttemptWithRedis(identifier, config)
        : this.recordFailedAttemptWithFallback(identifier, config);

      // Log security event
      logSecurityEvent('authn_fail', {
        identifier,
        attempts: config.maxAttempts - (result.attemptsRemaining || 0),
        maxAttempts: config.maxAttempts,
        isLocked: result.isLocked,
        lockoutExpiresAt: result.lockoutExpiresAt?.toISOString()
      }, req);

      // Log account lockout event
      if (result.isLocked) {
        logSecurityEvent('account_lockout', {
          identifier,
          lockoutDuration: config.lockoutDuration,
          lockoutExpiresAt: result.lockoutExpiresAt?.toISOString(),
          reason: 'excessive_failed_attempts'
        }, req);
      }

      return result;
    } catch (error) {
      console.error('[ACCOUNT_LOCKOUT] Error recording failed attempt:', error);
      return { isLocked: false };
    }
  }

  /**
   * Record successful login (resets attempts)
   */
  async recordSuccessfulLogin(
    identifier: string,
    config: LockoutConfig = DEFAULT_CONFIG
  ): Promise<void> {
    if (!config.resetSuccessfulLogin) return;

    try {
      if (this.redis) {
        await this.redis.del(`lockout:${identifier}`);
      } else {
        this.fallbackStore.delete(identifier);
      }
    } catch (error) {
      console.error('[ACCOUNT_LOCKOUT] Error resetting attempts:', error);
    }
  }

  /**
   * Manually unlock account (admin function)
   */
  async unlockAccount(identifier: string, adminUserId: string, req: NextRequest): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(`lockout:${identifier}`);
      } else {
        this.fallbackStore.delete(identifier);
      }

      logSecurityEvent('account_lockout', {
        identifier,
        action: 'manual_unlock',
        adminUserId,
        reason: 'administrative_action'
      }, req);
    } catch (error) {
      console.error('[ACCOUNT_LOCKOUT] Error unlocking account:', error);
    }
  }

  /**
   * Redis-based lockout checking
   */
  private async checkLockoutWithRedis(
    identifier: string,
    config: LockoutConfig
  ): Promise<LockoutResult> {
    const key = `lockout:${identifier}`;
    const data = await this.redis!.hmget(key, 'attempts', 'lockedUntil', 'lockoutCount');
    
    const attempts = parseInt(data[0] || '0');
    const lockedUntil = data[1] ? new Date(data[1]) : null;
    const lockoutCount = parseInt(data[2] || '0');

    // Check if currently locked
    if (lockedUntil && lockedUntil > new Date()) {
      return {
        isLocked: true,
        lockoutExpiresAt: lockedUntil,
        attemptsRemaining: 0
      };
    }

    // If lockout has expired, reset attempts
    if (lockedUntil && lockedUntil <= new Date()) {
      await this.redis!.hdel(key, 'attempts', 'lockedUntil');
      return { isLocked: false, attemptsRemaining: config.maxAttempts };
    }

    return {
      isLocked: false,
      attemptsRemaining: Math.max(0, config.maxAttempts - attempts)
    };
  }

  /**
   * Fallback in-memory lockout checking
   */
  private checkLockoutWithFallback(
    identifier: string,
    config: LockoutConfig
  ): LockoutResult {
    const record = this.fallbackStore.get(identifier);
    
    if (!record) {
      return { isLocked: false, attemptsRemaining: config.maxAttempts };
    }

    // Check if currently locked
    if (record.lockedUntil && record.lockedUntil > new Date()) {
      return {
        isLocked: true,
        lockoutExpiresAt: record.lockedUntil,
        attemptsRemaining: 0
      };
    }

    // If lockout has expired, reset attempts
    if (record.lockedUntil && record.lockedUntil <= new Date()) {
      record.attempts = 0;
      record.lockedUntil = undefined;
    }

    return {
      isLocked: false,
      attemptsRemaining: Math.max(0, config.maxAttempts - record.attempts)
    };
  }

  /**
   * Redis-based failed attempt recording
   */
  private async recordFailedAttemptWithRedis(
    identifier: string,
    config: LockoutConfig
  ): Promise<LockoutResult> {
    const key = `lockout:${identifier}`;
    const pipeline = this.redis!.pipeline();
    
    pipeline.hincrby(key, 'attempts', 1);
    pipeline.hget(key, 'lockoutCount');
    pipeline.expire(key, 24 * 60 * 60); // Keep for 24 hours
    
    const results = await pipeline.exec();
    const attempts = results?.[0]?.[1] as number || 1;
    const lockoutCount = parseInt(results?.[1]?.[1] as string || '0');

    if (attempts >= config.maxAttempts) {
      // Calculate lockout duration with progressive increase
      let lockoutDuration = config.lockoutDuration;
      if (config.progressiveLockout) {
        // Exponential backoff: 15min, 30min, 1hr, 2hr, 4hr, max 24hr
        lockoutDuration = Math.min(
          config.lockoutDuration * Math.pow(2, lockoutCount),
          24 * 60 * 60
        );
      }

      const lockoutExpiresAt = new Date(Date.now() + lockoutDuration * 1000);
      
      await this.redis!.hmset(key, {
        'lockedUntil': lockoutExpiresAt.toISOString(),
        'lockoutCount': lockoutCount + 1,
        'attempts': 0 // Reset attempts after locking
      });

      return {
        isLocked: true,
        lockoutExpiresAt,
        attemptsRemaining: 0,
        nextLockoutDuration: lockoutDuration
      };
    }

    return {
      isLocked: false,
      attemptsRemaining: config.maxAttempts - attempts
    };
  }

  /**
   * Fallback in-memory failed attempt recording
   */
  private recordFailedAttemptWithFallback(
    identifier: string,
    config: LockoutConfig
  ): LockoutResult {
    const now = new Date();
    let record = this.fallbackStore.get(identifier);

    if (!record) {
      record = {
        attempts: 0,
        lockoutCount: 0,
        lastAttempt: now
      };
      this.fallbackStore.set(identifier, record);
    }

    record.attempts++;
    record.lastAttempt = now;

    if (record.attempts >= config.maxAttempts) {
      // Calculate lockout duration
      let lockoutDuration = config.lockoutDuration;
      if (config.progressiveLockout) {
        lockoutDuration = Math.min(
          config.lockoutDuration * Math.pow(2, record.lockoutCount),
          24 * 60 * 60
        );
      }

      record.lockedUntil = new Date(Date.now() + lockoutDuration * 1000);
      record.lockoutCount++;
      record.attempts = 0; // Reset attempts after locking

      return {
        isLocked: true,
        lockoutExpiresAt: record.lockedUntil,
        attemptsRemaining: 0,
        nextLockoutDuration: lockoutDuration
      };
    }

    return {
      isLocked: false,
      attemptsRemaining: config.maxAttempts - record.attempts
    };
  }

  /**
   * Clean up expired entries from fallback store
   */
  private cleanupFallbackStore(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [key, record] of this.fallbackStore.entries()) {
      // Remove old records that are unlocked and haven't had attempts recently
      if ((!record.lockedUntil || record.lockedUntil < now) && 
          record.lastAttempt < oneDayAgo) {
        this.fallbackStore.delete(key);
      }
    }
  }

  /**
   * Get lockout statistics for monitoring
   */
  async getLockoutStats(): Promise<{
    totalLocked: number;
    recentLockouts: number;
    averageLockoutDuration: number;
  }> {
    // This would be implemented based on storage backend
    // For now, return basic stats from fallback store
    const locked = Array.from(this.fallbackStore.values())
      .filter(record => record.lockedUntil && record.lockedUntil > new Date());

    return {
      totalLocked: locked.length,
      recentLockouts: locked.filter(record => 
        record.lockedUntil && 
        (Date.now() - record.lockedUntil.getTime()) < 60 * 60 * 1000
      ).length,
      averageLockoutDuration: 15 * 60 // Placeholder
    };
  }
}

// Global instance
export const accountLockoutManager = new AccountLockoutManager();

/**
 * Middleware wrapper for authentication endpoints with lockout protection
 */
export function withAccountLockoutProtection<T extends any[], R>(
  handler: (...args: T) => Promise<any>,
  config: LockoutConfig = DEFAULT_CONFIG
) {
  return async (...args: T): Promise<any> => {
    const req = args[0] as NextRequest;
    
    try {
      // For user authentication, get identifier from request body
      const body = await req.clone().json().catch(() => ({}));
      const identifier = body.email || body.username || 'unknown';

      // Check if account is locked
      const lockoutResult = await accountLockoutManager.isAccountLocked(identifier, config);
      
      if (lockoutResult.isLocked) {
        logSecurityEvent('authn_fail', {
          identifier,
          reason: 'account_locked',
          lockoutExpiresAt: lockoutResult.lockoutExpiresAt?.toISOString()
        }, req);

        return {
          error: 'Account temporarily locked due to multiple failed attempts',
          lockedUntil: lockoutResult.lockoutExpiresAt?.toISOString(),
          retryAfter: lockoutResult.lockoutExpiresAt ? 
            Math.ceil((lockoutResult.lockoutExpiresAt.getTime() - Date.now()) / 1000) : 
            undefined
        };
      }

      // Process the original handler
      const result = await handler(...args);

      // If authentication was successful, reset lockout
      if (result && !result.error) {
        await accountLockoutManager.recordSuccessfulLogin(identifier, config);
      } else if (result && result.error) {
        // If authentication failed, record the attempt
        await accountLockoutManager.recordFailedAttempt(identifier, req, config);
      }

      return result;
    } catch (error) {
      console.error('[ACCOUNT_LOCKOUT] Error in middleware:', error);
      return await handler(...args); // Continue with original handler
    }
  };
}