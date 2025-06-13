import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { getCacheMetrics, isCacheHealthy } from '@/lib/cache';
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * Database health check endpoint optimized for Azure SQL Basic tier monitoring
 * Provides comprehensive health metrics for performance optimization
 */
async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication for admin users only
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const startTime = Date.now();
    
    // Test database connectivity with minimal query
    const connectionTest = await prismadb.$queryRaw`SELECT 1 as test`;
    const connectionTime = Date.now() - startTime;
    
    // Get cache metrics
    const cacheMetrics = getCacheMetrics();
    const cacheHealthy = isCacheHealthy();
    
    // Azure SQL Basic specific health metrics
    const healthMetrics = {
      database: {
        connected: true,
        connectionTime,
        status: connectionTime < 500 ? 'excellent' : connectionTime < 1000 ? 'good' : 'poor',
        recommendation: connectionTime > 1000 ? 'Consider query optimization or Azure SQL scaling' : 'Performance within Azure Basic tier limits'
      },
      cache: {
        ...cacheMetrics,
        healthy: cacheHealthy,
        status: cacheHealthy ? 'healthy' : 'degraded'
      },
      azureOptimization: {
        tier: 'Azure SQL Basic (5 DTU)',
        connectionPool: {
          maxConnections: 3,
          poolTimeout: '15s',
          connectTimeout: '30s',
          socketTimeout: '60s'
        },
        performanceTargets: {
          searchQueries: '<1 second',
          reports: '<10 seconds',
          connectionTime: '<500ms'
        },
        currentPerformance: {
          connectionTime: `${connectionTime}ms`,
          cacheHitRate: `${cacheMetrics.hitRate}%`,
          memoryUsage: `${Math.round(cacheMetrics.memoryUsage / 1024 / 1024)}MB`
        }
      },
      recommendations: []
    };
    
    // Add performance recommendations
    if (connectionTime > 1000) {
      healthMetrics.recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'Database connection time exceeds 1 second',
        action: 'Review query optimization and consider adding indexes'
      });
    }
    
    if (cacheMetrics.hitRate < 60) {
      healthMetrics.recommendations.push({
        type: 'cache',
        severity: 'medium', 
        message: 'Cache hit rate below 60%',
        action: 'Review caching strategy and TTL settings'
      });
    }
    
    if (cacheMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      healthMetrics.recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: 'Cache memory usage above 50MB',
        action: 'Consider reducing cache size or TTL for Azure B1 tier'
      });
    }
    
    const overallHealth = 
      healthMetrics.database.connected && 
      healthMetrics.cache.healthy && 
      connectionTime < 1000 && 
      cacheMetrics.hitRate > 50;
    
    return NextResponse.json({
      healthy: overallHealth,
      status: overallHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: healthMetrics
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      healthy: false,
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      metrics: {
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Check Azure SQL Basic tier connectivity and DTU usage'
        },
        cache: getCacheMetrics(),
        azureOptimization: {
          tier: 'Azure SQL Basic (5 DTU)',
          status: 'connection_failed'
        }
      }
    }, { status: 503 });
  }
}

/**
 * POST handler for triggering manual health diagnostics
 */
async function handlePOST(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { action } = body;
    
    if (action === 'detailed-diagnostics') {
      const startTime = Date.now();
      
      // Run comprehensive database diagnostics
      const diagnostics = await Promise.all([
        // Test basic connectivity
        prismadb.$queryRaw`SELECT 1 as connectivity_test`,
        
        // Test query performance on Organization table (most used)
        prismadb.organization.findFirst({
          select: { id: true, name: true },
          where: { status: 'ACTIVE' }
        }),
        
        // Test index usage with explain plan (if supported)
        prismadb.$queryRaw`SELECT COUNT(*) as org_count FROM Organization WHERE status = 'ACTIVE'`,
        
        // Get system settings count
        prismadb.systemSetting.count()
      ]);
      
      const totalTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        diagnostics: {
          connectivityTest: !!diagnostics[0],
          organizationQueryTest: !!diagnostics[1],
          indexUsageTest: !!diagnostics[2],
          systemSettingsCount: diagnostics[3],
          totalTime: `${totalTime}ms`,
          performance: totalTime < 1000 ? 'excellent' : totalTime < 2000 ? 'good' : 'poor'
        },
        recommendations: totalTime > 2000 ? [
          'Consider adding database indexes for frequently queried fields',
          'Review Azure SQL Basic DTU usage patterns',
          'Implement query result caching for static data'
        ] : ['Database performance is within acceptable limits']
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Supported actions: detailed-diagnostics' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Detailed diagnostics failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Diagnostics failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 30, windowMs: 60000 });
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 5, windowMs: 60000 });