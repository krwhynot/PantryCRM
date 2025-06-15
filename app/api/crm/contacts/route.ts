import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

import { validateCreateContact } from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handlePrismaError,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import type { APIResponse, ContactWithDetails } from '@/types/crm';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

//Create route
async function handlePOST(req: NextRequest): Promise<NextResponse<APIResponse<ContactWithDetails>>> {
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
      validateCreateContact
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // Database operation
    const prisma = getOptimizedPrisma();
    const newContact = await prisma.contact.create({
      data: {
        ...data,
        // Use position instead of title
        position: data.position
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        interactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    // Response
    const response = createSuccessResponse(newContact);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}

//Update route
async function handlePUT(req: NextRequest): Promise<NextResponse<APIResponse<ContactWithDetails>>> {
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
      validateCreateContact
    );
    if (!success) {
      return handleValidationError([{ field: 'body', message: error.message }]);
    }

    // Database operation
    const prisma = getOptimizedPrisma();
    const { id, ...updateData } = data;
    
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        ...updateData,
        // Use position instead of title
        position: updateData.position
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        interactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    // Response
    const response = createSuccessResponse(updatedContact);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });