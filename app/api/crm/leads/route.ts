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

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

// Drizzle imports
import { db } from '@/lib/db';
import { organizations, contacts, opportunities, systemSettings } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

// Handle database errors for Drizzle
function handleDrizzleError(err: any): NextResponse<APIResponse<any>> {
  console.error('Database error:', err);
  
  if (err.code === '23505') { // Unique constraint violation
    return createErrorResponse({
      code: 'DUPLICATE_ERROR',
      message: 'Record with this information already exists'
    }, 409);
  }
  
  if (err.code === '23503') { // Foreign key constraint violation
    return createErrorResponse({
      code: 'REFERENCE_ERROR',
      message: 'Referenced record does not exist'
    }, 400);
  }
  
  return createErrorResponse({
    code: 'DATABASE_ERROR',
    message: 'Database operation failed'
  }, 500);
}

//Create a new Opportunity (formerly Lead)
async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse<APIResponse<OpportunityWithDetails>>> {
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

    const body = data;
    const { 
      first_name, last_name, company, jobTitle, email, phone, 
      description, refered_by, campaign, assigned_to, status, type 
    } = body;
    
    const sessionUserId = session.user?.id;

    // --- Organization Handling Start ---
    let organizationId: string;
    
    if (company && company.trim() !== "") {
      // Try to find existing organization by name
      const [existingOrganization] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.name, company.trim()))
        .limit(1);

      if (existingOrganization) {
        organizationId = existingOrganization.id;
      } else {
        // Create new organization
        const [newOrganization] = await db.insert(organizations).values({
          name: company.trim(),
          priority: "C", // Default priority
          segment: "CASUAL_DINING", // Required field
          type: "PROSPECT",
          status: "ACTIVE"
        }).returning();
        organizationId = newOrganization.id;
      }
    } else {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Company name is required'
      }, 400);
    }
    // --- Organization Handling End ---

    // --- Principal Handling Start ---
    let principalKey: string;
    const requestedPrincipalKey = body.principal_key;

    if (requestedPrincipalKey) {
      const [validPrincipal] = await db
        .select({ key: systemSettings.key })
        .from(systemSettings)
        .where(
          and(
            eq(systemSettings.category, "PRINCIPALS"),
            eq(systemSettings.key, requestedPrincipalKey),
            eq(systemSettings.active, true)
          )
        )
        .limit(1);

      if (validPrincipal) {
        principalKey = validPrincipal.key;
      } else {
        return createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: `Invalid or inactive principal key '${requestedPrincipalKey}' provided`
        }, 400);
      }
    } else {
      // Get default principal
      const [defaultPrincipal] = await db
        .select({ key: systemSettings.key })
        .from(systemSettings)
        .where(
          and(
            eq(systemSettings.category, "PRINCIPALS"),
            eq(systemSettings.active, true)
          )
        )
        .orderBy(asc(systemSettings.sortOrder), asc(systemSettings.key))
        .limit(1);

      if (defaultPrincipal) {
        principalKey = defaultPrincipal.key;
      } else {
        return createErrorResponse({
          code: 'CONFIGURATION_ERROR',
          message: 'No default principal setting found'
        }, 400);
      }
    }
    // --- Principal Handling End ---

    // --- Optional Contact Handling Start ---
    let contactId: string | undefined = undefined;

    if (email && email.trim() !== "") {
      // Try to find existing contact by email
      const [existingContact] = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, email.trim()))
        .limit(1);

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        // Create new contact if we have name info
        if ((first_name || last_name) && organizationId) {
          const [newContact] = await db.insert(contacts).values({
            organizationId: organizationId,
            email: email.trim(),
            firstName: first_name || '',
            lastName: last_name || '',
            phone: phone,
            position: jobTitle,
          }).returning();
          contactId = newContact.id;
        }
      }
    }
    // --- Optional Contact Handling End ---

    // --- Stage Validation Start ---
    let validatedStageKey: string = "PROSPECT"; // Default stage

    if (type) {
      // For now, use simplified stage mapping
      const stageMap: { [key: string]: string } = {
        'new': 'PROSPECT',
        'contacted': 'QUALIFIED',
        'qualified': 'PROPOSAL',
        'proposal': 'NEGOTIATION',
        'won': 'CLOSED_WON',
        'lost': 'CLOSED_LOST'
      };
      validatedStageKey = stageMap[type.toLowerCase()] || 'PROSPECT';
    }
    // --- Stage Validation End ---

    const [newOpportunity] = await db.insert(opportunities).values({
      name: `${first_name || ''} ${last_name || ''} - ${company}`.trim(),
      organizationId: organizationId,
      contactId: contactId,
      stage: validatedStageKey,
      probability: 10, // Default probability for new opportunity from lead
      notes: JSON.stringify({
        originalLeadData: {
          v: 1,
          createdBy: sessionUserId,
          firstName: first_name,
          lastName: last_name,
          company,
          jobTitle,
          email,
          phone,
          description,
          refered_by,
          campaign,
          originalAssignedTo: assigned_to,
          originalStatus: status,
          originalType: type,
        },
        dataSource: "POST /api/crm/leads",
        message: "This opportunity was created from a lead. Review and complete required fields.",
      }),
      isActive: true,
    }).returning();

    // Get organization and contact details for response
    const [organizationDetails] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    let contactDetails = null;
    if (contactId) {
      const [contact] = await db
        .select({ 
          id: contacts.id, 
          firstName: contacts.firstName, 
          lastName: contacts.lastName, 
          email: contacts.email 
        })
        .from(contacts)
        .where(eq(contacts.id, contactId));
      contactDetails = contact;
    }

    const opportunityWithDetails = {
      ...newOpportunity,
      organization: organizationDetails,
      contact: contactDetails
    };

    const response = createSuccessResponse(opportunityWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handleDrizzleError(error);
  }
}

