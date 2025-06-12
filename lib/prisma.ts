import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var cachedPrisma: PrismaClient;
}

// Azure B1 optimized Prisma configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool optimization for B1 (1 core, 1.75GB RAM)
    // Reduced connection pool to minimize memory usage
    __internal: {
      engine: {
        // Connection pool settings optimized for B1
        connection_limit: 5, // Reduced from default 10
        pool_timeout: 10000, // 10 seconds
        schema_files_root: './prisma',
      },
    },
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

// Performance monitoring middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  // Log slow queries (>1 second) for optimization
  if (duration > 1000) {
    console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
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
