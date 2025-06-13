import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    let databaseStatus: HealthStatus['services']['database'] = {
      status: 'down'
    };
    
    try {
      // Simple query to check database connection
      await prismadb.$queryRaw`SELECT 1`;
      databaseStatus = {
        status: 'up',
        latency: Date.now() - dbStartTime
      };
    } catch (error) {
      databaseStatus = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usedMemory = memoryUsage.heapUsed + memoryUsage.external;
    
    // Build health response
    const health: HealthStatus = {
      status: databaseStatus.status === 'up' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.3-beta',
      environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development',
      services: {
        database: databaseStatus,
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round((usedMemory / totalMemory) * 100)
        },
        uptime: Math.round(process.uptime())
      }
    };
    
    // Return appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 503 : 500;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    // Catastrophic failure
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: { status: 'down' },
        memory: { used: 0, total: 0, percentage: 0 },
        uptime: 0
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

// Optional: HEAD method for quick health checks
export async function HEAD(req: NextRequest): Promise<NextResponse> {
  try {
    // Quick database ping
    await prismadb.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}