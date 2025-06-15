import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

import { validateCreateOpportunity } from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handlePrismaError,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import type { APIResponse, OpportunityWithDetails } from '@/types/crm';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';
import { cachedQuery, CacheKeys, CacheStrategies } from '@/lib/cache';

async function handlePOST(req: NextRequest): Promise<NextResponse<APIResponse<OpportunityWithDetails>>> {
  const startTime = performance.now();
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // Validate request body
    const { success, data, error } = await parseRequestBody(
      req, 
      validateCreateOpportunity
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // Database operation
    const prisma = getOptimizedPrisma();
    const newOpportunity = await prisma.opportunity.create({
      data: {
        ...data,
        // Ensure proper type mapping
        value: data.value || 0,
        probability: data.probability || 10
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Response
    const response = createSuccessResponse(newOpportunity);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}
async function handlePUT(req: NextRequest): Promise<NextResponse<APIResponse<OpportunityWithDetails>>> {
  const startTime = performance.now();
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // Validate request body
    const { success, data, error } = await parseRequestBody(
      req, 
      validateCreateOpportunity
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // Database operation
    const prisma = getOptimizedPrisma();
    const { id, ...updateData } = data;
    
    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...updateData
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Response
    const response = createSuccessResponse(updatedOpportunity);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}

async function handleGET(req: NextRequest): Promise<NextResponse<APIResponse<any>>> {
  const startTime = performance.now();
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    // Database operation
    const prisma = getOptimizedPrisma();
    
    // OPTIMIZED: Execute all queries in parallel to avoid N+1 problem + add caching for settings
    const [users, accounts, contacts, saleTypes, saleStages, industries] = await Promise.all([
      prisma.user.findMany({}),
      prisma.organization.findMany({}),
      prisma.contact.findMany({}),
      cachedQuery(
        CacheKeys.systemSettings('PRINCIPAL'),
        () => prisma.systemSetting.findMany({ where: { key: { startsWith: "PRINCIPAL_" } } }),
        CacheStrategies.LONG
      ),
      cachedQuery(
        CacheKeys.systemSettings('STAGE'),
        () => prisma.systemSetting.findMany({ where: { key: { startsWith: "STAGE_" } } }),
        CacheStrategies.LONG
      ),
      cachedQuery(
        CacheKeys.systemSettings('SEGMENT'),
        () => prisma.systemSetting.findMany({ where: { key: { startsWith: "SEGMENT_" } } }),
        CacheStrategies.LONG
      )
    ]);
    
    const data = {
      users,
      accounts,
      contacts,
      saleTypes,
      saleStages,
      campaigns: [],
      industries,
    };

    // Response
    const response = createSuccessResponse(data);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });