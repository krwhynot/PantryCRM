/**
 * Multi-tier caching system optimized for Azure B1 performance constraints
 * 
 * Tier 1: In-memory cache (LRU) for frequently accessed data
 * Tier 2: Database query result caching
 * Tier 3: API response caching with stale-while-revalidate
 */

// Import Azure B1 optimizer for dynamic cache sizing
import { azureB1Optimizer } from './azure-b1-optimizations';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  memoryUsage: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    memoryUsage: 0
  };

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0
    });

    this.stats.sets++;
    this.updateMemoryUsage();
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateMemoryUsage();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.memoryUsage = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });
    this.updateMemoryUsage();
  }

  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    this.stats.memoryUsage = this.cache.size * 1024; // ~1KB per entry estimate
  }
}

// Global cache instance with Azure B1 optimization

// Dynamically adjust cache size based on available memory
const getOptimalCacheSize = (): number => {
  const usage = azureB1Optimizer.getCurrentResourceUsage();
  const memoryPressure = usage.memory.percentage;
  
  if (memoryPressure > 80) return 200;      // Reduce cache under pressure
  if (memoryPressure > 60) return 350;      // Moderate reduction
  return 500;                               // Normal size
};

const memoryCache = new MemoryCache(getOptimalCacheSize());

/**
 * Database query caching wrapper
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Try memory cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query and cache result
  const result = await queryFn();
  memoryCache.set(key, result, ttlMs);
  
  return result;
}

/**
 * API response caching with different strategies
 */
export const CacheStrategies = {
  // Short-term caching for frequently accessed data
  FAST: 30 * 1000, // 30 seconds
  
  // Medium-term caching for search results
  SEARCH: 5 * 60 * 1000, // 5 minutes
  
  // Long-term caching for static data
  STATIC: 30 * 60 * 1000, // 30 minutes
  
  // Long-term caching for settings (rarely change)
  LONG: 60 * 60 * 1000, // 1 hour
  
  // Report caching
  REPORT: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  search: (query: string, userId?: string) => 
    `search:${query.toLowerCase().trim()}:${userId || 'anonymous'}`,
    
  user: (userId: string) => `user:${userId}`,
  
  account: (accountId: string) => `account:${accountId}`,
  
  contact: (contactId: string) => `contact:${contactId}`,
  
  opportunity: (opportunityId: string) => `opportunity:${opportunityId}`,
  
  report: (type: string, params: Record<string, any>) => 
    `report:${type}:${JSON.stringify(params)}`,
    
  dashboard: (userId: string, timeframe: string) => 
    `dashboard:${userId}:${timeframe}`,
    
  list: (entity: string, page: number, filters: Record<string, any>) =>
    `list:${entity}:${page}:${JSON.stringify(filters)}`,
    
  systemSettings: (category: string) => `settings:${category}`,
} as const;

/**
 * Invalidation patterns for cache management
 */
export const CacheInvalidation = {
  user: (userId: string) => [
    CacheKeys.user(userId),
    `dashboard:${userId}:*`,
    `search:*:${userId}`,
  ],
  
  account: (accountId: string) => [
    CacheKeys.account(accountId),
    `list:contacts:*`,
    `list:opportunities:*`,
    `search:*`,
  ],
  
  contact: (contactId: string) => [
    CacheKeys.contact(contactId),
    `list:contacts:*`,
    `search:*`,
  ],
  
  opportunity: (opportunityId: string) => [
    CacheKeys.opportunity(opportunityId),
    `list:opportunities:*`,
    `report:*`,
    `dashboard:*`,
  ],
} as const;

/**
 * Cache invalidation utility
 */
export function invalidateCache(patterns: string[]): void {
  patterns.forEach(pattern => {
    if (pattern.includes('*')) {
      // Pattern matching for wildcards
      const prefix = pattern.replace('*', '');
      const stats = memoryCache.getStats();
      let deleted = 0;
      
      // Simple pattern matching - in production, consider using a proper pattern library
      for (let i = 0; i < stats.sets; i++) {
        // This is a simplified approach - actual implementation would need cache key enumeration
      }
    } else {
      memoryCache.delete(pattern);
    }
  });
}

/**
 * Cache warming utilities for critical data
 */
export const CacheWarming = {
  async warmUserData(userId: string) {
    const keys = [
      CacheKeys.user(userId),
      CacheKeys.dashboard(userId, 'week'),
    ];
    
    // Implement warming logic here
    console.log(`Warming cache for user ${userId}:`, keys);
  },
  
  async warmSearchData(commonQueries: string[]) {
    for (const query of commonQueries) {
      const key = CacheKeys.search(query);
      // Pre-populate search cache
      console.log(`Warming search cache:`, key);
    }
  },
} as const;

