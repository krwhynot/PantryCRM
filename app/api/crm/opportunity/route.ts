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
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import type { APIResponse, OpportunityWithDetails } from '@/types/crm';

// Drizzle imports
import { db } from '@/lib/db';
import { opportunities, organizations, contacts, users, systemSettings } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';

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
    const [newOpportunity] = await db.insert(opportunities).values({
      ...data,
      value: data.value || 0, // Ensure proper type mapping
      probability: data.probability || 10,
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
      .where(eq(organizations.id, newOpportunity.organizationId));

    let contact = null;
    if (newOpportunity.contactId) {
      const [contactData] = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email
        })
        .from(contacts)
        .where(eq(contacts.id, newOpportunity.contactId));
      contact = contactData;
    }

    const opportunityWithDetails = {
      ...newOpportunity,
      organization,
      contact
    };

    // Response
    const response = createSuccessResponse(opportunityWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to create opportunity'
    }, 500);
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
    const { id, ...updateData } = data;
    
    const [updatedOpportunity] = await db
      .update(opportunities)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();

    // Get related data for response
    const [organization] = await db
      .select({
        id: organizations.id,
        name: organizations.name
      })
      .from(organizations)
      .where(eq(organizations.id, updatedOpportunity.organizationId));

    let contact = null;
    if (updatedOpportunity.contactId) {
      const [contactData] = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email
        })
        .from(contacts)
        .where(eq(contacts.id, updatedOpportunity.contactId));
      contact = contactData;
    }

    const opportunityWithDetails = {
      ...updatedOpportunity,
      organization,
      contact
    };

    // Response
    const response = createSuccessResponse(opportunityWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to update opportunity'
    }, 500);
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

    // Database operation with B1 performance limits
    // OPTIMIZED: Execute all queries in parallel to avoid N+1 problem + add caching for settings
    const [usersList, accountsList, contactsList, saleTypes, saleStages, industries] = await Promise.all([
      db.select().from(users).limit(50), // B1 performance limit
      db.select().from(organizations).limit(50), // B1 performance limit
      db.select().from(contacts).limit(50), // B1 performance limit
      cachedQuery(
        CacheKeys.systemSettings('PRINCIPAL'),
        () => db.select().from(systemSettings).where(like(systemSettings.key, "PRINCIPAL_%")),
        CacheStrategies.LONG
      ),
      cachedQuery(
        CacheKeys.systemSettings('STAGE'),
        () => db.select().from(systemSettings).where(like(systemSettings.key, "STAGE_%")),
        CacheStrategies.LONG
      ),
      cachedQuery(
        CacheKeys.systemSettings('SEGMENT'),
        () => db.select().from(systemSettings).where(like(systemSettings.key, "SEGMENT_%")),
        CacheStrategies.LONG
      )
    ]);
    
    const data = {
      users: usersList,
      accounts: accountsList,
      contacts: contactsList,
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
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch opportunity data'
    }, 500);
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });