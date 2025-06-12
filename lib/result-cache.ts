/**
 * In-memory result caching for search operations
 * Optimized for Azure B1 app service memory constraints
 * Prevents repeated expensive database queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
  memoryUsage: number;
}

class ResultCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(maxEntries = 100, ttlMs = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Generate cache key from search parameters
   */
  private generateKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${operation}:${sortedParams}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get<T>(operation: string, params: Record<string, any>): T | null {
    const key = this.generateKey(operation, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit statistics
    entry.hits++;
    this.hits++;
    return entry.data;
  }

  /**
   * Store result in cache
   */
  set<T>(operation: string, params: Record<string, any>, data: T): void {
    const key = this.generateKey(operation, params);

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Execute function with caching
   */
  async withCache<T>(
    operation: string,
    params: Record<string, any>,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(operation, params);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fetchFn();
    this.set(operation, params, result);
    return result;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      totalEntries: this.cache.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage in bytes (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 string
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 24; // Approximate overhead for entry object
    }
    return totalSize;
  }
}

// Global cache instance
export const resultCache = new ResultCache(
  100,  // Max 100 entries (optimized for Azure B1 memory)
  5 * 60 * 1000  // 5 minute TTL
);

// Convenience functions for common operations
export const cacheSearch = <T>(params: Record<string, any>, fetchFn: () => Promise<T>) =>
  resultCache.withCache('search', params, fetchFn);

export const cacheDashboard = <T>(params: Record<string, any>, fetchFn: () => Promise<T>) =>
  resultCache.withCache('dashboard', params, fetchFn);

export const cacheOrganizations = <T>(params: Record<string, any>, fetchFn: () => Promise<T>) =>
  resultCache.withCache('organizations', params, fetchFn);

export const cacheContacts = <T>(params: Record<string, any>, fetchFn: () => Promise<T>) =>
  resultCache.withCache('contacts', params, fetchFn);