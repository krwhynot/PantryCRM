/**
 * Azure B1 App Service optimizations for memory and connection limits
 * Specialized configurations for PantryCRM's Azure B1 environment
 * 
 * Azure B1 Constraints:
 * - 1.75 GB RAM
 * - 1 Core CPU
 * - 5 DTU SQL Database
 * - 3 concurrent database connections
 * - Limited compute resources
 * 
 * Features:
 * - Optimized Redis connection pooling
 * - Memory usage monitoring and alerts
 * - Database connection management
 * - Garbage collection optimization
 * - Resource-aware caching
 * - Performance tuning for constraints
 */

import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { performanceMetrics } from './performance-metrics';

export interface AzureB1Config {
  redis: {
    maxConnections: number;
    connectTimeout: number;
    commandTimeout: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
    keepAlive: number;
    family: 4 | 6;
  };
  database: {
    connectionLimit: number;
    transactionTimeout: number;
    queryTimeout: number;
    logSlowQueries: boolean;
    slowQueryThreshold: number;
  };
  memory: {
    maxCacheSize: number; // MB
    gcOptimization: boolean;
    memoryAlertThreshold: number; // Percentage
    memoryCleanupInterval: number; // ms
  };
  performance: {
    requestTimeout: number;
    maxConcurrentRequests: number;
    enableCompression: boolean;
    staticFileMaxAge: number;
  };
}

export interface ResourceUsage {
  memory: {
    used: number;
    total: number;
    heap: number;
    external: number;
    percentage: number;
  };
  connections: {
    database: number;
    redis: number;
    http: number;
  };
  performance: {
    eventLoopLag: number;
    gcStats?: {
      collections: number;
      duration: number;
    };
  };
}

/**
 * Azure B1 optimization manager
 */
export class AzureB1Optimizer {
  private config: AzureB1Config;
  private redisConnection: Redis | null = null;
  private memoryWarningEmitted = false;
  private lastGCStats = { collections: 0, duration: 0 };

  // Azure B1 specific limits
  private readonly AZURE_B1_MEMORY_LIMIT = 1.75 * 1024 * 1024 * 1024; // 1.75 GB in bytes
  private readonly MAX_HEAP_SIZE = 1.4 * 1024 * 1024 * 1024; // 1.4 GB heap limit
  private readonly DATABASE_CONNECTION_LIMIT = 3;
  private readonly REDIS_CONNECTION_LIMIT = 2;

  constructor() {
    this.config = this.getOptimalConfig();
    this.setupMemoryMonitoring();
    this.setupGarbageCollectionOptimization();
    this.setupProcessOptimizations();
  }

  /**
   * Get optimized configuration for Azure B1
   */
  private getOptimalConfig(): AzureB1Config {
    return {
      redis: {
        maxConnections: this.REDIS_CONNECTION_LIMIT,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4 // IPv4 only for better performance
      },
      database: {
        connectionLimit: this.DATABASE_CONNECTION_LIMIT,
        transactionTimeout: 10000,
        queryTimeout: 30000,
        logSlowQueries: true,
        slowQueryThreshold: 1000 // 1 second
      },
      memory: {
        maxCacheSize: 100, // 100 MB for caching
        gcOptimization: true,
        memoryAlertThreshold: 80, // Alert at 80% memory usage
        memoryCleanupInterval: 5 * 60 * 1000 // 5 minutes
      },
      performance: {
        requestTimeout: 30000,
        maxConcurrentRequests: 10,
        enableCompression: true,
        staticFileMaxAge: 86400 // 1 day
      }
    };
  }

  /**
   * Create optimized Redis connection
   */
  createOptimizedRedisConnection(url?: string): Redis | null {
    try {
      const redisUrl = url || process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
      if (!redisUrl) {
        console.warn('[AZURE_B1] No Redis URL provided, skipping Redis connection');
        return null;
      }

      const connection = new Redis(redisUrl, {
        maxConnections: this.config.redis.maxConnections,
        connectTimeout: this.config.redis.connectTimeout,
        commandTimeout: this.config.redis.commandTimeout,
        retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
        maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
        lazyConnect: this.config.redis.lazyConnect,
        keepAlive: this.config.redis.keepAlive,
        family: this.config.redis.family,
        
        // Azure B1 specific optimizations
        enableOfflineQueue: false, // Disable offline queue to prevent memory buildup
        maxMemoryPolicy: 'allkeys-lru', // Use LRU eviction
        
        // Connection pool optimization
        enableReadyCheck: true,
        maxLoadingTimeout: 5000,
        
        // Compression for large payloads
        compression: 'gzip'
      });

      // Monitor connection events
      connection.on('connect', () => {
        console.log('[AZURE_B1] Redis connected successfully');
      });

      connection.on('error', (error) => {
        console.error('[AZURE_B1] Redis connection error:', error);
        this.handleRedisError(error);
      });

      connection.on('close', () => {
        console.warn('[AZURE_B1] Redis connection closed');
      });

      // Monitor memory usage of Redis connection
      connection.on('ready', async () => {
        try {
          await this.configureRedisMemory(connection);
        } catch (error) {
          console.error('[AZURE_B1] Error configuring Redis memory:', error);
        }
      });

      this.redisConnection = connection;
      return connection;

    } catch (error) {
      console.error('[AZURE_B1] Failed to create Redis connection:', error);
      return null;
    }
  }

