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
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import type { APIResponse, ContactWithDetails } from '@/types/crm';

// Drizzle imports
import { db } from '@/lib/db';
import { contacts, organizations, interactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const [newContact] = await db.insert(contacts).values({
      ...data,
      position: data.position, // Use position instead of title
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Get related data for response
    const [organization] = await db
      .select({
        id: organizations.id,
        name: organizations.name
      })
      .from(organizations)
      .where(eq(organizations.id, newContact.organizationId));

    const recentInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.contactId, newContact.id))
      .orderBy(desc(interactions.date))
      .limit(5);

    const contactWithDetails = {
      ...newContact,
      organization,
      interactions: recentInteractions
    };

    // Response
    const response = createSuccessResponse(contactWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to create contact'
    }, 500);
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
    const { id, ...updateData } = data;
    
    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...updateData,
        position: updateData.position, // Use position instead of title
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();

    // Get related data for response
    const [organization] = await db
      .select({
        id: organizations.id,
        name: organizations.name
      })
      .from(organizations)
      .where(eq(organizations.id, updatedContact.organizationId));

    const recentInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.contactId, id))
      .orderBy(desc(interactions.date))
      .limit(5);

    const contactWithDetails = {
      ...updatedContact,
      organization,
      interactions: recentInteractions
    };

    // Response
    const response = createSuccessResponse(contactWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to update contact'
    }, 500);
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });