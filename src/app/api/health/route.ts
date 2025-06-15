// API Health Check Endpoint for Monitoring
import { NextRequest, NextResponse } from 'next/server';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  deployment: {
    commit: string;
    branch: string;
    buildId: string;
  };
  system: {
    platform: string;
    arch: string;
    cpuCores?: number;
    totalMemoryMB?: number;
    freeMemoryMB?: number;
    loadAverage?: number[];
    nodeVersion?: string; // Added nodeVersion
    memory?: {
      used: number;    // from process.memoryUsage().heapUsed
      total: number;   // from process.memoryUsage().heapTotal
      external: number; // from process.memoryUsage().external
    };
  };
  database?: {
    status: string;
    type?: string; // Added type for database status
    message?: string; // For successful connection
    error?: string;   // For errors
  };
  responseTime?: number;
}


export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basic health check data
    const healthData: HealthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.3-beta',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
        branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || 'unknown',
        buildId: process.env.VERCEL_DEPLOYMENT_ID || process.env.GITHUB_RUN_ID || 'unknown'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      }
    };

    // Test database connection if available
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // Simple database ping
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        
        healthData.database = {
          status: 'connected',
          type: 'postgresql'
        };
      } else {
        healthData.database = {
          status: 'not_configured',
          type: 'none'
        };
      }
    } catch (dbError) {
      healthData.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;
    healthData.responseTime = responseTime;

    // Determine overall health status
    let overallStatus = 'healthy';
    if (healthData.database?.status === 'error') {
      overallStatus = 'degraded';
    }
    if (responseTime > 5000) {
      overallStatus = 'slow';
    }

    healthData.status = overallStatus;

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 503 : 
                      overallStatus === 'slow' ? 200 : 200;

    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    // Return error status
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      system: {
        nodeVersion: process.version,
        platform: process.platform
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}