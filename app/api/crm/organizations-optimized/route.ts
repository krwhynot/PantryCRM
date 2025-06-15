/**
 * Optimized Organizations API Route - Reference Implementation
 * 
 * This route demonstrates the complete Azure B1 optimization stack:
 * - Type-safe validation with Zod schemas
 * - Performance monitoring and query optimization
 * - Intelligent caching with LRU eviction
 * - Connection pooling for Azure SQL Basic (5 DTU)
 * - Comprehensive error handling
 * 
 * Use this as a reference pattern for all other API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  validateOrganizationFilters,
  validateCreateOrganization,
  validateUpdateOrganization 
} from '@/lib/types/validation';
import {
  parseRequestBody,
  parseSearchParams,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  handleValidationError,
  handlePrismaError,
  calculatePagination,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import type { 
  APIResponse, 
  OrganizationWithDetails,
  OrganizationSummary,
  OrganizationFilters,
  RouteContext 
} from '@/types/crm';

// Initialize optimized Prisma client
const prisma = getOptimizedPrisma();

// =============================================================================
// GET: List Organizations with Filters
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<{
  data: OrganizationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>>> {
  const startTime = performance.now();
  
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const { success, data: filters, error } = parseSearchParams(
      searchParams, 
      validateOrganizationFilters
    );

    if (!success) {
      return handleValidationError([{ field: 'query', message: error.message }]);
    }

    // 3. Execute optimized query with caching and monitoring
    const result = await prisma.getOrganizations(filters);
    
    // 4. Calculate pagination metadata
    const pagination = calculatePagination(
      result.total,
      filters.page || 1,
      filters.limit || 20
    );

    // 5. Create paginated response
    const response = createPaginatedResponse(result.organizations, pagination);
    
    // 6. Add performance headers
    const executionTime = performance.now() - startTime;
    addPerformanceHeaders(response, executionTime, result.fromCache);
    
    // 7. Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`GET /api/crm/organizations-optimized: ${executionTime.toFixed(2)}ms ${result.fromCache ? '(cached)' : '(db)'}`);
    }

    return response;

  } catch (error) {
    console.error('GET /api/crm/organizations-optimized error:', error);
    
    // Handle Prisma-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      return handlePrismaError(error);
    }
    
    // Generic error handling
    return createErrorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch organizations',
      details: process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    }, 500);
  }
}

// =============================================================================
// POST: Create Organization
// =============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  const startTime = performance.now();
  
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // 2. Parse and validate request body
    const { success, data, error } = await parseRequestBody(
      request, 
      validateCreateOrganization
    );

    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // 3. Check for duplicate organization names (business rule)
    const existingOrg = await prisma.searchOrganizations(data.name, 1);
    if (existingOrg.length > 0 && existingOrg[0].name.toLowerCase() === data.name.toLowerCase()) {
      return createErrorResponse({
        code: 'DUPLICATE_ENTRY',
        message: 'Organization with this name already exists',
        field: 'name',
        details: { existingId: existingOrg[0].id }
      }, 409);
    }

    // 4. Create organization with optimized query
    const organization = await prisma.createOrganization({
      ...data,
      // Ensure required fields have defaults
      segment: data.segment || 'CASUAL_DINING',
      type: data.type || 'PROSPECT',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5. Create success response
    const response = createSuccessResponse(organization, {
      message: 'Organization created successfully'
    });
    
    // 6. Add performance headers
    const executionTime = performance.now() - startTime;
    addPerformanceHeaders(response, executionTime, false);
    
    // 7. Log creation event
    console.log(`Organization created: ${organization.name} (${organization.id}) in ${executionTime.toFixed(2)}ms`);

    return response;

  } catch (error) {
    console.error('POST /api/crm/organizations-optimized error:', error);
    
    // Handle Prisma-specific errors (unique constraints, etc.)
    if (error && typeof error === 'object' && 'code' in error) {
      return handlePrismaError(error);
    }
    
    return createErrorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create organization',
      details: process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    }, 500);
  }
}

// =============================================================================
// PUT: Update Organization
// =============================================================================

export async function PUT(
  request: NextRequest
): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  const startTime = performance.now();
  
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // 2. Parse and validate request body
    const { success, data, error } = await parseRequestBody(
      request, 
      validateUpdateOrganization
    );

    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // 3. Check if organization exists
    const existingOrg = await prisma.getOrganizationById(data.id);
    if (!existingOrg) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Organization not found',
        details: { id: data.id }
      }, 404);
    }

    // 4. Check for duplicate names (if name is being changed)
    if (data.name && data.name !== existingOrg.name) {
      const duplicateCheck = await prisma.searchOrganizations(data.name, 1);
      if (duplicateCheck.length > 0 && duplicateCheck[0].id !== data.id) {
        return createErrorResponse({
          code: 'DUPLICATE_ENTRY',
          message: 'Organization with this name already exists',
          field: 'name',
          details: { existingId: duplicateCheck[0].id }
        }, 409);
      }
    }

    // 5. Update organization with optimized query
    const { id, ...updateData } = data;
    const updatedOrganization = await prisma.updateOrganization(id, {
      ...updateData,
      updatedAt: new Date()
    });

    // 6. Create success response
    const response = createSuccessResponse(updatedOrganization, {
      message: 'Organization updated successfully'
    });
    
    // 7. Add performance headers
    const executionTime = performance.now() - startTime;
    addPerformanceHeaders(response, executionTime, false);
    
    // 8. Log update event
    console.log(`Organization updated: ${updatedOrganization.name} (${updatedOrganization.id}) in ${executionTime.toFixed(2)}ms`);

    return response;

  } catch (error) {
    console.error('PUT /api/crm/organizations-optimized error:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      return handlePrismaError(error);
    }
    
    return createErrorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update organization',
      details: process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    }, 500);
  }
}

// =============================================================================
// Performance Monitoring Endpoint (Development Only)
// =============================================================================

export async function OPTIONS(
  request: NextRequest
): Promise<NextResponse<APIResponse<any>>> {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return createErrorResponse({
      code: 'FORBIDDEN',
      message: 'Performance endpoint only available in development'
    }, 403);
  }

  try {
    const stats = prisma.getPerformanceStats();
    
    return createSuccessResponse({
      performance: stats,
      azure_b1_recommendations: [
        'Monitor query execution times > 1000ms',
        'Keep cache hit rate > 70% for optimal performance',
        'Limit concurrent connections to < 25 for Azure SQL Basic',
        'Use pagination for results > 50 items',
        'Consider query optimization for DTU usage > 80%'
      ],
      memory_usage: {
        cache_allocation: '700MB max',
        current_usage: stats.cache.memory.used,
        usage_percent: stats.cache.memory.usagePercent
      }
    });

  } catch (error) {
    return createErrorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve performance stats'
    }, 500);
  }
}

// =============================================================================
// EXPORT PATTERN DOCUMENTATION
// =============================================================================

/**
 * USAGE PATTERNS FOR OTHER ROUTES:
 * 
 * 1. Import Required Modules:
 *    - Validation functions from @/lib/types/validation
 *    - API helpers from @/lib/types/api-helpers  
 *    - Optimized Prisma from @/lib/performance/optimized-prisma
 *    - Types from @/types/crm
 * 
 * 2. Structure Each Handler:
 *    - Start performance timer
 *    - Check authentication
 *    - Validate input with parseRequestBody/parseSearchParams
 *    - Execute business logic with error handling
 *    - Return typed response with performance headers
 * 
 * 3. Error Handling Priority:
 *    - Use handlePrismaError for database errors
 *    - Use handleValidationError for input validation
 *    - Use createErrorResponse for business logic errors
 *    - Always log errors with context
 * 
 * 4. Performance Considerations:
 *    - Use optimized Prisma client for caching
 *    - Add performance headers to responses  
 *    - Monitor execution times > 1000ms
 *    - Log performance metrics in development
 * 
 * 5. Azure B1 Specific:
 *    - Limit query complexity with validation
 *    - Use connection pooling through optimized client
 *    - Cache frequently accessed data
 *    - Monitor DTU usage through performance stats
 */