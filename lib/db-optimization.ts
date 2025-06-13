/**
 * Database optimization utilities for Azure B1 performance
 * 
 * Provides query optimization, pagination, and caching strategies
 * optimized for single-core, 1.75GB RAM constraints
 */

import { prismadb } from './prisma';
import { cachedQuery, CacheKeys, CacheStrategies } from './cache';

// Query pagination for memory efficiency
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Safe pagination with B1 memory constraints
 */
export function createPagination(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(
    options.limit || 20,
    options.maxLimit || 100 // Limit max results for B1
  );
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit,
  };
}

/**
 * Optimized search with full-text search capabilities
 */
export async function optimizedSearch<T extends Record<string, any>>(
  model: any,
  searchTerm: string,
  searchFields: string[],
  options: {
    pagination?: PaginationOptions;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
    select?: Record<string, boolean>;
    include?: Record<string, any>;
    userId?: string;
  } = {}
): Promise<PaginationResult<T>> {
  const { pagination: paginationOpts = {}, userId, ...queryOptions } = options;
  const pagination = createPagination(paginationOpts);
  
  // Create cache key for search
  const cacheKey = CacheKeys.search(
    `${searchTerm}-${JSON.stringify(queryOptions)}-${pagination.page}`,
    userId
  );

  return cachedQuery(
    cacheKey,
    async () => {
      // Build where clause for search
      const searchWhere = searchTerm
        ? {
            OR: searchFields.map(field => ({
              [field]: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            })),
          }
        : {};

      const where = {
        ...searchWhere,
        ...options.where,
      };

      // Execute count and data queries in parallel for efficiency
      const [total, data] = await Promise.all([
        model.count({ where }),
        model.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: options.orderBy || { updatedAt: 'desc' },
          select: options.select,
          include: options.include,
          // Add relation optimization for better performance
          ...(options.include && { relationLoadStrategy: 'join' as const }),
        }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    },
    CacheStrategies.SEARCH
  );
}

/**
 * Optimized single record fetch with caching
 */
export async function optimizedFindUnique<T>(
  model: any,
  where: Record<string, any>,
  options: {
    select?: Record<string, boolean>;
    include?: Record<string, any>;
    cacheKey?: string;
    ttl?: number;
  } = {}
): Promise<T | null> {
  const cacheKey = options.cacheKey || `${model.name}:${JSON.stringify(where)}`;
  
  return cachedQuery(
    cacheKey,
    () => model.findUnique({
      where,
      select: options.select,
      include: options.include,
      // Add relation optimization for better performance
      ...(options.include && { relationLoadStrategy: 'join' as const }),
    }),
    options.ttl || CacheStrategies.FAST
  );
}

/**
 * Batch operations for efficiency
 */
export class BatchOperations {
  private static readonly BATCH_SIZE = 25; // Optimized for Azure Basic 5 DTU limit

  static async batchCreate<T>(
    model: any,
    data: any[],
    options: { skipDuplicates?: boolean } = {}
  ): Promise<T[]> {
    const results: T[] = [];
    
    // Process in small batches to avoid memory issues
    for (let i = 0; i < data.length; i += this.BATCH_SIZE) {
      const batch = data.slice(i, i + this.BATCH_SIZE);
      
      try {
        const batchResult = await model.createMany({
          data: batch,
          skipDuplicates: options.skipDuplicates,
        });
        
        results.push(...batchResult);
      } catch (error) {
        console.error(`Batch create failed for batch ${i / this.BATCH_SIZE + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  static async batchUpdate<T>(
    model: any,
    updates: Array<{ where: any; data: any }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    // Use transaction for consistency
    await prismadb.$transaction(async (tx) => {
      for (const update of updates) {
        const result = await tx[model.name].update(update);
        results.push(result);
      }
    });
    
    return results;
  }
}

/**
 * Query performance analyzer
 */
export class QueryAnalyzer {
  private static queryLog: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }> = [];

  static logQuery(query: string, duration: number) {
    this.queryLog.push({
      query,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 100 queries to avoid memory issues
    if (this.queryLog.length > 100) {
      this.queryLog = this.queryLog.slice(-100);
    }
  }

  static getSlowQueries(thresholdMs = 1000) {
    return this.queryLog
      .filter(log => log.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration);
  }

  static getQueryStats() {
    if (this.queryLog.length === 0) return null;

    const durations = this.queryLog.map(log => log.duration);
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    
    return {
      totalQueries: this.queryLog.length,
      averageDuration: Math.round(total / durations.length),
      slowQueries: this.getSlowQueries().length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
    };
  }
}

/**
 * Database health monitoring for B1 constraints
 */
export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    await prismadb.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - start;

    const stats = QueryAnalyzer.getQueryStats();

    return {
      status: 'healthy',
      connectionTime,
      queryStats: stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Connection pool monitoring
 */
export function getConnectionPoolStats() {
  // Note: Actual connection pool stats would require Prisma extensions
  // This is a placeholder for monitoring setup
  return {
    activeConnections: 'N/A',
    idleConnections: 'N/A',
    totalConnections: 'N/A',
    maxConnections: 5, // Our B1 optimized limit
  };
}

/**
 * Index recommendations based on query patterns
 */
export function getIndexRecommendations() {
  const slowQueries = QueryAnalyzer.getSlowQueries();
  const recommendations: string[] = [];

  // Analyze common patterns in slow queries
  const commonFilters = new Map<string, number>();
  
  slowQueries.forEach(log => {
    // This would require more sophisticated query parsing
    // For now, provide general recommendations
    if (log.query.includes('WHERE')) {
      recommendations.push('Consider adding indexes on frequently filtered columns');
    }
    if (log.query.includes('ORDER BY')) {
      recommendations.push('Consider adding indexes on sorted columns');
    }
  });

  return Array.from(new Set(recommendations));
}

/**
 * Optimized opportunity queries with proper relation loading
 */
export async function getOptimizedOpportunities(options: {
  include?: {
    organization?: boolean;
    contact?: boolean;
  };
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  pagination?: PaginationOptions;
}) {
  const pagination = createPagination(options.pagination);
  
  return prismadb.opportunity.findMany({
    where: options.where,
    include: options.include,
    // Use join strategy for optimal performance with relations
    relationLoadStrategy: 'join',
    orderBy: options.orderBy || { updatedAt: 'desc' },
    skip: pagination.skip,
    take: pagination.take,
  });
}

/**
 * Optimized contact queries with proper relation loading
 */
export async function getOptimizedContacts(options: {
  include?: {
    organization?: boolean;
    opportunities?: boolean;
    interactions?: boolean;
  };
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  pagination?: PaginationOptions;
}) {
  const pagination = createPagination(options.pagination);
  
  return prismadb.contact.findMany({
    where: options.where,
    include: options.include,
    // Use join strategy for optimal performance with relations
    relationLoadStrategy: 'join',
    orderBy: options.orderBy || { updatedAt: 'desc' },
    skip: pagination.skip,
    take: pagination.take,
  });
}

// Export query optimization utilities
export const QueryOptimization = {
  optimizedSearch,
  optimizedFindUnique,
  getOptimizedOpportunities,
  getOptimizedContacts,
  BatchOperations,
  QueryAnalyzer,
  checkDatabaseHealth,
  getConnectionPoolStats,
  getIndexRecommendations,
} as const;