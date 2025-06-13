/**
 * Performance Integration Layer
 * Ties together all performance enhancements for PantryCRM
 * 
 * This module integrates:
 * - Enhanced rate limiting with tiered user limits
 * - Redis-based report caching with hot/warm/cold tiers
 * - Real-time streaming with Redis Streams
 * - Atomic cache invalidation
 * - Proactive cache warming
 * - Performance metrics collection
 * - Azure B1 specific optimizations
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { enhancedRateLimiter, getRateLimitConfig, UserRole } from './enhanced-rate-limiter';
import { redisReportCache, withReportCache } from './redis-report-cache';
import { redisStreamingCache, streamProgress } from './redis-streams';
import { enhancedCacheInvalidation, cacheInvalidation } from './enhanced-cache-invalidation';
import { initializeCacheWarming, cacheWarming } from './cache-warming';
import { performanceMetrics, metrics } from './performance-metrics';
import { azureB1Optimizer, createAzureB1Middleware, setupAzureB1Environment } from './azure-b1-optimizations';

export interface PerformanceConfig {
  enableRateLimit: boolean;
  enableCaching: boolean;
  enableStreaming: boolean;
  enableMetrics: boolean;
  enableCacheWarming: boolean;
  azureB1Optimizations: boolean;
}

export interface PerformanceReport {
  timestamp: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    memoryUsage: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
  cacheStats: {
    memoryCache: any;
    redisCache: any;
    reportCache: any;
  };
  rateLimitStats: {
    requestsBlocked: number;
    averagePenalty: number;
    topBlockedEndpoints: string[];
  };
  recommendations: string[];
}

/**
 * Comprehensive performance management system
 */
export class PerformanceManager {
  private config: PerformanceConfig;
  private prisma: PrismaClient;
  private isInitialized = false;

  constructor(prisma: PrismaClient, config: Partial<PerformanceConfig> = {}) {
    this.prisma = prisma;
    this.config = {
      enableRateLimit: true,
      enableCaching: true,
      enableStreaming: true,
      enableMetrics: true,
      enableCacheWarming: true,
      azureB1Optimizations: true,
      ...config
    };
  }

  /**
   * Initialize all performance systems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[PERFORMANCE] Initializing performance systems...');

    try {
      // Setup Azure B1 optimizations first
      if (this.config.azureB1Optimizations) {
        setupAzureB1Environment();
        console.log('[PERFORMANCE] Azure B1 optimizations applied');
      }

      // Initialize cache warming
      if (this.config.enableCacheWarming) {
        initializeCacheWarming(this.prisma);
        console.log('[PERFORMANCE] Cache warming initialized');
      }

      // Setup performance monitoring
      if (this.config.enableMetrics) {
        this.setupPerformanceMonitoring();
        console.log('[PERFORMANCE] Performance monitoring started');
      }

      // Warm critical caches
      if (this.config.enableCacheWarming && cacheWarming) {
        await cacheWarming.warmCriticalCaches();
        console.log('[PERFORMANCE] Critical caches warmed');
      }

      this.isInitialized = true;
      console.log('[PERFORMANCE] All performance systems initialized successfully');

    } catch (error) {
      console.error('[PERFORMANCE] Error initializing performance systems:', error);
      throw error;
    }
  }

  /**
   * Create performance-optimized API middleware
   */
  createAPIMiddleware() {
    const azureMiddleware = createAzureB1Middleware();

    return {
      /**
       * Comprehensive API middleware with all optimizations
       */
      withPerformanceOptimizations: (handler: (req: NextRequest) => Promise<NextResponse>) => {
        return async (req: NextRequest): Promise<NextResponse> => {
          const startTime = Date.now();
          let cacheHit = false;
          let rateLimited = false;

          try {
            // 1. Memory pressure check
            if (this.config.azureB1Optimizations && azureB1Optimizer.isUnderMemoryPressure()) {
              const usage = azureB1Optimizer.getCurrentResourceUsage();
              if (usage.memory.percentage > 95) {
                return NextResponse.json(
                  { error: 'Service temporarily unavailable due to high memory usage' },
                  { status: 503, headers: { 'Retry-After': '60' } }
                );
              }
            }

            // 2. Rate limiting check
            if (this.config.enableRateLimit) {
              const userRole = this.extractUserRole(req);
              const isAuthenticated = this.isAuthenticated(req);
              const operation = this.getOperationType(req);
              
              const rateLimitConfig = getRateLimitConfig(operation, userRole, isAuthenticated);
              const rateLimitResult = await enhancedRateLimiter.checkRateLimit(req, rateLimitConfig);

              if (!rateLimitResult.allowed) {
                rateLimited = true;
                const response = NextResponse.json(
                  { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
                  { status: 429 }
                );
                
                this.addRateLimitHeaders(response, rateLimitResult);
                await this.recordMetrics(req, response, startTime, cacheHit, rateLimited);
                return response;
              }
            }

            // 3. Execute handler
            const response = await handler(req);

            // 4. Check if response came from cache
            cacheHit = !!response.headers.get('X-Cache-Hit');

            // 5. Record metrics
            await this.recordMetrics(req, response, startTime, cacheHit, rateLimited);

            return response;

          } catch (error) {
            console.error('[PERFORMANCE] Error in API middleware:', error);
            
            // Record error metrics
            await this.recordMetrics(req, 
              NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
              startTime, cacheHit, rateLimited
            );

            throw error;
          }
        };
      },

      /**
       * Report generation middleware with caching and streaming
       */
      withReportOptimizations: (
        reportType: string,
        generator: (params: any) => Promise<any>
      ) => {
        return async (req: NextRequest, params: any): Promise<NextResponse> => {
          const userId = this.extractUserId(req);
          if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
          }

          try {
            // Use Redis report cache with stampede protection
            const reportData = await withReportCache(
              reportType,
              params,
              userId,
              async () => {
                // Stream progress updates
                if (this.config.enableStreaming) {
                  await streamProgress.update({
                    reportId: `${reportType}-${userId}-${Date.now()}`,
                    userId,
                    percentage: 0,
                    message: 'Starting report generation...',
                    stage: 'initializing',
                    timestamp: Date.now()
                  });
                }

                const data = await generator(params);

                if (this.config.enableStreaming) {
                  await streamProgress.update({
                    reportId: `${reportType}-${userId}-${Date.now()}`,
                    userId,
                    percentage: 100,
                    message: 'Report generation completed',
                    stage: 'completed',
                    timestamp: Date.now()
                  });
                }

                return data;
              }
            );

            const response = NextResponse.json(reportData);
            response.headers.set('X-Cache-Hit', 'true');
            return response;

          } catch (error) {
            console.error(`[PERFORMANCE] Error generating ${reportType} report:`, error);
            return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
          }
        };
      },

      ...azureMiddleware
    };
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor system resources every 30 seconds
    setInterval(async () => {
      const usage = azureB1Optimizer.getCurrentResourceUsage();
      
      await metrics.system(
        usage.memory,
        0, // CPU usage would need OS-level monitoring
        0, // RPS would be tracked separately
        usage.connections.database + usage.connections.redis,
        0  // Error rate would be tracked separately
      );
    }, 30000);

    // Setup alert handlers
    performanceMetrics.on('alert', (alert) => {
      console.warn(`[PERFORMANCE_ALERT] ${alert.severity}: ${alert.message}`);
      
      // Could integrate with external alerting services here
      if (alert.severity === 'critical') {
        // Trigger emergency procedures
        this.handleCriticalAlert(alert);
      }
    });
  }

