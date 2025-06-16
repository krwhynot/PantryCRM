import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { validateCreateOrganization, validateUpdateOrganization } from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import type { APIResponse, OrganizationWithDetails } from '@/types/crm';

// Drizzle imports
import { db } from '@/lib/db';
import { organizations, contacts, interactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const [newAccount] = await db.insert(organizations).values({
      ...data,
      segment: data.segment, // Already validated by schema
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Get related data for response
    const accountContacts = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        isPrimary: contacts.isPrimary
      })
      .from(contacts)
      .where(eq(contacts.organizationId, newAccount.id));

    const recentInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.organizationId, newAccount.id))
      .orderBy(desc(interactions.date))
      .limit(5);

    const accountWithDetails = {
      ...newAccount,
      contacts: accountContacts,
      interactions: recentInteractions
    };

    // Response
    const response = createSuccessResponse(accountWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to create account'
    }, 500);
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
    const { id, ...updateData } = data;
    
    const [updatedAccount] = await db
      .update(organizations)
      .set({
        ...updateData,
        zipCode: updateData.zipCode, // Use zipCode instead of postalCode
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    // Get related data for response
    const accountContacts = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        isPrimary: contacts.isPrimary
      })
      .from(contacts)
      .where(eq(contacts.organizationId, id));

    const recentInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.organizationId, id))
      .orderBy(desc(interactions.date))
      .limit(5);

    const accountWithDetails = {
      ...updatedAccount,
      contacts: accountContacts,
      interactions: recentInteractions
    };

    // Response
    const response = createSuccessResponse(accountWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to update account'
    }, 500);
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

    // Database operation with B1 performance limit
    const organizationsList = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        website: organizations.website,
        phone: organizations.phone,
        email: organizations.email,
        address: organizations.address,
        city: organizations.city,
        state: organizations.state,
        zipCode: organizations.zipCode,
        priority: organizations.priority,
        segment: organizations.segment,
        type: organizations.type,
        status: organizations.status,
        notes: organizations.notes,
        estimatedRevenue: organizations.estimatedRevenue,
        employeeCount: organizations.employeeCount,
        primaryContact: organizations.primaryContact,
        lastContactDate: organizations.lastContactDate,
        nextFollowUpDate: organizations.nextFollowUpDate,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .limit(50); // B1 performance limit

    // Get contacts and interactions for each organization
    const organizationsWithDetails = await Promise.all(
      organizationsList.map(async (org) => {
        const [orgContacts, recentInteractions] = await Promise.all([
          db.select({
            id: contacts.id,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
            email: contacts.email,
            isPrimary: contacts.isPrimary
          })
          .from(contacts)
          .where(eq(contacts.organizationId, org.id)),
          
          db.select()
          .from(interactions)
          .where(eq(interactions.organizationId, org.id))
          .orderBy(desc(interactions.date))
          .limit(5)
        ]);

        return {
          ...org,
          contacts: orgContacts,
          interactions: recentInteractions
        };
      })
    );

    // Response
    const response = createSuccessResponse(organizationsWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse({
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch accounts'
    }, 500);
  }
}




// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const POST = handlePOST;
export const PUT = handlePUT;
export const GET = handleGET;