  /**
   * Create optimized Prisma client
   */
  createOptimizedPrismaClient(): PrismaClient {
    return new PrismaClient({
      // Connection pool optimization for Azure B1
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      
      // Logging configuration
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      
      // Error formatting
      errorFormat: 'minimal',
      
      // Connection management
      __internal: {
        engine: {
          // Limit connection pool size for Azure B1
          connection_limit: this.config.database.connectionLimit,
          pool_timeout: this.config.database.transactionTimeout,
          
          // Query optimization
          query_engine_library: 'query-engine',
          
          // Memory optimization
          max_bind_values: 1000,
        }
      }
    });
  }

  /**
   * Configure Redis memory settings
   */
  private async configureRedisMemory(redis: Redis): Promise<void> {
    try {
      // Set memory limits if we have admin access
      const isAdmin = await this.checkRedisAdmin(redis);
      
      if (isAdmin) {
        // Configure memory policy for Azure B1
        await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
        await redis.config('SET', 'save', ''); // Disable persistence to save memory
        
        // Set reasonable memory limit (leave headroom for Node.js)
        const redisMemoryLimit = 50 * 1024 * 1024; // 50 MB
        await redis.config('SET', 'maxmemory', redisMemoryLimit.toString());
        
        console.log('[AZURE_B1] Redis memory configuration applied');
      }
    } catch (error) {
      // Silently fail if we don't have admin access
      console.warn('[AZURE_B1] Could not configure Redis memory (admin access required)');
    }
  }

