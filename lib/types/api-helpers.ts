/**
 * API Response Helpers
 * 
 * Utility functions for creating type-safe API responses with consistent
 * error handling and performance optimization for Azure B1 constraints.
 */

import { NextResponse } from 'next/server';
import type { 
  APIResponse, 
  AppError, 
  PaginatedResponse 
} from '@/types/crm';
import { ErrorCode } from '@/types/crm';

// =============================================================================
// RESPONSE BUILDERS
// =============================================================================

/**
 * Create successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: APIResponse<T>['meta']
): NextResponse<APIResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta
  });
}

/**
 * Create error API response
 */
export function createErrorResponse(
  error: AppError,
  status: number = 400
): NextResponse<APIResponse<never>> {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginatedResponse<T>['pagination']
): NextResponse<APIResponse<PaginatedResponse<T>>> {
  return NextResponse.json({
    success: true,
    data: {
      data,
      pagination
    }
  });
}

// =============================================================================
// ERROR BUILDERS
// =============================================================================

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  field?: string,
  details?: Record<string, unknown>
): AppError {
  return {
    code: ErrorCode.VALIDATION_ERROR,
    message,
    field,
    details
  };
}

/**
 * Create not found error
 */
export function createNotFoundError(
  resource: string,
  id?: string
): AppError {
  return {
    code: ErrorCode.NOT_FOUND,
    message: `${resource} not found${id ? ` with ID: ${id}` : ''}`,
    details: { resource, id }
  };
}

/**
 * Create unauthorized error
 */
export function createUnauthorizedError(): AppError {
  return {
    code: ErrorCode.UNAUTHORIZED,
    message: 'Authentication required'
  };
}

/**
 * Create forbidden error
 */
export function createForbiddenError(
  action?: string,
  resource?: string
): AppError {
  return {
    code: ErrorCode.FORBIDDEN,
    message: `Access denied${action && resource ? ` for ${action} on ${resource}` : ''}`
  };
}

/**
 * Create duplicate entry error
 */
export function createDuplicateError(
  field: string,
  value: string
): AppError {
  return {
    code: ErrorCode.DUPLICATE_ENTRY,
    message: `${field} '${value}' already exists`,
    field,
    details: { [field]: value }
  };
}

/**
 * Create database error
 */
export function createDatabaseError(
  operation: string,
  details?: Record<string, unknown>
): AppError {
  return {
    code: ErrorCode.DATABASE_ERROR,
    message: `Database operation failed: ${operation}`,
    details
  };
}

/**
 * Create rate limit error
 */
export function createRateLimitError(
  limit: number,
  windowMs: number
): AppError {
  return {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
    details: { limit, windowMs }
  };
}

/**
 * Create internal server error
 */
export function createInternalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): AppError {
  return {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message,
    details
  };
}

// =============================================================================
// ERROR RESPONSE HELPERS
// =============================================================================

/**
 * Handle validation errors and return appropriate response
 */
export function handleValidationError(
  errors: Array<{ field: string; message: string }>
): NextResponse<APIResponse<never>> {
  const error = createValidationError(
    'Validation failed',
    undefined,
    { validationErrors: errors }
  );
  return createErrorResponse(error, 400);
}

/**
 * Handle Prisma errors and convert to appropriate API errors
 */
export function handlePrismaError(error: any): NextResponse<APIResponse<never>> {
  // Handle unique constraint violations
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    const appError = createDuplicateError(field, 'value');
    return createErrorResponse(appError, 409);
  }

  // Handle record not found
  if (error.code === 'P2025') {
    const appError = createNotFoundError('Record');
    return createErrorResponse(appError, 404);
  }

  // Handle foreign key constraint violations
  if (error.code === 'P2003') {
    const appError = createValidationError(
      'Referenced record does not exist',
      error.meta?.field_name,
      { constraintViolation: true }
    );
    return createErrorResponse(appError, 400);
  }

  // Handle connection errors (Azure SQL timeout)
  if (error.code === 'P1001' || error.code === 'P1017') {
    const appError = createDatabaseError(
      'Database connection timeout',
      { azureOptimization: 'Consider query optimization for Azure B1 tier' }
    );
    return createErrorResponse(appError, 503);
  }

  // Generic database error
  const appError = createDatabaseError('Database operation failed', {
    prismaCode: error.code,
    prismaMessage: error.message
  });
  return createErrorResponse(appError, 500);
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Generate Prisma skip/take from page/limit
 */
export function getPaginationParams(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit
  };
}

// =============================================================================
// AZURE B1 OPTIMIZATION HELPERS
// =============================================================================

/**
 * Optimize query for Azure SQL Basic (5 DTU)
 * Returns optimized query options and warnings
 */
export function optimizeQueryForAzureB1<T extends Record<string, any>>(
  options: T,
  maxIncludes: number = 3
): { optimized: T; warnings: string[] } {
  const warnings: string[] = [];
  const optimized = { ...options };

  // Limit include depth for performance
  if (optimized.include && Object.keys(optimized.include).length > maxIncludes) {
    warnings.push(`Include depth limited to ${maxIncludes} for Azure B1 performance`);
    const includeKeys = Object.keys(optimized.include).slice(0, maxIncludes);
    optimized.include = includeKeys.reduce((acc, key) => {
      acc[key] = optimized.include[key];
      return acc;
    }, {} as any);
  }

  // Ensure take limit for large datasets
  if (optimized.take && optimized.take > 100) {
    warnings.push('Take limit reduced to 100 for Azure B1 performance');
    optimized.take = 100;
  }

  // Add orderBy if not present for consistent pagination
  if (!optimized.orderBy && optimized.take) {
    optimized.orderBy = { updatedAt: 'desc' };
    warnings.push('Added default orderBy for consistent pagination');
  }

  return { optimized, warnings };
}

/**
 * Check if query should be cached based on Azure B1 constraints
 */
export function shouldCacheQuery(
  operation: string,
  resultSize: number,
  executionTime: number
): boolean {
  // Cache expensive queries (>2 seconds) on Azure B1
  if (executionTime > 2000) return true;
  
  // Cache large result sets (>50 records)
  if (resultSize > 50) return true;
  
  // Cache specific operations that are expensive
  const expensiveOperations = [
    'findManyWithIncludes',
    'aggregateCount',
    'complexJoin',
    'fullTextSearch'
  ];
  
  return expensiveOperations.some(op => operation.includes(op));
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Measure API execution time
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const executionTime = performance.now() - startTime;
      
      // Log slow queries for Azure B1 optimization
      if (executionTime > 1000) {
        console.warn(`Slow operation detected: ${operationName} took ${executionTime.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.error(`Operation failed: ${operationName} after ${executionTime.toFixed(2)}ms`, error);
      throw error;
    }
  }) as T;
}

/**
 * Add performance headers to response
 */
export function addPerformanceHeaders(
  response: NextResponse,
  executionTime: number,
  cacheHit: boolean = false
): NextResponse {
  response.headers.set('X-Execution-Time', executionTime.toString());
  response.headers.set('X-Cache-Hit', cacheHit.toString());
  
  // Add Azure B1 optimization suggestions
  if (executionTime > 2000) {
    response.headers.set('X-Performance-Warning', 'Consider query optimization for Azure B1');
  }
  
  return response;
}

// =============================================================================
// TYPE-SAFE REQUEST PARSING
// =============================================================================

/**
 * Parse JSON request body with type validation
 */
export async function parseRequestBody<T>(
  request: Request,
  validator: (data: unknown) => { success: boolean; data?: T; errors?: any[] }
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const body = await request.json();
    const validation = validator(body);
    
    if (!validation.success) {
      return {
        success: false,
        error: createValidationError(
          'Request validation failed',
          undefined,
          { errors: validation.errors }
        )
      };
    }
    
    return { success: true, data: validation.data! };
  } catch (error) {
    return {
      success: false,
      error: createValidationError('Invalid JSON in request body')
    };
  }
}

/**
 * Parse URL search params with type validation
 */
export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  validator: (data: unknown) => { success: boolean; data?: T; errors?: any[] }
): { success: true; data: T } | { success: false; error: AppError } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    
    // Convert array parameters (e.g., priority[]=A&priority[]=B)
    const processedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key.endsWith('[]')) {
        const baseKey = key.slice(0, -2);
        if (!processedParams[baseKey]) {
          processedParams[baseKey] = [];
        }
        processedParams[baseKey].push(value);
      } else {
        processedParams[key] = value;
      }
    }
    
    const validation = validator(processedParams);
    
    if (!validation.success) {
      return {
        success: false,
        error: createValidationError(
          'Query parameters validation failed',
          undefined,
          { errors: validation.errors }
        )
      };
    }
    
    return { success: true, data: validation.data! };
  } catch (error) {
    return {
      success: false,
      error: createValidationError('Invalid query parameters')
    };
  }
}