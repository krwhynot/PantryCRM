/**
 * Azure B1 Performance Optimizer
 * 
 * Specialized performance optimization utilities for Azure SQL Basic (5 DTU) 
 * and Azure App Service B1 (1.75GB RAM) tier constraints.
 * 
 * Key Constraints:
 * - Azure SQL Basic: 5 DTU, 2GB storage, max 30 concurrent sessions
 * - Azure App Service B1: 1.75GB RAM, 1 CPU core
 * - Budget: $18/month total
 */

import { PrismaClient } from '@prisma/client';
import type { 
  OrganizationFilters,
  ContactFilters,
  InteractionFilters,
  OpportunityFilters
} from '@/types/crm';

// Define a base type for queries that can be optimized
interface OptimizableQuery {
  include?: Record<string, any>;
  where?: Record<string, any>;
  orderBy?: Record<string, any> | Record<string, any>[];
  take?: number;
  skip?: number;
  select?: Record<string, any>;
  // Prisma specific fields that might be present
  cursor?: Record<string, any>;
  distinct?: string | string[];
  // Allow any other properties as Prisma args can be extended
  [key: string]: any;
}

// =============================================================================
// QUERY OPTIMIZATION PATTERNS
// =============================================================================

/**
 * Azure SQL Basic query optimization configuration
 */
export interface AzureB1QueryConfig {
  maxComplexity: number;      // Maximum query complexity score
  maxIncludes: number;        // Maximum include depth
  maxRecords: number;         // Maximum records per query
  maxConcurrency: number;     // Maximum concurrent queries
  enableQueryPlan: boolean;   // Enable execution plan analysis
  timeoutMs: number;          // Query timeout in milliseconds
}

export const AZURE_B1_DEFAULTS: AzureB1QueryConfig = {
  maxComplexity: 100,
  maxIncludes: 3,
  maxRecords: 100,
  maxConcurrency: 5,
  enableQueryPlan: false, // Disabled for Basic tier
  timeoutMs: 30000 // 30 seconds max
};

/**
 * Query complexity calculator for Azure SQL Basic
 */
export class QueryComplexityAnalyzer {
  private config: AzureB1QueryConfig;

  constructor(config: AzureB1QueryConfig = AZURE_B1_DEFAULTS) {
    this.config = config;
  }

  /**
   * Calculate query complexity score based on operations
   */
  calculateComplexity(query: {
    includes?: Record<string, any>;
    where?: Record<string, any>;
    orderBy?: Record<string, any>;
    take?: number;
    skip?: number;
    select?: Record<string, any>;
  }): number {
    let complexity = 10; // Base complexity

    // Include complexity (expensive for 5 DTU)
    if (query.includes) {
      const includeCount = Object.keys(query.includes).length;
      complexity += includeCount * 25; // Each include adds significant cost
      
      // Nested includes are very expensive
      for (const include of Object.values(query.includes)) {
        if (typeof include === 'object' && include?.include) {
          complexity += 50; // Nested include penalty
        }
      }
    }

    // Where clause complexity
    if (query.where) {
      const whereConditions = this.countWhereConditions(query.where);
      complexity += whereConditions * 5;
    }

    // OrderBy complexity (requires sorting)
    if (query.orderBy) {
      const orderFields = Object.keys(query.orderBy).length;
      complexity += orderFields * 10;
    }

    // Large result set penalty
    if (query.take && query.take > 50) {
      complexity += Math.floor(query.take / 10);
    }

    // Skip penalty (offset queries are expensive)
    if (query.skip && query.skip > 0) {
      complexity += Math.floor(query.skip / 10);
    }

    return complexity;
  }

  private countWhereConditions(where: Record<string, any>): number {
    let count = 0;
    for (const [key, value] of Object.entries(where)) {
      if (key === 'AND' || key === 'OR') {
        if (Array.isArray(value)) {
          count += value.length;
          // Recursively count nested conditions
          value.forEach(item => {
            if (typeof item === 'object') {
              count += this.countWhereConditions(item);
            }
          });
        }
      } else {
        count += 1;
        // Complex operators add extra cost
        if (typeof value === 'object' && value !== null) {
          const operators = Object.keys(value);
          count += operators.length - 1; // First operator is free
        }
      }
    }
    return count;
  }

  /**
   * Optimize query for Azure B1 constraints
   */
  optimizeQuery<T extends OptimizableQuery>(query: T): {
    optimized: T;
    warnings: string[];
    complexity: number;
  } {
    const warnings: string[] = [];
    const optimized = { ...query };
    const originalComplexity = this.calculateComplexity(query);

    // Limit includes for performance
    if (optimized.include && Object.keys(optimized.include).length > this.config.maxIncludes) {
      const includeKeys = Object.keys(optimized.include).slice(0, this.config.maxIncludes);
      optimized.include = includeKeys.reduce((acc, key) => {
        acc[key] = optimized.include[key];
        return acc;
      }, {} as any);
      warnings.push(`Include depth limited to ${this.config.maxIncludes} for Azure B1 performance`);
    }

    // Limit result set size
    if (!optimized.take || optimized.take > this.config.maxRecords) {
      optimized.take = Math.min(optimized.take || this.config.maxRecords, this.config.maxRecords);
      warnings.push(`Result set limited to ${this.config.maxRecords} records for Azure B1`);
    }

    // Add index hints for common patterns
    if (!optimized.orderBy && optimized.take) {
      optimized.orderBy = { updatedAt: 'desc' } as any;
      warnings.push('Added default orderBy for consistent pagination');
    }

    // Optimize complex where clauses
    if (optimized.where && this.countWhereConditions(optimized.where) > 10) {
      warnings.push('Complex WHERE clause detected - consider breaking into multiple queries');
    }

    const optimizedComplexity = this.calculateComplexity(optimized);

    return {
      optimized,
      warnings,
      complexity: optimizedComplexity
    };
  }
}

// =============================================================================
// CONNECTION POOL MANAGEMENT
// =============================================================================

/**
 * Azure SQL Basic connection pool optimizer
 */
export class AzureB1ConnectionManager {
  private static instance: AzureB1ConnectionManager;
  private activeConnections = 0;
  private readonly maxConnections = 25; // Leave 5 for system operations
  private connectionQueue: Array<() => void> = [];

  private constructor() {}

  static getInstance(): AzureB1ConnectionManager {
    if (!AzureB1ConnectionManager.instance) {
      AzureB1ConnectionManager.instance = new AzureB1ConnectionManager();
    }
    return AzureB1ConnectionManager.instance;
  }

  /**
   * Acquire connection with queue management
   */
  async acquireConnection<T>(
    operation: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeOperation = async () => {
        this.activeConnections++;
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeConnections--;
          this.processQueue();
        }
      };

      if (this.activeConnections < this.maxConnections) {
        executeOperation();
      } else {
        // Add to queue based on priority
        const queueOperation = () => executeOperation();
        
        if (priority === 'high') {
          this.connectionQueue.unshift(queueOperation);
        } else {
          this.connectionQueue.push(queueOperation);
        }
      }
    });
  }

  private processQueue(): void {
    if (this.connectionQueue.length > 0 && this.activeConnections < this.maxConnections) {
      const nextOperation = this.connectionQueue.shift();
      if (nextOperation) {
        nextOperation();
      }
    }
  }

  /**
   * Get connection pool status
   */
  getStatus(): {
    activeConnections: number;
    maxConnections: number;
    queuedOperations: number;
    utilizationPercent: number;
  } {
    return {
      activeConnections: this.activeConnections,
      maxConnections: this.maxConnections,
      queuedOperations: this.connectionQueue.length,
      utilizationPercent: (this.activeConnections / this.maxConnections) * 100
    };
  }
}

// =============================================================================
// INTELLIGENT QUERY BATCHING
// =============================================================================

/**
 * Batch multiple queries to reduce DTU consumption
 */
export class QueryBatcher {
  private static pendingQueries: Map<string, {
    queries: Array<{ resolve: (value: any) => void; reject: (error: any) => void; query: any }>;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private static readonly BATCH_TIMEOUT = 50; // 50ms batching window
  private static readonly MAX_BATCH_SIZE = 10;

  /**
   * Batch similar queries together
   */
  static async batchQuery<T>(
    queryKey: string,
    query: any,
    executor: (queries: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const existingBatch = this.pendingQueries.get(queryKey);

      if (existingBatch && existingBatch.queries.length < this.MAX_BATCH_SIZE) {
        // Add to existing batch
        existingBatch.queries.push({ resolve, reject, query });
      } else {
        // Create new batch
        const newBatch = {
          queries: [{ resolve, reject, query }],
          timeout: setTimeout(() => {
            this.executeBatch(queryKey, executor);
          }, this.BATCH_TIMEOUT)
        };
        
        this.pendingQueries.set(queryKey, newBatch);
      }
    });
  }

  private static async executeBatch<T>(
    queryKey: string,
    executor: (queries: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.pendingQueries.get(queryKey);
    if (!batch) return;

    this.pendingQueries.delete(queryKey);
    clearTimeout(batch.timeout);

    try {
      const queries = batch.queries.map(q => q.query);
      const results = await executor(queries);

      // Resolve individual promises
      batch.queries.forEach((queryItem, index) => {
        queryItem.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises in batch
      batch.queries.forEach(queryItem => {
        queryItem.reject(error);
      });
    }
  }
}

// =============================================================================
// SPECIALIZED CRM QUERY OPTIMIZERS
// =============================================================================

/**
 * Organization query optimizer for Food Service CRM
 */
export class OrganizationQueryOptimizer {
  private analyzer: QueryComplexityAnalyzer;

  constructor() {
    this.analyzer = new QueryComplexityAnalyzer();
  }

  /**
   * Optimize organization list query for Azure B1
   */
  optimizeListQuery(filters: OrganizationFilters) {
    const baseQuery: any = {
      where: this.buildWhereClause(filters),
      include: {
        // Limit includes for performance
        contacts: {
          where: { isPrimary: true },
          take: 1,
          select: { id: true, firstName: true, lastName: true, email: true }
        }
        // Skip interactions and opportunities for list view
      },
      orderBy: this.buildOrderBy(filters),
      take: Math.min(filters.limit || 20, 100),
      skip: ((filters.page || 1) - 1) * (filters.limit || 20)
    };

    return this.analyzer.optimizeQuery(baseQuery);
  }

  /**
   * Optimize organization detail query
   */
  optimizeDetailQuery(organizationId: string) {
    const baseQuery: any = {
      where: { id: organizationId },
      include: {
        contacts: {
          orderBy: { isPrimary: 'desc' },
          take: 10 // Limit for performance
        },
        interactions: {
          orderBy: { date: 'desc' },
          take: 5, // Recent interactions only
          include: {
            contact: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        opportunities: {
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' },
          take: 5
        }
        // Skip leads and contracts for initial load
      }
    };

    return this.analyzer.optimizeQuery(baseQuery);
  }

  private buildWhereClause(filters: OrganizationFilters): any {
    const where: any = {};

    // Text search optimization
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } }
      ];
    }

    // Simple filters (indexed)
    if (filters.priority?.length) {
      where.priority = { in: filters.priority };
    }

    if (filters.segment?.length) {
      where.segment = { in: filters.segment };
    }

    if (filters.type?.length) {
      where.type = { in: filters.type };
    }

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    // Date range filters (use indexed fields)
    if (filters.lastContactedAfter || filters.lastContactedBefore) {
      where.lastContactDate = {};
      if (filters.lastContactedAfter) {
        where.lastContactDate.gte = filters.lastContactedAfter;
      }
      if (filters.lastContactedBefore) {
        where.lastContactDate.lte = filters.lastContactedBefore;
      }
    }

    // Revenue range filters
    if (filters.estimatedRevenueMin || filters.estimatedRevenueMax) {
      where.estimatedRevenue = {};
      if (filters.estimatedRevenueMin) {
        where.estimatedRevenue.gte = filters.estimatedRevenueMin;
      }
      if (filters.estimatedRevenueMax) {
        where.estimatedRevenue.lte = filters.estimatedRevenueMax;
      }
    }

    return where;
  }

  private buildOrderBy(filters: OrganizationFilters): any {
    const sortBy = filters.sortBy || 'updatedAt';
    const sortOrder = filters.sortOrder || 'desc';

    // Use indexed fields for sorting
    const indexedSorts = ['name', 'priority', 'updatedAt', 'lastContactDate'];
    const actualSortBy = indexedSorts.includes(sortBy) ? sortBy : 'updatedAt';

    return { [actualSortBy]: sortOrder };
  }
}

/**
 * Performance monitoring for Azure B1
 */
export class AzureB1PerformanceMonitor {
  private static metrics: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
    errors: number;
  }> = new Map();

