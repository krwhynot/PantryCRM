/**
 * Azure B1 Caching Framework
 * 
 * Memory-efficient caching system designed for Azure App Service B1 
 * (1.75GB RAM) constraints with intelligent cache management.
 */

import { LRUCache } from 'lru-cache';
import type { 
  OrganizationWithDetails,
  OrganizationSummary,
  ContactWithDetails,
  InteractionSummary,
  ChartDataPoint,
  DashboardMetrics
} from '@/types/crm';

// =============================================================================
// CACHE CONFIGURATION FOR AZURE B1
// =============================================================================

/**
 * Azure B1 memory allocation strategy
 * Total: 1.75GB RAM
 * - Node.js runtime: ~400MB
 * - Next.js framework: ~300MB  
 * - Application code: ~200MB
 * - Available for caching: ~850MB
 * - Safety buffer: ~150MB
 * - Cache allocation: ~700MB
 */
export const AZURE_B1_CACHE_CONFIG = {
  // Main entity caches
  organizations: {
    maxSize: 1000,        // ~200MB (200KB per organization with details)
    ttl: 1000 * 60 * 15,  // 15 minutes
    maxMemory: 200 * 1024 * 1024 // 200MB
  },
  
  organizationLists: {
    maxSize: 100,         // ~50MB (500KB per list query)
    ttl: 1000 * 60 * 5,   // 5 minutes
    maxMemory: 50 * 1024 * 1024 // 50MB
  },
  
  contacts: {
    maxSize: 2000,        // ~100MB (50KB per contact)
    ttl: 1000 * 60 * 10,  // 10 minutes
    maxMemory: 100 * 1024 * 1024 // 100MB
  },
  
  interactions: {
    maxSize: 1000,        // ~50MB (50KB per interaction)
    ttl: 1000 * 60 * 5,   // 5 minutes (interactions change frequently)
    maxMemory: 50 * 1024 * 1024 // 50MB
  },
  
  dashboard: {
    maxSize: 50,          // ~25MB (500KB per dashboard)
    ttl: 1000 * 60 * 2,   // 2 minutes (needs to be fresh)
    maxMemory: 25 * 1024 * 1024 // 25MB
  },
  
  charts: {
    maxSize: 200,         // ~100MB (500KB per chart)
    ttl: 1000 * 60 * 10,  // 10 minutes
    maxMemory: 100 * 1024 * 1024 // 100MB
  },
  
  search: {
    maxSize: 500,         // ~75MB (150KB per search result)
    ttl: 1000 * 60 * 3,   // 3 minutes
    maxMemory: 75 * 1024 * 1024 // 75MB
  }
};

// =============================================================================
// INTELLIGENT CACHE MANAGER
// =============================================================================

export class AzureB1CacheManager {
  private static instance: AzureB1CacheManager;
  private caches: Map<string, LRUCache<string, any>>;
  private memoryUsage: Map<string, number>;
  private totalMemoryLimit: number;
  private hitRates: Map<string, { hits: number; misses: number }>;

  private constructor() {
    this.caches = new Map();
    this.memoryUsage = new Map();
    this.totalMemoryLimit = 700 * 1024 * 1024; // 700MB total cache limit
    this.hitRates = new Map();
    this.initializeCaches();
    this.startMemoryMonitoring();
  }

  static getInstance(): AzureB1CacheManager {
    if (!AzureB1CacheManager.instance) {
      AzureB1CacheManager.instance = new AzureB1CacheManager();
    }
    return AzureB1CacheManager.instance;
  }

  private initializeCaches(): void {
    Object.entries(AZURE_B1_CACHE_CONFIG).forEach(([name, config]) => {
      const cache = new LRUCache<string, any>({
        max: config.maxSize,
        ttl: config.ttl,
        sizeCalculation: (value) => this.calculateSize(value),
        maxSize: config.maxMemory,
        dispose: (value, key) => {
          // Update memory usage when items are evicted
          const size = this.calculateSize(value);
          const currentUsage = this.memoryUsage.get(name) || 0;
          this.memoryUsage.set(name, Math.max(0, currentUsage - size));
        }
      });

      this.caches.set(name, cache);
      this.memoryUsage.set(name, 0);
      this.hitRates.set(name, { hits: 0, misses: 0 });
    });
  }

  /**
   * Calculate memory size of cached objects
   */
  private calculateSize(value: any): number {
    try {
      // Rough estimation of JSON serialized size
      const jsonString = JSON.stringify(value);
      return jsonString.length * 2; // UTF-16, so 2 bytes per character
    } catch {
      // Fallback for circular references or non-serializable objects
      return 1024; // 1KB fallback
    }
  }