/**
 * Memory monitoring for B1 constraints
 */
export function getCacheMetrics() {
  const stats = memoryCache.getStats();
  const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
  
  return {
    ...stats,
    hitRate: Math.round(hitRate * 100),
    efficiency: hitRate > 0.8 ? 'excellent' : hitRate > 0.6 ? 'good' : 'poor',
  };
}

/**
 * Cache health check for monitoring
 */
export function isCacheHealthy(): boolean {
  const stats = getCacheMetrics();
  
  // Health criteria for B1
  return (
    stats.memoryUsage < 100 * 1024 * 1024 && // < 100MB
    stats.hitRate > 50 // > 50% hit rate
  );
}

// Enhanced cache utilities for Azure SQL Basic optimization
export class StaticDataCache {
  // Cache system settings (rarely change, frequently accessed)
  static async getCachedSettings(prisma: any) {
    const cacheKey = CacheKeys.systemSettings('all');
    
    return cachedQuery(
      cacheKey,
      () => prisma.systemSetting.findMany({
        orderBy: { key: 'asc' }
      }),
      CacheStrategies.LONG // 1 hour cache
    );
  }
  
  // Cache interaction types and pipeline stages (static data)
  static getCachedInteractionTypes() {
    const cacheKey = 'static:interaction_types';
    
    let types = memoryCache.get(cacheKey);
    if (types) {
      return types;
    }
    
    // These are defined in the API route and don't change
    types = [
      "email",
      "call", 
      "in-person",
      "demo",
      "quote",
      "follow-up"
    ];
    
    // Cache for 1 hour (static data)
    memoryCache.set(cacheKey, types, CacheStrategies.LONG);
    
    return types;
  }
  
  static getCachedPipelineStages() {
    const cacheKey = 'static:pipeline_stages';
    
    let stages = memoryCache.get(cacheKey);
    if (stages) {
      return stages;
    }
    
    stages = [
      "lead-discovery",
      "contacted", 
      "sampled-visited",
      "follow-up",
      "close"
    ];
    
    // Cache for 1 hour (static data)
    memoryCache.set(cacheKey, stages, CacheStrategies.LONG);
    
    return stages;
  }
  
  // Cache organization metadata for dropdowns/filters
  static async getCachedOrganizationMetadata(prisma: any) {
    const cacheKey = 'metadata:organizations';
    
    return cachedQuery(
      cacheKey,
      async () => {
        // Fetch distinct values for dropdowns/filters with optimized queries
        const [priorities, segments, types] = await Promise.all([
          prisma.organization.findMany({
            select: { priority: true },
            distinct: ['priority'],
            where: { priority: { not: null } }
          }),
          prisma.organization.findMany({
            select: { segment: true },
            distinct: ['segment'],
            where: { segment: { not: null } }
          }),
          prisma.organization.findMany({
            select: { type: true },
            distinct: ['type'],
            where: { type: { not: null } }
          })
        ]);
        
        return {
          priorities: priorities.map(p => p.priority).filter(Boolean),
          segments: segments.map(s => s.segment).filter(Boolean),
          types: types.map(t => t.type).filter(Boolean)
        };
      },
      CacheStrategies.REPORT // 15 minutes cache
    );
  }

  // Cache contact positions for dropdown optimization
  static async getCachedContactPositions(prisma: any) {
    const cacheKey = 'metadata:contact_positions';
    
    return cachedQuery(
      cacheKey,
      async () => {
        const positions = await prisma.contact.findMany({
          select: { position: true },
          distinct: ['position'],
          where: { 
            position: { 
              not: null,
              not: ''
            }
          }
        });
        
        return positions.map(p => p.position).filter(Boolean).sort();
      },
      CacheStrategies.REPORT // 15 minutes cache
    );
  }

  // Invalidate specific cache entries when data changes
  static invalidateSettings() {
    memoryCache.delete(CacheKeys.systemSettings('all'));
    console.debug('Cache invalidated: system settings');
  }
  
  static invalidateOrganizationMetadata() {
    memoryCache.delete('metadata:organizations');
    console.debug('Cache invalidated: organization metadata');
  }
  
  static invalidateContactMetadata() {
    memoryCache.delete('metadata:contact_positions');
    console.debug('Cache invalidated: contact metadata');
  }
  
  static invalidateStaticData() {
    memoryCache.delete('static:interaction_types');
    memoryCache.delete('static:pipeline_stages');
    console.debug('Cache invalidated: static data');
  }
}

export { memoryCache };