//Get all Opportunities (formerly Leads)
async function handleGET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse<APIResponse<OpportunityWithDetails[]>>> {
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
    
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const stage = url.searchParams.get("stage");
    const campaign = url.searchParams.get("campaign");

    // Build query conditions
    const conditions = [eq(opportunities.isActive, true)];

    if (stage) {
      conditions.push(eq(opportunities.stage, stage));
    }

    if (campaign) {
      // Search in notes for campaign info
      // Note: This is a simplified approach. Consider using proper JSONB operations if needed
    }

    const opportunitiesList = await db
      .select({
        id: opportunities.id,
        name: opportunities.name,
        value: opportunities.value,
        stage: opportunities.stage,
        probability: opportunities.probability,
        expectedCloseDate: opportunities.expectedCloseDate,
        notes: opportunities.notes,
        reason: opportunities.reason,
        isActive: opportunities.isActive,
        organizationId: opportunities.organizationId,
        contactId: opportunities.contactId,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        // Organization details
        organization: {
          id: organizations.id,
          name: organizations.name,
          priority: organizations.priority,
        },
        // Contact details
        contact: {
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
        }
      })
      .from(opportunities)
      .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .leftJoin(contacts, eq(opportunities.contactId, contacts.id))
      .where(and(...conditions))
      .orderBy(desc(opportunities.createdAt))
      .limit(50); // B1 performance limit
    
    const response = createSuccessResponse(opportunitiesList);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handleDrizzleError(error);
  }
}

// Update an Opportunity (formerly Lead)
async function handlePUT(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse<APIResponse<OpportunityWithDetails>>> {
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

    const { id, type, status, ...updateFields } = data;
    const sessionUserId = session.user?.id;

    if (!id) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Opportunity ID is required for update'
      }, 400);
    }

    const [existingOpportunity] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    if (!existingOpportunity) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Opportunity not found for update'
      }, 404);
    }

    // Stage validation
    let validatedStageKey = existingOpportunity.stage;
    if (type !== undefined) {
      const stageMap: { [key: string]: string } = {
        'new': 'PROSPECT',
        'contacted': 'QUALIFIED',
        'qualified': 'PROPOSAL',
        'proposal': 'NEGOTIATION',
        'won': 'CLOSED_WON',
        'lost': 'CLOSED_LOST'
      };
      validatedStageKey = stageMap[type.toLowerCase()] || existingOpportunity.stage;
    }
    
    // Update notes with latest data
    const updateData = {
      stage: validatedStageKey,
      notes: JSON.stringify({
        updatedLeadData: {
          v: 1,
          updatedBy: sessionUserId,
          updatedAt: new Date().toISOString(),
          originalType: type,
          originalStatus: status,
        },
        dataSource: "PUT /api/crm/leads",
        message: "This opportunity was updated via lead update endpoint.",
      }),
      updatedAt: new Date(),
    };

    const [updatedOpportunity] = await db
      .update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, id))
      .returning();

    // Get related data for response
    const [organizationDetails] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, updatedOpportunity.organizationId));

    let contactDetails = null;
    if (updatedOpportunity.contactId) {
      const [contact] = await db
        .select({ 
          id: contacts.id, 
          firstName: contacts.firstName, 
          lastName: contacts.lastName, 
          email: contacts.email 
        })
        .from(contacts)
        .where(eq(contacts.id, updatedOpportunity.contactId));
      contactDetails = contact;
    }

    const opportunityWithDetails = {
      ...updatedOpportunity,
      organization: organizationDetails,
      contact: contactDetails
    };

    const response = createSuccessResponse(opportunityWithDetails);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handleDrizzleError(error);
  }
}

// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });