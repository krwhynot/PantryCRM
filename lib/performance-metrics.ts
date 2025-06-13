/**
 * Redis-based performance metrics collection and monitoring
 * Provides comprehensive performance tracking for PantryCRM
 * 
 * Features:
 * - Real-time metrics collection
 * - Sliding window counters
 * - Performance alerting
 * - Cache hit/miss tracking
 * - API response time monitoring
 * - Database performance metrics
 * - Memory usage tracking
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface CacheMetrics {
  operation: string;
  hit: boolean;
  duration: number;
  cacheLayer: 'memory' | 'redis' | 'miss';
  keyPattern?: string;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: string;
  rateLimited: boolean;
  cacheHit: boolean;
}

export interface DatabaseMetrics {
  query: string;
  duration: number;
  rowsAffected?: number;
  dtuUsage?: number;
  connectionPool?: {
    active: number;
    idle: number;
    waiting: number;
  };
}

export interface SystemMetrics {
  memoryUsage: {
    total: number;
    used: number;
    cached: number;
    available: number;
  };
  cpuUsage: number;
  requestsPerSecond: number;
  activeConnections: number;
  errorRate: number;
}

export interface MetricsSummary {
  timeframe: string;
  cache: {
    hitRate: number;
    totalRequests: number;
    avgDuration: number;
    topMissedKeys: string[];
  };
  api: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    rateLimitedRequests: number;
    slowestEndpoints: Array<{ endpoint: string; avgDuration: number }>;
  };
  database: {
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    dtuUsage: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
  };
}

export interface PerformanceAlert {
  type: 'cache_miss_rate' | 'slow_response' | 'high_error_rate' | 'memory_usage' | 'dtu_usage';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  details?: Record<string, any>;
}

/**
 * Performance metrics collection and monitoring system
 */
export class PerformanceMetrics extends EventEmitter {
  private redis: Redis | null = null;
  private fallbackMetrics = new Map<string, PerformanceMetric[]>();
  private alertThresholds: Record<string, { warning: number; critical: number }>;

  // Metrics configuration
  private readonly METRICS_TTL = 3600; // 1 hour
  private readonly SLIDING_WINDOW_SIZE = 300; // 5 minutes
  private readonly MAX_FALLBACK_METRICS = 1000;
  private readonly ALERT_COOLDOWN = 300000; // 5 minutes
  private lastAlerts = new Map<string, number>();

