import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportPerformanceMetrics, getSystemHealth, getPerformanceAlerts } from '@/lib/performance-monitoring';
import { resultCache } from '@/lib/result-cache';

/**
 * System health check endpoint
 * Provides real-time performance metrics and system status
 * Requires authentication to prevent information disclosure
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get comprehensive system metrics
    const metrics = exportPerformanceMetrics();
    const health = getSystemHealth();
    const alerts = getPerformanceAlerts();
    const cacheStats = resultCache.getStats();

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (alerts.length > 0) {
      status = 'degraded';
    }
    
    if (health.errorRate > 0.1 || health.responseTime.p95 > 5000) {
      status = 'unhealthy';
    }

    // Azure B1 specific health checks
    const azureB1Checks = {
      memoryWithinLimits: health.memoryUsage.percentage < 90,
      responseTimeAcceptable: health.responseTime.p95 < 3000,
      errorRateLow: health.errorRate < 0.05,
      cacheEffective: cacheStats.hitRatio > 0.3 || cacheStats.totalEntries < 10
    };

    const azureB1Healthy = Object.values(azureB1Checks).every(check => check);

    return NextResponse.json({
      status: azureB1Healthy ? status : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      system: {
        memory: health.memoryUsage,
        cache: cacheStats,
        performance: {
          avgResponseTime: health.responseTime.avg,
          p95ResponseTime: health.responseTime.p95,
          errorRate: health.errorRate
        }
      },
      azureB1: {
        healthy: azureB1Healthy,
        checks: azureB1Checks,
        recommendations: !azureB1Healthy ? [
          health.memoryUsage.percentage >= 90 ? 'Consider optimizing memory usage or upgrading plan' : null,
          health.responseTime.p95 >= 3000 ? 'Database queries may need optimization' : null,
          health.errorRate >= 0.05 ? 'Investigate error sources' : null,
          cacheStats.hitRatio <= 0.3 && cacheStats.totalEntries >= 10 ? 'Cache configuration may need tuning' : null
        ].filter(Boolean) : []
      },
      alerts,
      metrics: process.env.NODE_ENV === 'development' ? metrics : undefined
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}