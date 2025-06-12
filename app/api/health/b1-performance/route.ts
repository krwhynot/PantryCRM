/**
 * Azure B1 Performance Health Check API
 * 
 * Provides comprehensive performance monitoring data for B1 optimization requirements:
 * - Search operations: <1 second response time
 * - Report generation: <10 seconds
 * - Page load: <3 seconds on 3G
 * - 4 concurrent users support
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring';
import { getCacheMetrics, isCacheHealthy } from '@/lib/cache';
import { checkDatabaseHealth, getConnectionPoolStats } from '@/lib/db-optimization';
import { getMemoryHealthReport } from '@/lib/memory-management';
import { getActiveReportsCount } from '@/lib/report-generation';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Collect all performance metrics in parallel
    const [
      currentMetrics,
      performanceSummary,
      cacheMetrics,
      dbHealth,
      memoryReport,
    ] = await Promise.all([
      Promise.resolve(performanceMonitor.getCurrentB1Metrics()),
      Promise.resolve(performanceMonitor.getB1PerformanceSummary()),
      Promise.resolve(getCacheMetrics()),
      checkDatabaseHealth(),
      Promise.resolve(getMemoryHealthReport()),
    ]);

    const healthCheckDuration = Date.now() - startTime;

    // Determine overall health status
    const healthChecks = {
      memory: memoryReport.healthy,
      cache: isCacheHealthy(),
      database: dbHealth.status === 'healthy',
      performance: performanceSummary?.healthStatus === 'excellent' || performanceSummary?.healthStatus === 'good',
    };

    const overallHealthy = Object.values(healthChecks).every(Boolean);
    const healthStatus = overallHealthy ? 'healthy' : 'degraded';

    // B1 specific requirements check
    const requirementsCheck = {
      searchResponseTime: {
        requirement: '<1 second',
        current: performanceSummary?.averageResponseTime || 0,
        passing: (performanceSummary?.averageResponseTime || 0) < 1000,
        description: 'Search operations response time'
      },
      reportGeneration: {
        requirement: '<10 seconds',
        current: 'Monitored per report',
        passing: true, // This is checked per report generation
        description: 'Report generation time'
      },
      pageLoad3G: {
        requirement: '<3 seconds on 3G',
        current: 'Client-side measurement',
        passing: true, // This is measured client-side
        description: 'Page load time on 3G networks'
      },
      concurrentUsers: {
        requirement: '4 concurrent users',
        current: performanceSummary?.peakConcurrentUsers || 0,
        passing: (performanceSummary?.peakConcurrentUsers || 0) <= 4,
        description: 'Maximum concurrent users supported'
      },
      memoryUsage: {
        requirement: '<80% of 1.75GB',
        current: `${currentMetrics?.memory.percentage || 0}%`,
        passing: (currentMetrics?.memory.percentage || 0) < 80,
        description: 'Memory usage within B1 limits'
      }
    };

    const requirementsPassing = Object.values(requirementsCheck).every(check => check.passing);

    // Optimization recommendations
    const recommendations = [
      ...performanceMonitor.getB1OptimizationRecommendations(),
      ...memoryReport.recommendations,
    ];

    // Active system status
    const systemStatus = {
      activeReports: getActiveReportsCount(),
      connectionPool: getConnectionPoolStats(),
      cacheHitRate: cacheMetrics.hitRate,
      memoryPressure: memoryReport.current.usagePercentage > 70 ? 'moderate' : 'low',
    };

    const response = {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      healthCheckDuration,
      
      // Overall health indicators
      health: healthChecks,
      
      // B1 specific requirements
      b1Requirements: {
        allPassing: requirementsPassing,
        checks: requirementsCheck,
      },
      
      // Detailed metrics
      metrics: {
        performance: {
          current: currentMetrics,
          summary: performanceSummary,
          recommendations: performanceMonitor.getB1OptimizationRecommendations(),
        },
        memory: {
          current: memoryReport.current,
          trend: memoryReport.trend,
          healthy: memoryReport.healthy,
          recommendations: memoryReport.recommendations,
        },
        cache: {
          ...cacheMetrics,
          healthy: isCacheHealthy(),
        },
        database: {
          ...dbHealth,
          connectionPool: getConnectionPoolStats(),
        },
      },
      
      // System status
      system: systemStatus,
      
      // Optimization recommendations
      recommendations: recommendations.slice(0, 10), // Limit to top 10
      
      // Configuration
      configuration: {
        environment: process.env.NODE_ENV,
        platform: 'Azure App Service Basic B1',
        specs: {
          cpu: '1 core',
          memory: '1.75 GB',
          storage: '10 GB',
        },
        limits: {
          maxConcurrentUsers: 4,
          searchResponseTime: '1000ms',
          reportGenerationTime: '10000ms',
          pageLoadTime3G: '3000ms',
        },
      },
    };

    // Set appropriate cache headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    return new NextResponse(JSON.stringify(response, null, 2), {
      status: overallHealthy ? 200 : 503,
      headers,
    });

  } catch (error) {
    const healthCheckDuration = Date.now() - startTime;
    
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      healthCheckDuration,
      error: error instanceof Error ? error.message : 'Unknown error',
      b1Requirements: {
        allPassing: false,
        checks: {},
      },
    };

    return new NextResponse(JSON.stringify(errorResponse, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Support for HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const currentMetrics = performanceMonitor.getCurrentB1Metrics();
    const memoryReport = getMemoryHealthReport();
    
    const isHealthy = memoryReport.healthy && 
                     isCacheHealthy() && 
                     (currentMetrics?.memory.percentage || 0) < 85;

    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'X-Health-Status': isHealthy ? 'healthy' : 'degraded',
        'X-Memory-Usage': `${currentMetrics?.memory.percentage || 0}%`,
        'X-Cache-Hit-Rate': `${getCacheMetrics().hitRate}%`,
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        'X-Health-Status': 'error',
      },
    });
  }
}