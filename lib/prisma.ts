import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var cachedPrisma: PrismaClient;
}

// Enhanced Azure B1 Prisma configuration with connection pooling and health monitoring
const createPrismaClient = () => {
  // Validate DATABASE_URL with proper error handling
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  // Construct optimized connection parameters for Azure SQL Basic
  const optimizedUrl = baseUrl.includes('?') 
    ? `${baseUrl}&connection_limit=3&pool_timeout=15&connect_timeout=30&socket_timeout=60`
    : `${baseUrl}?connection_limit=3&pool_timeout=15&connect_timeout=30&socket_timeout=60`;

  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
      { emit: 'stdout', level: 'info' }
    ],
    datasources: {
      db: {
        url: optimizedUrl,
      },
    },
    // Connection pooling optimized for Azure SQL Basic tier (5 DTU limit)
    // - connection_limit=3: Max 3 concurrent connections (conserves DTU)
    // - pool_timeout=15: 15s timeout for getting connection from pool
    // - connect_timeout=30: 30s timeout for initial connection
    // - socket_timeout=60: 60s timeout for idle connections
  });

  // Connection health monitoring for Azure SQL Basic
  let connectionErrors = 0;
  let lastHealthCheck = Date.now();
  
  client.$on('query', (e) => {
    if (e.duration > 1000) {
      console.warn(`Azure SQL Basic connection stress detected: ${e.duration}ms`, {
        query: e.query.substring(0, 100) + '...',
        duration: e.duration,
        timestamp: new Date().toISOString()
      });
    }
  });

  client.$on('error', (e) => {
    connectionErrors++;
    console.error(`Azure SQL Basic connection error #${connectionErrors}:`, {
      message: e.message,
      timestamp: new Date().toISOString(),
      consecutiveErrors: connectionErrors
    });
    
    // Alert if too many consecutive errors
    if (connectionErrors > 5) {
      console.error('CRITICAL: Azure SQL Basic connection pool exhausted', {
        errors: connectionErrors,
        recommendation: 'Consider reducing concurrent operations or scaling up'
      });
    }
  });

  client.$on('warn', (e) => {
    console.warn('Azure SQL Basic warning:', {
      message: e.message,
      timestamp: new Date().toISOString()
    });
  });

  // Reset error counter on successful operations
  const originalUse = client.$use;
  client.$use = function(middleware) {
    return originalUse.call(this, async (params, next) => {
      try {
        const result = await next(params);
        // Reset error counter on successful operation
        if (connectionErrors > 0) {
          connectionErrors = Math.max(0, connectionErrors - 1);
        }
        return result;
      } catch (error) {
        connectionErrors++;
        throw error;
      }
    });
  };

  return client;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = createPrismaClient();
  }
  prisma = global.cachedPrisma;
}

// Enhanced performance monitoring middleware optimized for Azure SQL Basic
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  // Azure Basic tier specific thresholds (5 DTU limit)
  const criticalThreshold = 1000; // 1 second for <1s requirement
  const warningThreshold = 500;   // 500ms warning
  const dtuWarningThreshold = 800; // 800ms indicates high DTU usage
  
  // Enhanced monitoring with DTU impact analysis
  if (duration > criticalThreshold) {
    // Log with DTU impact analysis
    console.error(`CRITICAL: Azure Basic DTU exceeded`, {
      model: params.model,
      action: params.action,
      duration,
      estimatedDTU: Math.ceil(duration / 200), // Rough DTU estimation
      timestamp: new Date().toISOString(),
      args: process.env.NODE_ENV === 'development' ? params.args : '[REDACTED]'
    });
  } else if (duration > dtuWarningThreshold) {
    console.warn(`HIGH DTU USAGE: ${params.model}.${params.action}`, {
      duration,
      estimatedDTU: Math.ceil(duration / 200),
      recommendation: duration > 1000 ? 'Consider adding indexes or optimizing query' : 'Monitor for patterns'
    });
  } else if (duration > warningThreshold) {
    console.info(`Azure SQL Basic query: ${params.model}.${params.action} took ${duration}ms`);
  }
  
  // Track query patterns for optimization
  if (process.env.NODE_ENV === 'development') {
    console.debug(`Query executed: ${params.model}.${params.action} (${duration}ms)`);
  }
  
  return result;
});

// Graceful shutdown handler for connection cleanup
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export const prismadb = prisma;
export { prisma };