  /**
   * Check if we have Redis admin access
   */
  private async checkRedisAdmin(redis: Redis): Promise<boolean> {
    try {
      await redis.config('GET', 'maxmemory');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle Redis connection errors
   */
  private handleRedisError(error: Error): void {
    // Log error for monitoring
    performanceMetrics.recordSystemMetrics({
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: 0, // Would need OS-level monitoring
      requestsPerSecond: 0,
      activeConnections: 0,
      errorRate: 1
    });

    // Implement retry logic or fallback
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.warn('[AZURE_B1] Redis connection issue, falling back to memory cache');
    }
  }

  /**
   * Setup memory monitoring and alerts
   */
  private setupMemoryMonitoring(): void {
    setInterval(() => {
      const usage = this.getCurrentResourceUsage();
      
      // Alert if memory usage is high
      if (usage.memory.percentage > this.config.memory.memoryAlertThreshold) {
        if (!this.memoryWarningEmitted) {
          console.warn(`[AZURE_B1] High memory usage: ${usage.memory.percentage.toFixed(1)}%`);
          this.memoryWarningEmitted = true;
          
          // Trigger cleanup
          this.performMemoryCleanup();
        }
      } else {
        this.memoryWarningEmitted = false;
      }

      // Record metrics
      performanceMetrics.recordSystemMetrics({
        memoryUsage: {
          total: this.AZURE_B1_MEMORY_LIMIT,
          used: usage.memory.used,
          cached: 0, // Would need OS-level info
          available: this.AZURE_B1_MEMORY_LIMIT - usage.memory.used
        },
        cpuUsage: 0, // Would need OS-level monitoring
        requestsPerSecond: 0, // Would be tracked separately
        activeConnections: usage.connections.database + usage.connections.redis,
        errorRate: 0 // Would be tracked separately
      });

    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup garbage collection optimization
   */
  private setupGarbageCollectionOptimization(): void {
    if (!this.config.memory.gcOptimization) return;

    // Force garbage collection in low-memory situations
    setInterval(() => {
      const usage = this.getCurrentResourceUsage();
      
      if (usage.memory.percentage > 75) {
        if (global.gc) {
          const before = process.memoryUsage().heapUsed;
          global.gc();
          const after = process.memoryUsage().heapUsed;
          const freed = before - after;
          
          if (freed > 0) {
            console.log(`[AZURE_B1] GC freed ${Math.round(freed / 1024 / 1024)}MB`);
          }
        }
      }
    }, this.config.memory.memoryCleanupInterval);

    // Monitor GC performance
    if (process.env.NODE_ENV === 'production') {
      // Log GC stats periodically
      setInterval(() => {
        const v8 = require('v8');
        const stats = v8.getHeapStatistics();
        
        console.log(`[AZURE_B1] Heap: ${Math.round(stats.used_heap_size / 1024 / 1024)}MB / ${Math.round(stats.heap_size_limit / 1024 / 1024)}MB`);
      }, 5 * 60 * 1000); // Every 5 minutes
    }
  }

  /**
   * Setup process-level optimizations
   */
  private setupProcessOptimizations(): void {
    // Set V8 heap size limit for Azure B1
    if (process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
      console.log('[AZURE_B1] V8 heap size already configured via NODE_OPTIONS');
    } else {
      console.warn('[AZURE_B1] Consider setting NODE_OPTIONS="--max-old-space-size=1400" for optimal memory usage');
    }

    // Monitor event loop lag
    let lastCheck = process.hrtime.bigint();
    setInterval(() => {
      const now = process.hrtime.bigint();
      const lag = Number(now - lastCheck - 1000000000n) / 1000000; // Convert to ms
      lastCheck = now;
      
      if (lag > 100) { // Alert if event loop lag > 100ms
        console.warn(`[AZURE_B1] High event loop lag: ${lag.toFixed(1)}ms`);
      }
    }, 1000);

    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', (error) => {
      console.error('[AZURE_B1] Uncaught exception:', error);
      // Don't exit - log and continue for availability
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[AZURE_B1] Unhandled rejection at:', promise, 'reason:', reason);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('[AZURE_B1] SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      console.log('[AZURE_B1] SIGINT received, starting graceful shutdown');
      this.gracefulShutdown();
    });
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      total: this.AZURE_B1_MEMORY_LIMIT,
      used: used.rss,
      cached: 0,
      available: this.AZURE_B1_MEMORY_LIMIT - used.rss
    };
  }

  /**
   * Get current resource usage
   */
  getCurrentResourceUsage(): ResourceUsage {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.rss,
        total: this.AZURE_B1_MEMORY_LIMIT,
        heap: memUsage.heapUsed,
        external: memUsage.external,
        percentage: (memUsage.rss / this.AZURE_B1_MEMORY_LIMIT) * 100
      },
      connections: {
        database: 0, // Would need Prisma integration
        redis: this.redisConnection ? 1 : 0,
        http: 0 // Would need HTTP server integration
      },
      performance: {
        eventLoopLag: 0, // Would need event loop monitoring
        gcStats: this.lastGCStats
      }
    };
  }

  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup(): void {
    console.log('[AZURE_B1] Performing memory cleanup...');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear require cache for non-essential modules (be careful!)
    const cache = require.cache;
    const essentialModules = ['prisma', 'redis', 'next'];
    
    Object.keys(cache).forEach(key => {
      const isEssential = essentialModules.some(module => key.includes(module));
      if (!isEssential && key.includes('node_modules')) {
        // Only clear specific non-essential modules
        if (key.includes('lodash') || key.includes('moment')) {
          delete cache[key];
        }
      }
    });

    console.log('[AZURE_B1] Memory cleanup completed');
  }

  /**
   * Check if system is under memory pressure
   */
  isUnderMemoryPressure(): boolean {
    const usage = this.getCurrentResourceUsage();
    return usage.memory.percentage > this.config.memory.memoryAlertThreshold;
  }

  /**
   * Get optimized configuration for external services
   */
  getOptimizedConfig(): AzureB1Config {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AzureB1Config>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    memoryUsage: number;
    connections: number;
    issues: string[];
  } {
    const usage = this.getCurrentResourceUsage();
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Check memory usage
    if (usage.memory.percentage > 90) {
      status = 'critical';
      issues.push(`Critical memory usage: ${usage.memory.percentage.toFixed(1)}%`);
    } else if (usage.memory.percentage > 80) {
      status = 'degraded';
      issues.push(`High memory usage: ${usage.memory.percentage.toFixed(1)}%`);
    }

    // Check heap usage
    const heapPercentage = (usage.memory.heap / this.MAX_HEAP_SIZE) * 100;
    if (heapPercentage > 85) {
      status = 'critical';
      issues.push(`Critical heap usage: ${heapPercentage.toFixed(1)}%`);
    }

    // Check connections
    const totalConnections = usage.connections.database + usage.connections.redis;
    if (totalConnections > (this.DATABASE_CONNECTION_LIMIT + this.REDIS_CONNECTION_LIMIT)) {
      status = 'degraded';
      issues.push(`High connection count: ${totalConnections}`);
    }

    return {
      status,
      memoryUsage: usage.memory.percentage,
      connections: totalConnections,
      issues
    };
  }

  /**
   * Graceful shutdown process
   */
  private async gracefulShutdown(): Promise<void> {
    console.log('[AZURE_B1] Starting graceful shutdown...');
    
    try {
      // Close Redis connection
      if (this.redisConnection) {
        await this.redisConnection.quit();
        console.log('[AZURE_B1] Redis connection closed');
      }

      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }

      console.log('[AZURE_B1] Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('[AZURE_B1] Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): {
    configuration: AzureB1Config;
    currentUsage: ResourceUsage;
    recommendations: string[];
    healthStatus: ReturnType<typeof this.getHealthStatus>;
  } {
    const usage = this.getCurrentResourceUsage();
    const health = this.getHealthStatus();
    const recommendations: string[] = [];

    // Generate recommendations based on current usage
    if (usage.memory.percentage > 70) {
      recommendations.push('Consider implementing more aggressive caching eviction policies');
      recommendations.push('Review and optimize large object allocations');
    }

    if (usage.memory.heap > this.MAX_HEAP_SIZE * 0.8) {
      recommendations.push('Heap usage is high - consider reducing in-memory cache size');
    }

    if (!global.gc) {
      recommendations.push('Enable garbage collection with --expose-gc flag for better memory management');
    }

    if (!process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
      recommendations.push('Set NODE_OPTIONS="--max-old-space-size=1400" for optimal memory allocation');
    }

    return {
      configuration: this.config,
      currentUsage: usage,
      recommendations,
      healthStatus: health
    };
  }
}

