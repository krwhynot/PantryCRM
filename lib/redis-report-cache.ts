/**
 * Advanced Redis-based report caching with hot/warm/cold tiers
 * Optimized for PantryCRM's Azure B1 environment
 * 
 * Features:
 * - Multi-tier caching (hot/warm/cold)
 * - Intelligent cache promotion
 * - Cache stampede prevention
 * - Memory-efficient compression
 * - Atomic operations for consistency
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import { compress, decompress } from 'lz-string';

export interface ReportMetadata {
  reportId: string;
  reportType: string;
  parameters: Record<string, any>;
  userId: string;
  organizationId?: string;
  size: number;
  generatedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CachedReport {
  data: any;
  metadata: ReportMetadata;
  source: 'hot' | 'warm' | 'cold';
  compressed: boolean;
}

export interface ReportCacheResult {
  hit: boolean;
  data?: any;
  source?: 'hot' | 'warm' | 'cold';
  generatedAt?: number;
  fromCache: boolean;
}

/**
 * Advanced multi-tier Redis report caching system
 */
export class RedisReportCache {
  private redis: Redis | null = null;
  private fallbackCache = new Map<string, any>();

  // Cache tier TTLs (in seconds)
  private readonly HOT_TTL = 300;    // 5 minutes
  private readonly WARM_TTL = 3600;  // 1 hour  
  private readonly COLD_TTL = 86400; // 24 hours

  // Size limits for Azure B1 optimization
  private readonly MAX_REPORT_SIZE = 5 * 1024 * 1024; // 5MB compressed
  private readonly COMPRESSION_THRESHOLD = 1024; // Compress if > 1KB

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          // Optimized for Azure B1 constraints
          keepAlive: 30000,
          family: 4, // IPv4 only
        });

        this.redis.on('error', (error) => {
          console.error('[REPORT_CACHE] Redis connection error:', error);
          this.redis = null;
        });
      }
    } catch (error) {
      console.error('[REPORT_CACHE] Failed to initialize Redis:', error);
    }
  }

  /**
   * Generate consistent cache key for reports
   */
  private generateReportKey(reportType: string, parameters: Record<string, any>, userId: string): string {
    const paramString = JSON.stringify(parameters, Object.keys(parameters).sort());
    const hash = crypto.createHash('sha256').update(`${reportType}:${paramString}:${userId}`).digest('hex');
    return hash.substring(0, 16);
  }

  /**
   * Cache report with intelligent tier placement
   */
  async cacheReport(
    reportType: string,
    parameters: Record<string, any>,
    data: any,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    const reportId = this.generateReportKey(reportType, parameters, userId);
    const serializedData = JSON.stringify(data);
    const dataSize = Buffer.byteLength(serializedData, 'utf8');

    // Skip caching if too large
    if (dataSize > this.MAX_REPORT_SIZE) {
      console.warn(`[REPORT_CACHE] Report ${reportId} too large for caching: ${dataSize} bytes`);
      return;
    }

    const metadata: ReportMetadata = {
      reportId,
      reportType,
      parameters,
      userId,
      organizationId,
      size: dataSize,
      generatedAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    };

    try {
      if (this.redis) {
        await this.cacheToRedis(reportId, data, metadata);
      } else {
        await this.cacheToFallback(reportId, data, metadata);
      }
    } catch (error) {
      console.error('[REPORT_CACHE] Error caching report:', error);
    }
  }

  /**
   * Cache to Redis with multi-tier strategy
   */
  private async cacheToRedis(reportId: string, data: any, metadata: ReportMetadata): Promise<void> {
    const pipeline = this.redis!.pipeline();
    
    let serializedData = JSON.stringify(data);
    let compressed = false;

    // Compress if data is large enough
    if (serializedData.length > this.COMPRESSION_THRESHOLD) {
      serializedData = compress(serializedData);
      compressed = true;
    }

    // Hot cache for frequently accessed reports (5 min)
    pipeline.setex(`report:hot:${reportId}`, this.HOT_TTL, serializedData);
    
    // Warm cache for periodic reports (1 hour)
    pipeline.setex(`report:warm:${reportId}`, this.WARM_TTL, serializedData);
    
    // Cold cache for historical reports (24 hours)
    pipeline.setex(`report:cold:${reportId}`, this.COLD_TTL, serializedData);
    
    // Metadata cache with enhanced information
    pipeline.hset(`report:meta:${reportId}`, {
      reportType: metadata.reportType,
      userId: metadata.userId,
      organizationId: metadata.organizationId || '',
      size: metadata.size,
      generatedAt: metadata.generatedAt,
      parameters: JSON.stringify(metadata.parameters),
      compressed: compressed ? '1' : '0',
      accessCount: 0,
      lastAccessed: metadata.lastAccessed
    });

    // Set metadata TTL to match cold cache
    pipeline.expire(`report:meta:${reportId}`, this.COLD_TTL);

    await pipeline.exec();
  }

  /**
   * Fallback in-memory caching
   */
  private async cacheToFallback(reportId: string, data: any, metadata: ReportMetadata): Promise<void> {
    this.fallbackCache.set(reportId, {
      data,
      metadata,
      timestamp: Date.now()
    });

    // Limit fallback cache size for Azure B1
    if (this.fallbackCache.size > 50) {
      const oldestKey = this.fallbackCache.keys().next().value;
      this.fallbackCache.delete(oldestKey);
    }
  }

  /**
   * Retrieve report with intelligent tier fallback and promotion
   */
  async getReport(
    reportType: string,
    parameters: Record<string, any>,
    userId: string
  ): Promise<ReportCacheResult> {
    const reportId = this.generateReportKey(reportType, parameters, userId);

    try {
      if (this.redis) {
        return await this.getFromRedis(reportId);
      } else {
        return await this.getFromFallback(reportId);
      }
    } catch (error) {
      console.error('[REPORT_CACHE] Error retrieving report:', error);
      return { hit: false, fromCache: false };
    }
  }

  /**
   * Redis retrieval with tier fallback and promotion
   */
  private async getFromRedis(reportId: string): Promise<ReportCacheResult> {
    // Try hot cache first
    let cached = await this.redis!.get(`report:hot:${reportId}`);
    if (cached) {
      await this.incrementAccessCount(reportId);
      const data = await this.deserializeData(cached, reportId);
      return {
        hit: true,
        data,
        source: 'hot',
        fromCache: true
      };
    }

    // Try warm cache
    cached = await this.redis!.get(`report:warm:${reportId}`);
    if (cached) {
      // Promote to hot cache
      await this.redis!.setex(`report:hot:${reportId}`, this.HOT_TTL, cached);
      await this.incrementAccessCount(reportId);
      const data = await this.deserializeData(cached, reportId);
      return {
        hit: true,
        data,
        source: 'warm',
        fromCache: true
      };
    }

    // Try cold cache
    cached = await this.redis!.get(`report:cold:${reportId}`);
    if (cached) {
      await this.incrementAccessCount(reportId);
      const data = await this.deserializeData(cached, reportId);
      return {
        hit: true,
        data,
        source: 'cold',
        fromCache: true
      };
    }

    return { hit: false, fromCache: false };
  }

  /**
   * Fallback cache retrieval
   */
  private async getFromFallback(reportId: string): Promise<ReportCacheResult> {
    const entry = this.fallbackCache.get(reportId);
    if (entry && (Date.now() - entry.timestamp) < this.WARM_TTL * 1000) {
      return {
        hit: true,
        data: entry.data,
        source: 'warm',
        fromCache: true
      };
    }

    return { hit: false, fromCache: false };
  }

  /**
   * Deserialize data with compression support
   */
  private async deserializeData(serializedData: string, reportId: string): Promise<any> {
    try {
      // Check if data is compressed
      const metadata = await this.redis!.hgetall(`report:meta:${reportId}`);
      const isCompressed = metadata.compressed === '1';

      if (isCompressed) {
        const decompressed = decompress(serializedData);
        return JSON.parse(decompressed);
      } else {
        return JSON.parse(serializedData);
      }
    } catch (error) {
      console.error('[REPORT_CACHE] Error deserializing data:', error);
      throw error;
    }
  }

  /**
   * Increment access count for cache analytics
   */
  private async incrementAccessCount(reportId: string): Promise<void> {
    if (this.redis) {
      const pipeline = this.redis.pipeline();
      pipeline.hincrby(`report:meta:${reportId}`, 'accessCount', 1);
      pipeline.hset(`report:meta:${reportId}`, 'lastAccessed', Date.now());
      await pipeline.exec();
    }
  }

  /**
   * Cache stampede prevention with Redis locks
   */
  async generateWithLock<T>(
    reportType: string,
    parameters: Record<string, any>,
    userId: string,
    generator: () => Promise<T>,
    lockTimeoutMs = 30000
  ): Promise<T> {
    const reportId = this.generateReportKey(reportType, parameters, userId);
    const lockKey = `lock:report:${reportId}`;
    
    if (!this.redis) {
      // Fallback: execute without lock
      return await generator();
    }

    // Try to acquire lock
    const acquired = await this.redis.set(lockKey, '1', 'EX', Math.ceil(lockTimeoutMs / 1000), 'NX');
    
    if (!acquired) {
      // Wait for lock holder to complete, then try cache
      await this.waitForReportGeneration(reportId, lockTimeoutMs);
      const cached = await this.getReport(reportType, parameters, userId);
      if (cached.hit) {
        return cached.data;
      }
      // If still no cache, execute generator
    }

    try {
      const data = await generator();
      await this.cacheReport(reportType, parameters, data, userId);
      return data;
    } finally {
      if (acquired) {
        await this.redis.del(lockKey);
      }
    }
  }

  /**
   * Wait for report generation to complete
   */
  private async waitForReportGeneration(reportId: string, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const exists = await this.redis!.exists(`report:hot:${reportId}`, `report:warm:${reportId}`, `report:cold:${reportId}`);
      if (exists > 0) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Invalidate report cache for specific parameters
   */
  async invalidateReport(reportType: string, parameters: Record<string, any>, userId: string): Promise<void> {
    const reportId = this.generateReportKey(reportType, parameters, userId);
    
    if (this.redis) {
      const pipeline = this.redis.pipeline();
      pipeline.del(`report:hot:${reportId}`);
      pipeline.del(`report:warm:${reportId}`);
      pipeline.del(`report:cold:${reportId}`);
      pipeline.del(`report:meta:${reportId}`);
      await pipeline.exec();
    } else {
      this.fallbackCache.delete(reportId);
    }
  }

  /**
   * Invalidate all reports for a user
   */
  async invalidateUserReports(userId: string): Promise<void> {
    if (!this.redis) {
      // Fallback: clear entire cache (not ideal but necessary)
      this.fallbackCache.clear();
      return;
    }

    // Find all report metadata for user
    const metaKeys = await this.redis.keys('report:meta:*');
    const userReportIds: string[] = [];

    for (const metaKey of metaKeys) {
      const metadata = await this.redis.hgetall(metaKey);
      if (metadata.userId === userId) {
        const reportId = metaKey.replace('report:meta:', '');
        userReportIds.push(reportId);
      }
    }

    // Delete all tiers for user reports
    if (userReportIds.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const reportId of userReportIds) {
        pipeline.del(`report:hot:${reportId}`);
        pipeline.del(`report:warm:${reportId}`);
        pipeline.del(`report:cold:${reportId}`);
        pipeline.del(`report:meta:${reportId}`);
      }
      await pipeline.exec();
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    hotCacheCount: number;
    warmCacheCount: number;
    coldCacheCount: number;
    totalSize: number;
    avgAccessCount: number;
  }> {
    if (!this.redis) {
      return {
        hotCacheCount: this.fallbackCache.size,
        warmCacheCount: 0,
        coldCacheCount: 0,
        totalSize: 0,
        avgAccessCount: 0
      };
    }

    const [hotKeys, warmKeys, coldKeys, metaKeys] = await Promise.all([
      this.redis.keys('report:hot:*'),
      this.redis.keys('report:warm:*'),
      this.redis.keys('report:cold:*'),
      this.redis.keys('report:meta:*')
    ]);

    let totalSize = 0;
    let totalAccess = 0;

    for (const metaKey of metaKeys) {
      const metadata = await this.redis.hgetall(metaKey);
      totalSize += parseInt(metadata.size || '0');
      totalAccess += parseInt(metadata.accessCount || '0');
    }

    return {
      hotCacheCount: hotKeys.length,
      warmCacheCount: warmKeys.length,
      coldCacheCount: coldKeys.length,
      totalSize,
      avgAccessCount: metaKeys.length > 0 ? totalAccess / metaKeys.length : 0
    };
  }

  /**
   * Cleanup expired entries and optimize cache
   */
  async cleanup(): Promise<void> {
    if (!this.redis) {
      // Cleanup fallback cache
      const now = Date.now();
      for (const [key, entry] of this.fallbackCache.entries()) {
        if (now - entry.timestamp > this.WARM_TTL * 1000) {
          this.fallbackCache.delete(key);
        }
      }
      return;
    }

    // Redis TTL handles expiration automatically, but we can optimize
    const metaKeys = await this.redis.keys('report:meta:*');
    
    for (const metaKey of metaKeys) {
      const reportId = metaKey.replace('report:meta:', '');
      const [hotExists, warmExists, coldExists] = await Promise.all([
        this.redis.exists(`report:hot:${reportId}`),
        this.redis.exists(`report:warm:${reportId}`),
        this.redis.exists(`report:cold:${reportId}`)
      ]);

      // If no cache tiers exist, remove metadata
      if (!hotExists && !warmExists && !coldExists) {
        await this.redis.del(metaKey);
      }
    }
  }
}

// Global instance
export const redisReportCache = new RedisReportCache();

/**
 * Convenience wrapper for report caching with generation
 */
export async function withReportCache<T>(
  reportType: string,
  parameters: Record<string, any>,
  userId: string,
  generator: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await redisReportCache.getReport(reportType, parameters, userId);
  if (cached.hit) {
    return cached.data;
  }

  // Generate with stampede protection
  return await redisReportCache.generateWithLock(reportType, parameters, userId, generator);
}