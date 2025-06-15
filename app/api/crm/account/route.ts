import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { validateCreateOrganization, validateUpdateOrganization } from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handlePrismaError,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import type { APIResponse, OrganizationWithDetails } from '@/types/crm';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

//Create new account route
async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
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
      validateCreateOrganization
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // Database operation
    const prisma = getOptimizedPrisma();
    const newAccount = await prisma.organization.create({
      data: {
        ...data,
        // Ensure segment is required and present from validation
        segment: data.segment // Already validated by schema
      },
      include: {
        contacts: true,
        interactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    // Response
    const response = createSuccessResponse(newAccount);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}

//Update account route
async function handlePUT(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
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
      validateUpdateOrganization
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }
    // Database operation
    const prisma = getOptimizedPrisma();
    const { id, ...updateData } = data;
    
    const updatedAccount = await prisma.organization.update({
      where: { id },
      data: {
        ...updateData,
        // Use zipCode instead of postalCode
        zipCode: updateData.zipCode
      },
      include: {
        contacts: true,
        interactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    // Response
    const response = createSuccessResponse(updatedAccount);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}

//GET all accounts route
async function handleGET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse<APIResponse<OrganizationWithDetails[]>>> {
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
    const organizations = await prisma.organization.findMany({
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isPrimary: true
          }
        },
        interactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    // Response
    const response = createSuccessResponse(organizations);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}




// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const POST = handlePOST;
export const PUT = handlePUT;
export const GET = handleGET;