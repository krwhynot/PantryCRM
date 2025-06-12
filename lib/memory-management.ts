/**
 * Memory management utilities optimized for Azure B1 constraints
 * 
 * Provides garbage collection optimization, memory monitoring,
 * and cleanup strategies for 1.75GB RAM limit
 */

import { logger } from './monitoring';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  usagePercentage: number;
  timestamp: number;
}

interface MemoryPressureConfig {
  warningThreshold: number; // Percentage
  criticalThreshold: number; // Percentage
  cleanupThreshold: number; // Percentage
  maxMemoryMB: number; // Azure B1 limit estimation
}

class MemoryManager {
  private readonly config: MemoryPressureConfig = {
    warningThreshold: 70,
    criticalThreshold: 85,
    cleanupThreshold: 80,
    maxMemoryMB: 1400, // Conservative estimate for B1 (1.75GB - OS overhead)
  };

  private memoryHistory: MemoryStats[] = [];
  private cleanupCallbacks: Array<() => Promise<void> | void> = [];
  private isCleanupInProgress = false;
  private gcRequestedAt = 0;

  constructor() {
    // Monitor memory every 30 seconds
    setInterval(() => this.checkMemoryPressure(), 30000);
    
    // Cleanup old memory history every 5 minutes
    setInterval(() => this.cleanupMemoryHistory(), 5 * 60 * 1000);
    
    // Setup process memory warnings
    this.setupMemoryWarnings();
  }

  /**
   * Get current memory statistics
   */
  getCurrentMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    const usagePercentage = (usage.heapUsed / (this.config.maxMemoryMB * 1024 * 1024)) * 100;

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers || 0,
      usagePercentage: Math.round(usagePercentage),
      timestamp: Date.now(),
    };
  }

  /**
   * Register cleanup callback for memory pressure situations
   */
  registerCleanupCallback(callback: () => Promise<void> | void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Force garbage collection if available and needed
   */
  async forceGarbageCollection(): Promise<void> {
    const now = Date.now();
    
    // Avoid too frequent GC calls (minimum 10 seconds apart)
    if (now - this.gcRequestedAt < 10000) {
      return;
    }

    this.gcRequestedAt = now;

    try {
      if (global.gc) {
        const beforeStats = this.getCurrentMemoryStats();
        
        // Force garbage collection
        global.gc();
        
        // Small delay to allow GC to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const afterStats = this.getCurrentMemoryStats();
        const freedMB = (beforeStats.heapUsed - afterStats.heapUsed) / 1024 / 1024;
        
        logger.info(
          `Garbage collection completed. Freed ${freedMB.toFixed(2)}MB memory`,
          'MEMORY_MANAGER',
          { beforeStats, afterStats, freedMB }
        );
      } else {
        logger.warn('Garbage collection not available. Start Node.js with --expose-gc flag', 'MEMORY_MANAGER');
      }
    } catch (error) {
      logger.error('Failed to force garbage collection', 'MEMORY_MANAGER', error);
    }
  }

  /**
   * Execute memory cleanup procedures
   */
  async executeCleanup(): Promise<void> {
    if (this.isCleanupInProgress) {
      return;
    }

    this.isCleanupInProgress = true;
    const startTime = Date.now();

    try {
      logger.info('Starting memory cleanup procedures', 'MEMORY_MANAGER');
      
      const beforeStats = this.getCurrentMemoryStats();

      // Execute all registered cleanup callbacks
      const cleanupPromises = this.cleanupCallbacks.map(async (callback, index) => {
        try {
          await callback();
        } catch (error) {
          logger.error(`Cleanup callback ${index} failed`, 'MEMORY_MANAGER', error);
        }
      });

      await Promise.all(cleanupPromises);

      // Force garbage collection
      await this.forceGarbageCollection();

      const afterStats = this.getCurrentMemoryStats();
      const duration = Date.now() - startTime;
      const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;

      logger.info(
        `Memory cleanup completed in ${duration}ms. Freed ${(memoryFreed / 1024 / 1024).toFixed(2)}MB`,
        'MEMORY_MANAGER',
        { beforeStats, afterStats, duration, memoryFreed }
      );

    } catch (error) {
      logger.error('Memory cleanup failed', 'MEMORY_MANAGER', error);
    } finally {
      this.isCleanupInProgress = false;
    }
  }

  /**
   * Check memory pressure and take action if needed
   */
  private async checkMemoryPressure(): Promise<void> {
    const stats = this.getCurrentMemoryStats();
    this.memoryHistory.push(stats);

    // Log memory pressure warnings
    if (stats.usagePercentage >= this.config.criticalThreshold) {
      logger.error(
        `CRITICAL memory pressure: ${stats.usagePercentage}% (${(stats.heapUsed / 1024 / 1024).toFixed(2)}MB)`,
        'MEMORY_MANAGER',
        stats
      );
      
      // Execute emergency cleanup
      await this.executeCleanup();
      
    } else if (stats.usagePercentage >= this.config.warningThreshold) {
      logger.warn(
        `High memory usage: ${stats.usagePercentage}% (${(stats.heapUsed / 1024 / 1024).toFixed(2)}MB)`,
        'MEMORY_MANAGER',
        stats
      );
      
      // Execute proactive cleanup if above cleanup threshold
      if (stats.usagePercentage >= this.config.cleanupThreshold) {
        await this.executeCleanup();
      }
    }
  }

  /**
   * Setup process memory warnings
   */
  private setupMemoryWarnings(): void {
    // Monitor RSS memory (total memory usage)
    const checkRSS = () => {
      const usage = process.memoryUsage();
      const rssMB = usage.rss / 1024 / 1024;
      
      // Warn if RSS approaches B1 limit
      if (rssMB > this.config.maxMemoryMB * 0.9) {
        logger.error(
          `RSS memory approaching B1 limit: ${rssMB.toFixed(2)}MB / ${this.config.maxMemoryMB}MB`,
          'MEMORY_MANAGER',
          usage
        );
      }
    };

    setInterval(checkRSS, 60000); // Check every minute
  }

  /**
   * Cleanup old memory history to prevent memory leaks
   */
  private cleanupMemoryHistory(): void {
    // Keep only last 100 memory stats (about 50 minutes of history)
    if (this.memoryHistory.length > 100) {
      this.memoryHistory = this.memoryHistory.slice(-100);
    }
  }

  /**
   * Get memory usage trend analysis
   */
  getMemoryTrend(): {
    trend: 'increasing' | 'decreasing' | 'stable';
    averageUsage: number;
    peakUsage: number;
    recentGrowth: number;
  } | null {
    if (this.memoryHistory.length < 10) {
      return null;
    }

    const recent = this.memoryHistory.slice(-10);
    const older = this.memoryHistory.slice(-20, -10);

    if (older.length === 0) {
      return null;
    }

    const recentAvg = recent.reduce((sum, stat) => sum + stat.usagePercentage, 0) / recent.length;
    const olderAvg = older.reduce((sum, stat) => sum + stat.usagePercentage, 0) / older.length;
    const growth = recentAvg - olderAvg;

    const allUsage = this.memoryHistory.map(stat => stat.usagePercentage);
    const averageUsage = Math.round(allUsage.reduce((sum, usage) => sum + usage, 0) / allUsage.length);
    const peakUsage = Math.max(...allUsage);

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (growth > 5) {
      trend = 'increasing';
    } else if (growth < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      averageUsage,
      peakUsage,
      recentGrowth: Math.round(growth),
    };
  }

  /**
   * Get memory optimization recommendations
   */
  getMemoryOptimizationRecommendations(): string[] {
    const stats = this.getCurrentMemoryStats();
    const trend = this.getMemoryTrend();
    const recommendations: string[] = [];

    if (stats.usagePercentage > 80) {
      recommendations.push('Memory usage is high - consider reducing cache sizes or implementing data pagination');
    }

    if (trend?.trend === 'increasing' && trend.recentGrowth > 10) {
      recommendations.push('Memory usage is trending upward - check for memory leaks in recent code changes');
    }

    if (stats.external > stats.heapUsed) {
      recommendations.push('High external memory usage detected - review Buffer and native module usage');
    }

    const heapUtilization = (stats.heapUsed / stats.heapTotal) * 100;
    if (heapUtilization < 50 && stats.heapTotal > 100 * 1024 * 1024) {
      recommendations.push('Low heap utilization - V8 may be over-allocating heap space');
    }

    if (this.memoryHistory.length > 50) {
      const recentPeaks = this.memoryHistory.slice(-20).filter(stat => stat.usagePercentage > 90).length;
      if (recentPeaks > 5) {
        recommendations.push('Frequent memory spikes detected - implement more aggressive garbage collection');
      }
    }

    return recommendations;
  }

  /**
   * Health check for memory subsystem
   */
  isMemoryHealthy(): boolean {
    const stats = this.getCurrentMemoryStats();
    const trend = this.getMemoryTrend();

    return (
      stats.usagePercentage < this.config.criticalThreshold &&
      (trend?.trend !== 'increasing' || trend.recentGrowth < 15)
    );
  }

  /**
   * Get comprehensive memory report for monitoring
   */
  getMemoryReport() {
    const current = this.getCurrentMemoryStats();
    const trend = this.getMemoryTrend();
    const recommendations = this.getMemoryOptimizationRecommendations();

    return {
      current,
      trend,
      recommendations,
      healthy: this.isMemoryHealthy(),
      config: this.config,
      cleanupCallbacksRegistered: this.cleanupCallbacks.length,
      lastCleanupInProgress: this.isCleanupInProgress,
    };
  }
}

// Global memory manager instance
const memoryManager = new MemoryManager();

// Export utility functions
export function getCurrentMemoryUsage() {
  return memoryManager.getCurrentMemoryStats();
}

export function registerMemoryCleanup(callback: () => Promise<void> | void) {
  memoryManager.registerCleanupCallback(callback);
}

export function forceGarbageCollection() {
  return memoryManager.forceGarbageCollection();
}

export function isMemoryPressureHigh(): boolean {
  const stats = memoryManager.getCurrentMemoryStats();
  return stats.usagePercentage > 80;
}

export function getMemoryHealthReport() {
  return memoryManager.getMemoryReport();
}

// Express/Next.js middleware for memory monitoring
export function createMemoryMiddleware() {
  return (req: any, res: any, next: any) => {
    // Check memory before processing request
    const beforeMemory = memoryManager.getCurrentMemoryStats();
    
    if (beforeMemory.usagePercentage > 85) {
      logger.warn(
        `Processing request with high memory pressure: ${beforeMemory.usagePercentage}%`,
        'MEMORY_MIDDLEWARE',
        { url: req.url, method: req.method }
      );
    }

    // Monitor memory after response
    res.on('finish', () => {
      const afterMemory = memoryManager.getCurrentMemoryStats();
      const memoryGrowth = afterMemory.heapUsed - beforeMemory.heapUsed;
      
      // Log if request caused significant memory growth
      if (memoryGrowth > 10 * 1024 * 1024) { // 10MB
        logger.warn(
          `Request caused significant memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
          'MEMORY_MIDDLEWARE',
          { 
            url: req.url, 
            method: req.method, 
            memoryGrowth,
            beforeMemory: beforeMemory.usagePercentage,
            afterMemory: afterMemory.usagePercentage
          }
        );
      }
    });

    next();
  };
}

export { memoryManager };