  /**
   * Smart cache key generation
   */
  private generateCacheKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as any);
    
    const paramsString = JSON.stringify(sortedParams);
    // Use a simple hash for shorter keys
    const hash = this.simpleHash(paramsString);
    return `${prefix}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached value with hit/miss tracking
   */
  get<T>(cacheName: string, key: string): T | undefined {
    const cache = this.caches.get(cacheName);
    if (!cache) return undefined;

    const value = cache.get(key);
    const hitRate = this.hitRates.get(cacheName)!;

    if (value !== undefined) {
      hitRate.hits++;
      return value as T;
    } else {
      hitRate.misses++;
      return undefined;
    }
  }

  /**
   * Set cached value with memory management
   */
  set<T>(cacheName: string, key: string, value: T): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) return false;

    const size = this.calculateSize(value);
    const config = AZURE_B1_CACHE_CONFIG[cacheName as keyof typeof AZURE_B1_CACHE_CONFIG];
    
    if (!config) return false;

    // Check if adding this item would exceed memory limits
    const currentUsage = this.memoryUsage.get(cacheName) || 0;
    const totalUsage = Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0);

    if (totalUsage + size > this.totalMemoryLimit) {
      // Memory pressure - trigger aggressive cleanup
      this.handleMemoryPressure();
    }

    if (currentUsage + size > config.maxMemory) {
      // This cache is full - let LRU evict items
      console.warn(`Cache ${cacheName} approaching memory limit. Current: ${(currentUsage / 1024 / 1024).toFixed(1)}MB`);
    }

    try {
      cache.set(key, value);
      this.memoryUsage.set(cacheName, currentUsage + size);
      return true;
    } catch (error) {
      console.error(`Failed to cache item in ${cacheName}:`, error);
      return false;
    }
  }

  /**
   * Handle memory pressure by aggressive cleanup
   */
  private handleMemoryPressure(): void {
    console.warn('Azure B1 cache memory pressure detected - performing cleanup');

    // Clear least important caches first
    const priorityOrder = ['search', 'interactions', 'charts', 'dashboard', 'organizationLists', 'contacts', 'organizations'];
    
    for (const cacheName of priorityOrder) {
      const cache = this.caches.get(cacheName);
      if (cache) {
        const beforeSize = cache.size;
        cache.clear();
        this.memoryUsage.set(cacheName, 0);
        
        const totalUsage = Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0);
        console.log(`Cleared ${cacheName} cache (${beforeSize} items). Total memory: ${(totalUsage / 1024 / 1024).toFixed(1)}MB`);
        
        // Stop if we've freed enough memory
        if (totalUsage < this.totalMemoryLimit * 0.7) {
          break;
        }
      }
    }
  }

  /**
   * Cache organizations with smart invalidation
   */
  async cacheOrganization(org: OrganizationWithDetails): Promise<void> {
    this.set('organizations', org.id, org);
    
    // Also cache in organization lists (invalidate relevant lists)
    this.invalidateOrganizationLists(org);
  }

  /**
   * Cache organization list results
   */
  async cacheOrganizationList(
    filters: any,
    organizations: OrganizationSummary[],
    total: number
  ): Promise<void> {
    const key = this.generateCacheKey('list', filters);
    this.set('organizationLists', key, {
      organizations,
      total,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached organization list
   */
  getCachedOrganizationList(filters: any): {
    organizations: OrganizationSummary[];
    total: number;
  } | undefined {
    const key = this.generateCacheKey('list', filters);
    return this.get('organizationLists', key);
  }

  /**
   * Cache dashboard metrics with short TTL
   */
  async cacheDashboardMetrics(userId: string, metrics: DashboardMetrics): Promise<void> {
    this.set('dashboard', `metrics:${userId}`, metrics);
  }

  /**
   * Cache chart data with compression
   */
  async cacheChartData(
    chartType: string,
    params: any,
    data: ChartDataPoint[]
  ): Promise<void> {
    const key = this.generateCacheKey(`chart:${chartType}`, params);
    
    // Compress chart data for storage efficiency
    const compressedData = this.compressChartData(data);
    this.set('charts', key, compressedData);
  }

  /**
   * Get cached chart data
   */
  getCachedChartData(chartType: string, params: any): ChartDataPoint[] | undefined {
    const key = this.generateCacheKey(`chart:${chartType}`, params);
    const compressed = this.get<any>('charts', key);
    
    if (compressed) {
      return this.decompressChartData(compressed);
    }
    
    return undefined;
  }

  private compressChartData(data: ChartDataPoint[]): any {
    // Simple compression - store only essential fields
    return {
      compressed: true,
      data: data.map(point => ({
        n: point.name,
        v: point.value,
        c: point.category
      }))
    };
  }

  private decompressChartData(compressed: any): ChartDataPoint[] {
    if (!compressed.compressed) return compressed;
    
    return compressed.data.map((point: any) => ({
      name: point.n,
      value: point.v,
      category: point.c
    }));
  }

  /**
   * Invalidate related caches when organization changes
   */
  private invalidateOrganizationLists(org: OrganizationWithDetails): void {
    const listCache = this.caches.get('organizationLists');
    if (!listCache) return;

    // Clear all organization list caches (simple but effective for Azure B1)
    listCache.clear();
    this.memoryUsage.set('organizationLists', 0);
  }

  /**
   * Start memory monitoring for Azure B1
   */
  private startMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    setInterval(() => {
      const totalUsage = Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0);
      const usagePercent = (totalUsage / this.totalMemoryLimit) * 100;

      if (usagePercent > 85) {
        console.warn(`High cache memory usage: ${usagePercent.toFixed(1)}% (${(totalUsage / 1024 / 1024).toFixed(1)}MB)`);
        this.handleMemoryPressure();
      }

      // Log memory stats in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Cache Memory Usage:', Object.fromEntries(
          Array.from(this.memoryUsage.entries()).map(([name, usage]) => [
            name, 
            `${(usage / 1024 / 1024).toFixed(1)}MB`
          ])
        ));
      }
    }, 30000);
  }

  /**
   * Get cache performance statistics
   */
  getStats(): {
    memory: {
      total: string;
      used: string;
      usagePercent: number;
      byCache: Record<string, string>;
    };
    hitRates: Record<string, {
      hits: number;
      misses: number;
      hitRate: string;
    }>;
    cacheInfo: Record<string, {
      size: number;
      maxSize: number;
      ttl: number;
    }>;
  } {
    const totalUsage = Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0);
    
    const memory = {
      total: `${(this.totalMemoryLimit / 1024 / 1024).toFixed(1)}MB`,
      used: `${(totalUsage / 1024 / 1024).toFixed(1)}MB`,
      usagePercent: (totalUsage / this.totalMemoryLimit) * 100,
      byCache: Object.fromEntries(
        Array.from(this.memoryUsage.entries()).map(([name, usage]) => [
          name,
          `${(usage / 1024 / 1024).toFixed(1)}MB`
        ])
      )
    };

    const hitRates = Object.fromEntries(
      Array.from(this.hitRates.entries()).map(([name, stats]) => [
        name,
        {
          ...stats,
          hitRate: stats.hits + stats.misses > 0 
            ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`
            : '0%'
        }
      ])
    );

    const cacheInfo = Object.fromEntries(
      Array.from(this.caches.entries()).map(([name, cache]) => [
        name,
        {
          size: cache.size,
          maxSize: cache.max || 0,
          ttl: AZURE_B1_CACHE_CONFIG[name as keyof typeof AZURE_B1_CACHE_CONFIG]?.ttl || 0
        }
      ])
    );

    return { memory, hitRates, cacheInfo };
  }

  /**
   * Clear all caches (for testing or memory emergencies)
   */
  clearAll(): void {
    this.caches.forEach((cache, name) => {
      cache.clear();
      this.memoryUsage.set(name, 0);
    });
    console.log('All caches cleared');
  }
}

// =============================================================================
// CACHE DECORATORS AND UTILITIES
// =============================================================================

/**
 * Decorator for caching function results
 */
export function cacheResult(
  cacheName: string,
  keyGenerator: (...args: any[]) => string,
  ttlMs?: number
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = (async function (this: any, ...args: any[]) {
      const cache = AzureB1CacheManager.getInstance();
      const key = keyGenerator(...args);
      
      // Try to get from cache first
      const cached = cache.get(cacheName, key);
      if (cached !== undefined) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await method.apply(this, args);
      cache.set(cacheName, key, result);
      
      return result;
    }) as T;
  };
}

/**
 * Simple cache wrapper for functions
 */
export async function withCache<T>(
  cacheName: string,
  key: string,
  getter: () => Promise<T>,
  options?: { force?: boolean }
): Promise<T> {
  const cache = AzureB1CacheManager.getInstance();
  
  if (!options?.force) {
    const cached = cache.get<T>(cacheName, key);
    if (cached !== undefined) {
      return cached;
    }
  }
  
  const result = await getter();
  cache.set(cacheName, key, result);
  return result;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  AzureB1CacheManager,
  cacheResult,
  withCache
};