  /**
   * Handle critical performance alerts
   */
  private async handleCriticalAlert(alert: any): Promise<void> {
    switch (alert.type) {
      case 'memory_usage':
        // Force garbage collection and cache cleanup
        if (global.gc) global.gc();
        await enhancedCacheInvalidation.cleanup();
        break;
        
      case 'dtu_usage':
        // Reduce database queries by increasing cache TTL
        console.warn('[PERFORMANCE] High DTU usage detected, implementing emergency caching');
        break;
        
      case 'cache_miss_rate':
        // Trigger immediate cache warming
        if (cacheWarming) {
          await cacheWarming.warmCriticalCaches();
        }
        break;
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const timestamp = Date.now();
    
    // Get system health
    const health = azureB1Optimizer.getHealthStatus();
    
    // Get cache stats
    const [memoryCache, redisCache, reportCache] = await Promise.all([
      this.getMemoryCacheStats(),
      this.getRedisCacheStats(),
      redisReportCache.getCacheStats()
    ]);

    // Get real-time metrics
    const realtimeMetrics = await metrics.getRealTime();

    // Generate recommendations
    const recommendations = this.generateRecommendations(health, realtimeMetrics);

    return {
      timestamp,
      systemHealth: {
        status: health.status,
        memoryUsage: health.memoryUsage,
        cacheHitRate: realtimeMetrics.cache?.hitRate || 0,
        averageResponseTime: realtimeMetrics.api?.avgResponseTime || 0,
        errorRate: realtimeMetrics.api?.errorRate || 0
      },
      cacheStats: {
        memoryCache,
        redisCache,
        reportCache
      },
      rateLimitStats: {
        requestsBlocked: 0, // Would need enhanced tracking
        averagePenalty: 0,
        topBlockedEndpoints: []
      },
      recommendations
    };
  }

  /**
   * Utility methods for middleware
   */
  private extractUserRole(req: NextRequest): UserRole | undefined {
    // Extract from session/token - implementation depends on auth system
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return undefined;
    
    // Placeholder - would decode JWT or check session
    return UserRole.USER;
  }

  private isAuthenticated(req: NextRequest): boolean {
    return !!req.headers.get('authorization');
  }

  private extractUserId(req: NextRequest): string | undefined {
    // Extract from session/token - implementation depends on auth system
    return undefined; // Placeholder
  }

  private getOperationType(req: NextRequest): string {
    const pathname = req.nextUrl.pathname;
    const method = req.method;

    if (pathname.includes('/api/auth')) return 'authentication';
    if (pathname.includes('/api/search')) return 'search';
    if (pathname.includes('/api/reports')) return 'reports';
    if (pathname.includes('/api/admin')) return 'admin';
    
    if (method === 'GET') return 'crud_read';
    if (method === 'POST' || method === 'PUT') return 'crud_write';
    if (method === 'DELETE') return 'crud_delete';
    
    return 'public';
  }

  private addRateLimitHeaders(response: NextResponse, result: any): void {
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
  }

  private async recordMetrics(
    req: NextRequest,
    response: NextResponse,
    startTime: number,
    cacheHit: boolean,
    rateLimited: boolean
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const statusCode = response.status;

    await metrics.api(
      req.nextUrl.pathname,
      req.method,
      statusCode,
      duration,
      this.extractUserId(req),
      rateLimited,
      cacheHit
    );
  }

  private async getMemoryCacheStats(): Promise<any> {
    // Would need to implement cache stats collection
    return { hitRate: 0, totalEntries: 0, memoryUsage: 0 };
  }

  private async getRedisCacheStats(): Promise<any> {
    // Would need to implement Redis stats collection
    return { connections: 0, memoryUsage: 0, hitRate: 0 };
  }

  private generateRecommendations(health: any, metrics: any): string[] {
    const recommendations: string[] = [];

    if (health.memoryUsage > 80) {
      recommendations.push('Consider reducing cache sizes or implementing more aggressive eviction');
    }

    if (metrics.cache?.hitRate < 70) {
      recommendations.push('Cache hit rate is low - review caching strategies and TTL values');
    }

    if (metrics.api?.errorRate > 5) {
      recommendations.push('High error rate detected - review error handling and monitoring');
    }

    if (health.issues?.length > 0) {
      recommendations.push(...health.issues.map(issue => `Address: ${issue}`));
    }

    return recommendations;
  }
}

// Export factory function for creating performance manager
export function createPerformanceManager(
  prisma: PrismaClient,
  config?: Partial<PerformanceConfig>
): PerformanceManager {
  return new PerformanceManager(prisma, config);
}

// Export convenience functions
export {
  // Rate limiting
  enhancedRateLimiter,
  getRateLimitConfig,
  UserRole,
  
  // Caching
  redisReportCache,
  withReportCache,
  cacheInvalidation,
  
  // Streaming
  streamProgress,
  
  // Metrics
  metrics,
  
  // Azure B1 optimizations
  azureB1Optimizer,
  setupAzureB1Environment
};