// Global optimizer instance
export const azureB1Optimizer = new AzureB1Optimizer();

/**
 * Middleware factory for Azure B1 optimizations
 */
export function createAzureB1Middleware() {
  return {
    /**
     * Memory monitoring middleware
     */
    memoryCheck: (req: any, res: any, next: any) => {
      if (azureB1Optimizer.isUnderMemoryPressure()) {
        res.setHeader('X-Memory-Pressure', 'true');
        
        // Consider rejecting non-essential requests under high memory pressure
        if (req.url?.includes('/api/reports') && azureB1Optimizer.getCurrentResourceUsage().memory.percentage > 95) {
          return res.status(503).json({
            error: 'Service temporarily unavailable due to high memory usage',
            retryAfter: 60
          });
        }
      }
      next();
    },

    /**
     * Connection limiting middleware
     */
    connectionLimit: (req: any, res: any, next: any) => {
      // Add connection count headers for monitoring
      const usage = azureB1Optimizer.getCurrentResourceUsage();
      res.setHeader('X-Connection-Count', usage.connections.database + usage.connections.redis);
      next();
    },

    /**
     * Performance monitoring middleware
     */
    performanceMonitor: (req: any, res: any, next: any) => {
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
        
        // Record API metrics
        performanceMetrics.recordAPIMetrics({
          endpoint: req.url,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          userId: req.user?.id,
          rateLimited: res.getHeader('X-RateLimit-Remaining') === '0',
          cacheHit: !!res.getHeader('X-Cache-Hit')
        });
      });
      
      next();
    }
  };
}

/**
 * Environment setup for Azure B1
 */
export function setupAzureB1Environment(): void {
  // Set optimal environment variables if not already set
  if (!process.env.NODE_OPTIONS) {
    console.log('[AZURE_B1] Setting optimal Node.js options for Azure B1');
    process.env.NODE_OPTIONS = '--max-old-space-size=1400 --optimize-for-size';
  }

  // Set garbage collection options
  if (!process.env.UV_THREADPOOL_SIZE) {
    process.env.UV_THREADPOOL_SIZE = '4'; // Match Azure B1 CPU cores
  }

  // Configure Next.js for production optimizations
  if (!process.env.NEXT_TELEMETRY_DISABLED) {
    process.env.NEXT_TELEMETRY_DISABLED = '1'; // Disable telemetry to save resources
  }

  console.log('[AZURE_B1] Environment optimized for Azure B1 App Service');
}