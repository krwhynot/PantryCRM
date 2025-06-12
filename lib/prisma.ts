import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var cachedPrisma: PrismaClient;
}

// Azure B1 optimized Prisma configuration with connection pooling
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

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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

// Performance monitoring middleware optimized for Azure SQL Basic
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  // Stricter thresholds for Azure SQL Basic tier (5 DTU)
  if (duration > 500) {
    console.warn(`Azure SQL Basic slow query: ${params.model}.${params.action} took ${duration}ms`);
    
    // Log additional context for optimization
    if (duration > 2000) {
      console.error(`Critical query performance: ${params.model}.${params.action}`, {
        duration,
        action: params.action,
        args: params.args
      });
    }
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