  /**
   * Track query performance
   */
  static async trackQuery<T>(
    operation: string,
    query: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await query();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.updateMetrics(operation, duration, false);

      // Warn about slow queries on Azure B1
      if (duration > 1000) {
        console.warn(`Slow query detected: ${operation} took ${duration.toFixed(2)}ms on Azure B1`);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.updateMetrics(operation, duration, true);
      
      console.error(`Query failed: ${operation} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  private static updateMetrics(operation: string, duration: number, isError: boolean): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      errors: 0
    };

    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    existing.maxTime = Math.max(existing.maxTime, duration);
    
    if (isError) {
      existing.errors++;
    }

    this.metrics.set(operation, existing);
  }

  /**
   * Get performance report for Azure B1 optimization
   */
  static getPerformanceReport(): {
    operations: Array<{
      name: string;
      count: number;
      avgTime: number;
      maxTime: number;
      errorRate: number;
      recommendation: string;
    }>;
    summary: {
      totalOperations: number;
      averageResponseTime: number;
      slowOperations: number;
      errorRate: number;
    };
  } {
    const operations = Array.from(this.metrics.entries()).map(([name, metrics]) => ({
      name,
      count: metrics.count,
      avgTime: Math.round(metrics.avgTime),
      maxTime: Math.round(metrics.maxTime),
      errorRate: (metrics.errors / metrics.count) * 100,
      recommendation: this.getRecommendation({ avgTime: metrics.avgTime, maxTime: metrics.maxTime, errorRate: (metrics.errors / metrics.count) * 100 || 0 })
    }));

    const totalCount = operations.reduce((sum, op) => sum + op.count, 0);
    const totalTime = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.totalTime, 0);
    const totalErrors = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.errors, 0);

    return {
      operations: operations.sort((a, b) => b.avgTime - a.avgTime),
      summary: {
        totalOperations: totalCount,
        averageResponseTime: totalCount > 0 ? Math.round(totalTime / totalCount) : 0,
        slowOperations: operations.filter(op => op.avgTime > 1000).length,
        errorRate: totalCount > 0 ? (totalErrors / totalCount) * 100 : 0
      }
    };
  }

  private static getRecommendation(metrics: {
    avgTime: number;
    maxTime: number;
    errorRate: number;
  }): string {
    if (metrics.errorRate > 5) {
      return 'High error rate - check query logic and constraints';
    }
    if (metrics.avgTime > 2000) {
      return 'Very slow - consider query optimization or caching';
    }
    if (metrics.avgTime > 1000) {
      return 'Slow on Azure B1 - consider reducing complexity';
    }
    if (metrics.maxTime > 5000) {
      return 'Occasional timeouts - add query limits';
    }
    return 'Performance acceptable for Azure B1';
  }
}
