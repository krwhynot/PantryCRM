/**
 * Query timeout wrapper for Prisma operations
 * Ensures all database queries complete within performance targets
 * Optimized for Azure SQL Basic tier constraints
 */

/**
 * Wraps a Prisma query with a timeout to prevent long-running operations
 * @param queryPromise The Prisma query to execute
 * @param timeoutMs Timeout in milliseconds (default: 5000ms for Azure Basic)
 * @param operation Optional operation name for logging
 * @returns Promise that resolves with query result or rejects with timeout error
 */
export async function withQueryTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = 5000,
  operation?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Query timeout: ${operation || 'Database operation'} exceeded ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Query timeout')) {
      console.error(`Database timeout for operation: ${operation}`, {
        timeoutMs,
        operation,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
}

/**
 * Timeout configurations for different operation types
 * Optimized for Azure SQL Basic tier (5 DTU) performance characteristics
 */
export const QUERY_TIMEOUTS = {
  // Fast operations (search, simple queries)
  FAST: 1000,      // 1 second for search operations
  
  // Normal operations (CRUD, joins)
  NORMAL: 3000,    // 3 seconds for standard operations
  
  // Complex operations (reports, aggregations)
  COMPLEX: 8000,   // 8 seconds for complex queries
  
  // Critical timeout (absolute maximum)
  CRITICAL: 15000, // 15 seconds maximum for any operation
} as const;

/**
 * Convenience wrapper for search operations
 */
export function withSearchTimeout<T>(queryPromise: Promise<T>, operation?: string): Promise<T> {
  return withQueryTimeout(queryPromise, QUERY_TIMEOUTS.FAST, operation || 'search');
}

/**
 * Convenience wrapper for standard CRUD operations
 */
export function withCrudTimeout<T>(queryPromise: Promise<T>, operation?: string): Promise<T> {
  return withQueryTimeout(queryPromise, QUERY_TIMEOUTS.NORMAL, operation || 'crud');
}

/**
 * Convenience wrapper for complex operations (reports, analytics)
 */
export function withComplexTimeout<T>(queryPromise: Promise<T>, operation?: string): Promise<T> {
  return withQueryTimeout(queryPromise, QUERY_TIMEOUTS.COMPLEX, operation || 'complex');
}

/**
 * Batch operation timeout wrapper
 * Ensures Promise.all operations don't exceed reasonable timeouts
 */
export async function withBatchTimeout<T>(
  batchPromises: Promise<T>[],
  timeoutMs: number = QUERY_TIMEOUTS.COMPLEX,
  operation?: string
): Promise<T[]> {
  const batchPromise = Promise.all(batchPromises);
  return withQueryTimeout(batchPromise, timeoutMs, operation || 'batch');
}