  constructor() {
    super();
    this.setupAlertThresholds();
    this.initializeRedis();
    this.startMetricsAggregation();
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          maxConnections: 2,
          keepAlive: 30000,
          family: 4,
        });

        this.redis.on('error', (error) => {
          console.error('[PERFORMANCE_METRICS] Redis connection error:', error);
          this.redis = null;
        });
      }
    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Failed to initialize Redis:', error);
    }
  }

  private setupAlertThresholds(): void {
    this.alertThresholds = {
      cache_hit_rate: { warning: 70, critical: 50 }, // Percentage
      response_time: { warning: 1000, critical: 2000 }, // Milliseconds
      error_rate: { warning: 5, critical: 10 }, // Percentage
      memory_usage: { warning: 80, critical: 90 }, // Percentage
      dtu_usage: { warning: 70, critical: 85 }, // Percentage
      cpu_usage: { warning: 80, critical: 90 } // Percentage
    };
  }

  /**
   * Record cache operation metrics
   */
  async recordCacheMetrics(metrics: CacheMetrics): Promise<void> {
    const timestamp = Date.now();
    const hour = Math.floor(timestamp / 3600000);
    const minute = Math.floor(timestamp / 60000);

    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();

        // Hourly counters
        pipeline.hincrby(`metrics:cache:${metrics.operation}:${hour}`, metrics.hit ? 'hits' : 'misses', 1);
        pipeline.hincrby(`metrics:cache:total:${hour}`, metrics.hit ? 'hits' : 'misses', 1);
        pipeline.expire(`metrics:cache:${metrics.operation}:${hour}`, this.METRICS_TTL);
        pipeline.expire(`metrics:cache:total:${hour}`, this.METRICS_TTL);

        // Duration tracking
        pipeline.lpush(`metrics:cache:durations:${metrics.operation}`, metrics.duration);
        pipeline.ltrim(`metrics:cache:durations:${metrics.operation}`, 0, 999); // Keep last 1000

        // Minute-level tracking for real-time monitoring
        pipeline.hincrby(`metrics:cache:minute:${minute}`, metrics.hit ? 'hits' : 'misses', 1);
        pipeline.expire(`metrics:cache:minute:${minute}`, 300); // 5 minutes

        // Track missed keys for analysis
        if (!metrics.hit && metrics.keyPattern) {
          pipeline.zincrby('metrics:cache:missed_keys', 1, metrics.keyPattern);
          pipeline.zremrangebyrank('metrics:cache:missed_keys', 0, -101); // Keep top 100
        }

        await pipeline.exec();
      } else {
        this.storeFallbackMetric('cache', {
          name: metrics.operation,
          value: metrics.hit ? 1 : 0,
          timestamp,
          tags: {
            operation: metrics.operation,
            layer: metrics.cacheLayer,
            duration: metrics.duration.toString()
          },
          type: 'counter'
        });
      }

      // Check for alerts
      await this.checkCacheAlerts(metrics);

    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error recording cache metrics:', error);
    }
  }

  /**
   * Record API request metrics
   */
  async recordAPIMetrics(metrics: APIMetrics): Promise<void> {
    const timestamp = Date.now();
    const hour = Math.floor(timestamp / 3600000);
    const minute = Math.floor(timestamp / 60000);

    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();

        // Request counters
        pipeline.hincrby(`metrics:api:${hour}`, 'total_requests', 1);
        pipeline.hincrby(`metrics:api:${hour}`, `status_${metrics.statusCode}`, 1);
        pipeline.expire(`metrics:api:${hour}`, this.METRICS_TTL);

        // Endpoint-specific metrics
        const endpointKey = `metrics:api:endpoint:${metrics.endpoint}:${hour}`;
        pipeline.hincrby(endpointKey, 'requests', 1);
        pipeline.hincrby(endpointKey, 'total_duration', metrics.duration);
        pipeline.expire(endpointKey, this.METRICS_TTL);

        // Response time tracking
        pipeline.lpush(`metrics:api:response_times:${metrics.endpoint}`, metrics.duration);
        pipeline.ltrim(`metrics:api:response_times:${metrics.endpoint}`, 0, 999);

        // Rate limiting tracking
        if (metrics.rateLimited) {
          pipeline.hincrby(`metrics:api:${hour}`, 'rate_limited', 1);
        }

        // Cache hit tracking
        if (metrics.cacheHit) {
          pipeline.hincrby(`metrics:api:${hour}`, 'cache_hits', 1);
        }

        // Real-time minute tracking
        pipeline.hincrby(`metrics:api:minute:${minute}`, 'requests', 1);
        pipeline.hincrby(`metrics:api:minute:${minute}`, 'total_duration', metrics.duration);
        pipeline.expire(`metrics:api:minute:${minute}`, 300);

        await pipeline.exec();
      } else {
        this.storeFallbackMetric('api', {
          name: metrics.endpoint,
          value: metrics.duration,
          timestamp,
          tags: {
            method: metrics.method,
            status: metrics.statusCode.toString(),
            endpoint: metrics.endpoint,
            rateLimited: metrics.rateLimited.toString(),
            cacheHit: metrics.cacheHit.toString()
          },
          type: 'timer'
        });
      }

      // Check for alerts
      await this.checkAPIAlerts(metrics);

    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error recording API metrics:', error);
    }
  }

  /**
   * Record database operation metrics
   */
  async recordDatabaseMetrics(metrics: DatabaseMetrics): Promise<void> {
    const timestamp = Date.now();
    const hour = Math.floor(timestamp / 3600000);

    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();

        // Query counters
        pipeline.hincrby(`metrics:db:${hour}`, 'total_queries', 1);
        pipeline.hincrby(`metrics:db:${hour}`, 'total_duration', metrics.duration);
        
        if (metrics.rowsAffected !== undefined) {
          pipeline.hincrby(`metrics:db:${hour}`, 'total_rows', metrics.rowsAffected);
        }

        pipeline.expire(`metrics:db:${hour}`, this.METRICS_TTL);

        // Slow query tracking (> 1 second)
        if (metrics.duration > 1000) {
          pipeline.hincrby(`metrics:db:${hour}`, 'slow_queries', 1);
          pipeline.lpush('metrics:db:slow_queries', JSON.stringify({
            query: metrics.query.substring(0, 200), // Truncate for storage
            duration: metrics.duration,
            timestamp,
            dtuUsage: metrics.dtuUsage
          }));
          pipeline.ltrim('metrics:db:slow_queries', 0, 99); // Keep last 100
        }

        // DTU usage tracking for Azure SQL
        if (metrics.dtuUsage !== undefined) {
          pipeline.lpush('metrics:db:dtu_usage', metrics.dtuUsage);
          pipeline.ltrim('metrics:db:dtu_usage', 0, 999);
        }

        // Connection pool metrics
        if (metrics.connectionPool) {
          pipeline.hset(`metrics:db:pool:${hour}`, {
            active: metrics.connectionPool.active,
            idle: metrics.connectionPool.idle,
            waiting: metrics.connectionPool.waiting
          });
          pipeline.expire(`metrics:db:pool:${hour}`, this.METRICS_TTL);
        }

        await pipeline.exec();
      } else {
        this.storeFallbackMetric('database', {
          name: 'query',
          value: metrics.duration,
          timestamp,
          tags: {
            duration: metrics.duration.toString(),
            rows: metrics.rowsAffected?.toString() || '0',
            dtu: metrics.dtuUsage?.toString() || '0'
          },
          type: 'timer'
        });
      }

      // Check for DTU alerts
      if (metrics.dtuUsage !== undefined) {
        await this.checkDTUAlerts(metrics.dtuUsage);
      }

    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error recording database metrics:', error);
    }
  }

  /**
   * Record system metrics
   */
  async recordSystemMetrics(metrics: SystemMetrics): Promise<void> {
    const timestamp = Date.now();
    const minute = Math.floor(timestamp / 60000);

    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();

        // System metrics
        pipeline.hset(`metrics:system:${minute}`, {
          memory_total: metrics.memoryUsage.total,
          memory_used: metrics.memoryUsage.used,
          memory_cached: metrics.memoryUsage.cached,
          memory_available: metrics.memoryUsage.available,
          cpu_usage: metrics.cpuUsage,
          requests_per_second: metrics.requestsPerSecond,
          active_connections: metrics.activeConnections,
          error_rate: metrics.errorRate,
          timestamp
        });
        pipeline.expire(`metrics:system:${minute}`, 3600); // 1 hour

        // Time series for trending
        pipeline.lpush('metrics:system:memory_usage', metrics.memoryUsage.used);
        pipeline.ltrim('metrics:system:memory_usage', 0, 1439); // 24 hours of minutes

        pipeline.lpush('metrics:system:cpu_usage', metrics.cpuUsage);
        pipeline.ltrim('metrics:system:cpu_usage', 0, 1439);

        await pipeline.exec();
      } else {
        this.storeFallbackMetric('system', {
          name: 'memory_usage',
          value: metrics.memoryUsage.used,
          timestamp,
          tags: {
            total: metrics.memoryUsage.total.toString(),
            cpu: metrics.cpuUsage.toString(),
            rps: metrics.requestsPerSecond.toString()
          },
          type: 'gauge'
        });
      }

      // Check for system alerts
      await this.checkSystemAlerts(metrics);

    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error recording system metrics:', error);
    }
  }

  /**
   * Get real-time metrics summary
   */
  async getRealTimeMetrics(): Promise<Partial<MetricsSummary>> {
    if (!this.redis) {
      return this.getFallbackMetrics();
    }

    try {
      const currentHour = Math.floor(Date.now() / 3600000);
      const currentMinute = Math.floor(Date.now() / 60000);

      const [
        cacheMetrics,
        apiMetrics,
        dbMetrics,
        systemMetrics,
        missedKeys,
        slowQueries
      ] = await Promise.all([
        this.redis.hgetall(`metrics:cache:total:${currentHour}`),
        this.redis.hgetall(`metrics:api:${currentHour}`),
        this.redis.hgetall(`metrics:db:${currentHour}`),
        this.redis.hgetall(`metrics:system:${currentMinute}`),
        this.redis.zrevrange('metrics:cache:missed_keys', 0, 4, 'WITHSCORES'),
        this.redis.lrange('metrics:db:slow_queries', 0, 4)
      ]);

      // Calculate cache hit rate
      const cacheHits = parseInt(cacheMetrics.hits || '0');
      const cacheMisses = parseInt(cacheMetrics.misses || '0');
      const cacheTotal = cacheHits + cacheMisses;
      const cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0;

      // Calculate API metrics
      const apiRequests = parseInt(apiMetrics.total_requests || '0');
      const apiErrors = Object.entries(apiMetrics)
        .filter(([key]) => key.startsWith('status_') && key !== 'status_200')
        .reduce((sum, [, value]) => sum + parseInt(value as string || '0'), 0);
      const apiErrorRate = apiRequests > 0 ? (apiErrors / apiRequests) * 100 : 0;

      // Parse missed keys
      const topMissedKeys: string[] = [];
      for (let i = 0; i < missedKeys.length; i += 2) {
        topMissedKeys.push(missedKeys[i]);
      }

      return {
        timeframe: 'current_hour',
        cache: {
          hitRate: Math.round(cacheHitRate * 100) / 100,
          totalRequests: cacheTotal,
          avgDuration: 0, // Would need additional calculation
          topMissedKeys
        },
        api: {
          totalRequests: apiRequests,
          avgResponseTime: 0, // Would need additional calculation
          errorRate: Math.round(apiErrorRate * 100) / 100,
          rateLimitedRequests: parseInt(apiMetrics.rate_limited || '0'),
          slowestEndpoints: [] // Would need additional endpoint analysis
        },
        database: {
          totalQueries: parseInt(dbMetrics.total_queries || '0'),
          avgDuration: 0, // Would need additional calculation
          slowQueries: parseInt(dbMetrics.slow_queries || '0'),
          dtuUsage: 0 // Would need current DTU reading
        },
        system: {
          memoryUsage: parseInt(systemMetrics.memory_used || '0'),
          cpuUsage: parseFloat(systemMetrics.cpu_usage || '0'),
          errorCount: apiErrors
        }
      };

    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error getting real-time metrics:', error);
      return {};
    }
  }

  /**
   * Check cache performance alerts
   */
  private async checkCacheAlerts(metrics: CacheMetrics): Promise<void> {
    if (!metrics.hit) {
      // Check if miss rate is high
      const currentMinute = Math.floor(Date.now() / 60000);
      const recentMetrics = await this.redis?.hgetall(`metrics:cache:minute:${currentMinute}`);
      
      if (recentMetrics) {
        const hits = parseInt(recentMetrics.hits || '0');
        const misses = parseInt(recentMetrics.misses || '0');
        const total = hits + misses;
        
        if (total >= 10) { // Only alert if we have sufficient data
          const hitRate = (hits / total) * 100;
          
          if (hitRate < this.alertThresholds.cache_hit_rate.critical) {
            await this.emitAlert({
              type: 'cache_miss_rate',
              severity: 'critical',
              message: `Cache hit rate critically low: ${hitRate.toFixed(1)}%`,
              value: hitRate,
              threshold: this.alertThresholds.cache_hit_rate.critical,
              timestamp: Date.now(),
              details: { operation: metrics.operation, total }
            });
          } else if (hitRate < this.alertThresholds.cache_hit_rate.warning) {
            await this.emitAlert({
              type: 'cache_miss_rate',
              severity: 'warning',
              message: `Cache hit rate below optimal: ${hitRate.toFixed(1)}%`,
              value: hitRate,
              threshold: this.alertThresholds.cache_hit_rate.warning,
              timestamp: Date.now(),
              details: { operation: metrics.operation, total }
            });
          }
        }
      }
    }
  }

  /**
   * Check API performance alerts
   */
  private async checkAPIAlerts(metrics: APIMetrics): Promise<void> {
    // Check response time
    if (metrics.duration > this.alertThresholds.response_time.critical) {
      await this.emitAlert({
        type: 'slow_response',
        severity: 'critical',
        message: `Critical response time for ${metrics.endpoint}: ${metrics.duration}ms`,
        value: metrics.duration,
        threshold: this.alertThresholds.response_time.critical,
        timestamp: Date.now(),
        details: { endpoint: metrics.endpoint, method: metrics.method }
      });
    } else if (metrics.duration > this.alertThresholds.response_time.warning) {
      await this.emitAlert({
        type: 'slow_response',
        severity: 'warning',
        message: `Slow response time for ${metrics.endpoint}: ${metrics.duration}ms`,
        value: metrics.duration,
        threshold: this.alertThresholds.response_time.warning,
        timestamp: Date.now(),
        details: { endpoint: metrics.endpoint, method: metrics.method }
      });
    }

    // Check error rates
    if (metrics.statusCode >= 500) {
      const currentMinute = Math.floor(Date.now() / 60000);
      const recentMetrics = await this.redis?.hgetall(`metrics:api:minute:${currentMinute}`);
      
      if (recentMetrics) {
        const totalRequests = parseInt(recentMetrics.requests || '0');
        if (totalRequests >= 10) {
          // Calculate recent error rate (would need more detailed tracking)
          const errorRate = 10; // Placeholder - would calculate actual rate
          
          if (errorRate > this.alertThresholds.error_rate.critical) {
            await this.emitAlert({
              type: 'high_error_rate',
              severity: 'critical',
              message: `High error rate: ${errorRate.toFixed(1)}%`,
              value: errorRate,
              threshold: this.alertThresholds.error_rate.critical,
              timestamp: Date.now()
            });
          }
        }
      }
    }
  }

  /**
   * Check DTU usage alerts
   */
  private async checkDTUAlerts(dtuUsage: number): Promise<void> {
    if (dtuUsage > this.alertThresholds.dtu_usage.critical) {
      await this.emitAlert({
        type: 'dtu_usage',
        severity: 'critical',
        message: `Critical DTU usage: ${dtuUsage}%`,
        value: dtuUsage,
        threshold: this.alertThresholds.dtu_usage.critical,
        timestamp: Date.now()
      });
    } else if (dtuUsage > this.alertThresholds.dtu_usage.warning) {
      await this.emitAlert({
        type: 'dtu_usage',
        severity: 'warning',
        message: `High DTU usage: ${dtuUsage}%`,
        value: dtuUsage,
        threshold: this.alertThresholds.dtu_usage.warning,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check system resource alerts
   */
  private async checkSystemAlerts(metrics: SystemMetrics): Promise<void> {
    const memoryUsagePercent = (metrics.memoryUsage.used / metrics.memoryUsage.total) * 100;

    if (memoryUsagePercent > this.alertThresholds.memory_usage.critical) {
      await this.emitAlert({
        type: 'memory_usage',
        severity: 'critical',
        message: `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        value: memoryUsagePercent,
        threshold: this.alertThresholds.memory_usage.critical,
        timestamp: Date.now(),
        details: { used: metrics.memoryUsage.used, total: metrics.memoryUsage.total }
      });
    }

    if (metrics.cpuUsage > this.alertThresholds.cpu_usage.critical) {
      await this.emitAlert({
        type: 'memory_usage',
        severity: 'critical',
        message: `Critical CPU usage: ${metrics.cpuUsage}%`,
        value: metrics.cpuUsage,
        threshold: this.alertThresholds.cpu_usage.critical,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Emit performance alert with cooldown
   */
  private async emitAlert(alert: PerformanceAlert): Promise<void> {
    const alertKey = `${alert.type}_${alert.severity}`;
    const lastAlert = this.lastAlerts.get(alertKey);
    
    // Check cooldown
    if (lastAlert && (Date.now() - lastAlert) < this.ALERT_COOLDOWN) {
      return;
    }

    this.lastAlerts.set(alertKey, Date.now());
    
    // Store alert in Redis
    if (this.redis) {
      await this.redis.lpush('metrics:alerts', JSON.stringify(alert));
      await this.redis.ltrim('metrics:alerts', 0, 99); // Keep last 100 alerts
    }

    // Emit event for external handlers
    this.emit('alert', alert);
    
    console.warn(`[PERFORMANCE_ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Store metric in fallback storage
   */
  private storeFallbackMetric(category: string, metric: PerformanceMetric): void {
    const key = `${category}:${metric.name}`;
    const metrics = this.fallbackMetrics.get(key) || [];
    
    metrics.push(metric);
    
    // Limit size
    if (metrics.length > this.MAX_FALLBACK_METRICS) {
      metrics.shift();
    }
    
    this.fallbackMetrics.set(key, metrics);
  }

  /**
   * Get fallback metrics when Redis is unavailable
   */
  private getFallbackMetrics(): Partial<MetricsSummary> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    let cacheHits = 0;
    let cacheMisses = 0;
    let apiRequests = 0;
    let apiErrors = 0;
    
    for (const [key, metrics] of this.fallbackMetrics.entries()) {
      const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo);
      
      if (key.startsWith('cache:')) {
        recentMetrics.forEach(m => {
          if (m.value === 1) cacheHits++;
          else cacheMisses++;
        });
      } else if (key.startsWith('api:')) {
        apiRequests += recentMetrics.length;
        recentMetrics.forEach(m => {
          if (m.tags?.status && parseInt(m.tags.status) >= 400) {
            apiErrors++;
          }
        });
      }
    }
    
    const cacheTotal = cacheHits + cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0;
    const apiErrorRate = apiRequests > 0 ? (apiErrors / apiRequests) * 100 : 0;
    
    return {
      timeframe: 'last_hour',
      cache: {
        hitRate: Math.round(cacheHitRate * 100) / 100,
        totalRequests: cacheTotal,
        avgDuration: 0,
        topMissedKeys: []
      },
      api: {
        totalRequests: apiRequests,
        avgResponseTime: 0,
        errorRate: Math.round(apiErrorRate * 100) / 100,
        rateLimitedRequests: 0,
        slowestEndpoints: []
      },
      database: {
        totalQueries: 0,
        avgDuration: 0,
        slowQueries: 0,
        dtuUsage: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        errorCount: apiErrors
      }
    };
  }

  /**
   * Start metrics aggregation and cleanup
   */
  private startMetricsAggregation(): void {
    // Aggregate metrics every minute
    setInterval(async () => {
      try {
        await this.aggregateMetrics();
      } catch (error) {
        console.error('[PERFORMANCE_METRICS] Error aggregating metrics:', error);
      }
    }, 60000);

    // Cleanup old metrics every hour
    setInterval(async () => {
      try {
        await this.cleanupOldMetrics();
      } catch (error) {
        console.error('[PERFORMANCE_METRICS] Error cleaning up metrics:', error);
      }
    }, 3600000);
  }

  /**
   * Aggregate metrics for reporting
   */
  private async aggregateMetrics(): Promise<void> {
    if (!this.redis) return;

    // This would implement more sophisticated aggregation
    // For now, we rely on the TTL-based cleanup
  }

  /**
   * Cleanup old metrics
   */
  private async cleanupOldMetrics(): Promise<void> {
    if (!this.redis) {
      // Cleanup fallback metrics
      const cutoff = Date.now() - 86400000; // 24 hours
      for (const [key, metrics] of this.fallbackMetrics.entries()) {
        const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
        if (filteredMetrics.length !== metrics.length) {
          this.fallbackMetrics.set(key, filteredMetrics);
        }
      }
      return;
    }

    try {
      // Redis TTL handles most cleanup, but we can clean up specific patterns
      const oldKeys = await this.redis.keys('metrics:*:' + (Math.floor(Date.now() / 3600000) - 25)); // 25+ hours old
      if (oldKeys.length > 0) {
        await this.redis.del(...oldKeys);
      }
    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error during cleanup:', error);
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit = 20): Promise<PerformanceAlert[]> {
    if (!this.redis) return [];

    try {
      const alertsJson = await this.redis.lrange('metrics:alerts', 0, limit - 1);
      return alertsJson.map(json => JSON.parse(json));
    } catch (error) {
      console.error('[PERFORMANCE_METRICS] Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Update alert thresholds
   */
  updateAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }
}

// Global instance
export const performanceMetrics = new PerformanceMetrics();

/**
 * Convenience functions for metric recording
 */
export const metrics = {
  /**
   * Record cache operation
   */
  cache: (operation: string, hit: boolean, duration: number, layer: CacheMetrics['cacheLayer'], keyPattern?: string) =>
    performanceMetrics.recordCacheMetrics({ operation, hit, duration, cacheLayer: layer, keyPattern }),

  /**
   * Record API request
   */
  api: (endpoint: string, method: string, statusCode: number, duration: number, userId?: string, rateLimited = false, cacheHit = false) =>
    performanceMetrics.recordAPIMetrics({ endpoint, method, statusCode, duration, userId, rateLimited, cacheHit }),

  /**
   * Record database operation
   */
  database: (query: string, duration: number, rowsAffected?: number, dtuUsage?: number) =>
    performanceMetrics.recordDatabaseMetrics({ query, duration, rowsAffected, dtuUsage }),

  /**
   * Record system metrics
   */
  system: (memoryUsage: SystemMetrics['memoryUsage'], cpuUsage: number, requestsPerSecond: number, activeConnections: number, errorRate: number) =>
    performanceMetrics.recordSystemMetrics({ memoryUsage, cpuUsage, requestsPerSecond, activeConnections, errorRate }),

  /**
   * Get real-time metrics
   */
  getRealTime: () => performanceMetrics.getRealTimeMetrics(),

  /**
   * Get recent alerts
   */
  getAlerts: (limit?: number) => performanceMetrics.getRecentAlerts(limit)
};