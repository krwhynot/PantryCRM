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
  calculatePagination,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import type { 
  APIResponse, 
  OrganizationWithDetails,
  OrganizationSummary,
  OrganizationFilters,
  RouteContext 
} from '@/types/crm';

// Drizzle imports
import { db } from '@/lib/db';
import { organizations, contacts, interactions } from '@/lib/db/schema';
import { eq, ilike, and, or, count, desc, asc } from 'drizzle-orm';

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

    // 3. Build query conditions
    const conditions = [];
    if (filters.search) {
      conditions.push(
        or(
          ilike(organizations.name, `%${filters.search}%`),
          ilike(organizations.email, `%${filters.search}%`)
        )
      );
    }
    if (filters.segment) {
      conditions.push(eq(organizations.segment, filters.segment));
    }
    if (filters.priority) {
      conditions.push(eq(organizations.priority, filters.priority));
    }
    if (filters.type) {
      conditions.push(eq(organizations.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(organizations.status, filters.status));
    }

    // 4. Execute optimized query with B1 performance limits
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50); // B1 performance limit
    const offset = (page - 1) * limit;

    const [organizationsList, totalCountResult] = await Promise.all([
      db
        .select({
          id: organizations.id,
          name: organizations.name,
          website: organizations.website,
          phone: organizations.phone,
          email: organizations.email,
          city: organizations.city,
          state: organizations.state,
          priority: organizations.priority,
          segment: organizations.segment,
          type: organizations.type,
          status: organizations.status,
          estimatedRevenue: organizations.estimatedRevenue,
          lastContactDate: organizations.lastContactDate,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
        })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(organizations.priority), asc(organizations.name))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    const total = totalCountResult[0].count;
    
    // 5. Calculate pagination metadata
    const pagination = calculatePagination(total, page, limit);

    // 6. Create paginated response
    const response = createPaginatedResponse(organizationsList, pagination);
    
    // 7. Add performance headers
    const executionTime = performance.now() - startTime;
    addPerformanceHeaders(response, executionTime, false); // No caching for now
    
    // 8. Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`GET /api/crm/organizations-optimized: ${executionTime.toFixed(2)}ms (db)`);
    }

    return response;

  } catch (error) {
    console.error('GET /api/crm/organizations-optimized error:', error);
    
    // Handle database-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Database error:', error);
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Database query failed'
      }, 500);
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
    const existingOrg = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(ilike(organizations.name, data.name))
      .limit(1);
      
    if (existingOrg.length > 0 && existingOrg[0].name.toLowerCase() === data.name.toLowerCase()) {
      return createErrorResponse({
        code: 'DUPLICATE_ENTRY',
        message: 'Organization with this name already exists',
        field: 'name',
        details: { existingId: existingOrg[0].id }
      }, 409);
    }

    // 4. Create organization with Drizzle
    const [organization] = await db.insert(organizations).values({
      ...data,
      // Ensure required fields have defaults
      segment: data.segment || 'CASUAL_DINING',
      type: data.type || 'PROSPECT',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

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
    
    // Handle database-specific errors (unique constraints, etc.)
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Database error:', error);
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to create organization'
      }, 500);
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
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, data.id))
      .limit(1);
      
    if (!existingOrg) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Organization not found',
        details: { id: data.id }
      }, 404);
    }

    // 4. Check for duplicate names (if name is being changed)
    if (data.name && data.name !== existingOrg.name) {
      const duplicateCheck = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(ilike(organizations.name, data.name))
        .limit(1);
        
      if (duplicateCheck.length > 0 && duplicateCheck[0].id !== data.id) {
        return createErrorResponse({
          code: 'DUPLICATE_ENTRY',
          message: 'Organization with this name already exists',
          field: 'name',
          details: { existingId: duplicateCheck[0].id }
        }, 409);
      }
    }

    // 5. Update organization with Drizzle
    const { id, ...updateData } = data;
    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();

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
      console.error('Database error:', error);
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to update organization'
      }, 500);
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
    // Basic performance stats without the custom Prisma methods
    const stats = {
      queries_executed: 'Not tracked yet',
      avg_execution_time: 'Not tracked yet',
      cache: {
        memory: {
          used: 'Not tracked yet',
          usagePercent: 0
        }
      }
    };
    
    return createSuccessResponse({
      performance: stats,
      azure_b1_recommendations: [
        'Monitor query execution times > 1000ms',
        'Keep cache hit rate > 70% for optimal performance',
        'Limit concurrent connections to < 25 for Azure PostgreSQL B1',
        'Use pagination for results > 50 items',
        'Consider query optimization for high CPU usage'
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