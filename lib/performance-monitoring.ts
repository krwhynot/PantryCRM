/**
 * Performance Monitoring and Error Tracking
 * Optimized for Azure B1 App Service constraints
 * Provides real-time insights into application performance
 */

import { resultCache } from './result-cache';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface SystemHealth {
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  activeConnections: number;
  cacheStats: {
    hitRatio: number;
    totalEntries: number;
  };
  errorRate: number;
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Limit memory usage on Azure B1
  private startTime = Date.now();
  private errorCount = 0;
  private totalRequests = 0;

  /**
   * Track a performance metric
   */
  track(operation: string, duration: number, success: boolean, error?: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
      metadata
    };

    this.metrics.push(metric);
    this.totalRequests++;
    
    if (!success) {
      this.errorCount++;
    }

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }

    // Log errors
    if (!success && error) {
      console.error(`Operation failed: ${operation}`, { error, duration, metadata });
    }
  }

  /**
   * Wrapper for timing async operations
   */
  async time<T>(
    operation: string,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - start;
      this.track(operation, duration, success, error, metadata);
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  getOperationStats(operation: string, timeWindowMs: number = 5 * 60 * 1000): {
    count: number;
    avgDuration: number;
    successRate: number;
    p95Duration: number;
    errors: string[];
  } {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(
      m => m.operation === operation && m.timestamp > cutoff
    );

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        successRate: 0,
        p95Duration: 0,
        errors: []
      };
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = relevantMetrics.filter(m => m.success).length;
    const errors = relevantMetrics
      .filter(m => !m.success && m.error)
      .map(m => m.error!)
      .slice(0, 10); // Limit error list

    return {
      count: relevantMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      successRate: successCount / relevantMetrics.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      errors
    };
  }

  /**
   * Get overall system health metrics
   */
  getSystemHealth(): SystemHealth {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000); // Last 5 minutes
    
    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    const p95Duration = durations.length > 0 
      ? durations[Math.floor(durations.length * 0.95)] || 0 
      : 0;
    
    const p99Duration = durations.length > 0 
      ? durations[Math.floor(durations.length * 0.99)] || 0 
      : 0;

    // Estimate memory usage (rough approximation)
    const memoryUsed = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const memoryTotal = process.memoryUsage ? process.memoryUsage().heapTotal : 0;

    return {
      uptime: now - this.startTime,
      memoryUsage: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0
      },
      activeConnections: 0, // Would need to be tracked separately
      cacheStats: resultCache.getStats(),
      errorRate: this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0,
      responseTime: {
        avg: avgDuration,
        p95: p95Duration,
        p99: p99Duration
      }
    };
  }

  /**
   * Get alerts based on performance thresholds
   */
  getAlerts(): string[] {
    const health = this.getSystemHealth();
    const alerts: string[] = [];

    // Memory usage alerts
    if (health.memoryUsage.percentage > 85) {
      alerts.push(`High memory usage: ${health.memoryUsage.percentage.toFixed(1)}%`);
    }

    // Error rate alerts
    if (health.errorRate > 0.05) { // More than 5% error rate
      alerts.push(`High error rate: ${(health.errorRate * 100).toFixed(1)}%`);
    }

    // Response time alerts
    if (health.responseTime.p95 > 3000) { // P95 over 3 seconds
      alerts.push(`Slow response times: P95 is ${health.responseTime.p95}ms`);
    }

    // Cache efficiency alerts
    if (health.cacheStats.hitRatio < 0.5 && health.cacheStats.totalEntries > 10) {
      alerts.push(`Low cache hit ratio: ${(health.cacheStats.hitRatio * 100).toFixed(1)}%`);
    }

    return alerts;
  }

  /**
   * Clear old metrics to free memory
   */
  cleanup(): void {
    const cutoff = Date.now() - (30 * 60 * 1000); // Keep last 30 minutes
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    systemHealth: SystemHealth;
    recentOperations: { [operation: string]: any };
    alerts: string[];
  } {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    const recentOperations: { [operation: string]: any } = {};

    operations.forEach(op => {
      recentOperations[op] = this.getOperationStats(op);
    });

    return {
      systemHealth: this.getSystemHealth(),
      recentOperations,
      alerts: this.getAlerts()
    };
  }
}

// Global monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup old metrics every 10 minutes
setInterval(() => {
  performanceMonitor.cleanup();
}, 10 * 60 * 1000);

// Convenience functions
export const trackOperation = (operation: string, duration: number, success: boolean, error?: string, metadata?: Record<string, any>) =>
  performanceMonitor.track(operation, duration, success, error, metadata);

export const timeOperation = <T>(operation: string, asyncFn: () => Promise<T>, metadata?: Record<string, any>) =>
  performanceMonitor.time(operation, asyncFn, metadata);

export const getSystemHealth = () => performanceMonitor.getSystemHealth();

export const getPerformanceAlerts = () => performanceMonitor.getAlerts();

export const exportPerformanceMetrics = () => performanceMonitor.exportMetrics();