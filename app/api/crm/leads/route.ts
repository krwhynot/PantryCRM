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

    // Database operation
    const prisma = getOptimizedPrisma();


    if (existingOrganization) {
      organizationId = existingOrganization.id;
    } else {
      // If the organization doesn't exist, create a new one.
      const newOrganization = await prismadb.organization.create({
        data: {
          name: company,
          priority: "C", // Default priority
          segment: "CASUAL_DINING", // Required field
          // Note: accountManagerId field doesn't exist in Organization model
          // TODO: Consider setting default values for other fields like priorityId, segmentId, distributorId.
          // These would involve fetching valid 'key' values from the Setting model, e.g.:
          // priorityId: (await prismadb.systemSetting.findFirst({ where: { category: "ORGANIZATION_PRIORITY", key: "DEFAULT_KEY_FROM_SETTINGS" } }))?.key,
          // Ensure these default keys exist in your Setting table and match the expected category.
        },
      });
      organizationId = newOrganization.id;
    }
    // --- Organization Handling End ---

    // --- Principal Handling Start ---
    let principalKey: string;
    const requestedPrincipalKey = body.principal_key; // Assuming the request might send 'principal_key'

    if (requestedPrincipalKey) {
      const validPrincipal = await prismadb.systemSetting.findFirst({
        where: {
          category: "PRINCIPAL",
          key: requestedPrincipalKey,
          active: true,
        },
      });
      if (validPrincipal) {
        principalKey = validPrincipal.key;
      } else {
        return new NextResponse(
          `Invalid or inactive principal key '${requestedPrincipalKey}' provided. Please provide a valid active principal key from settings.`, 
          { status: 400 }
        );
      }
    } else {
      // If no principal_key is provided in the request, try to assign a default one.
      const defaultPrincipal = await prismadb.systemSetting.findFirst({
        where: {
          category: "PRINCIPAL",
          active: true,
          // You might have a specific setting marked as default, e.g., metadata: { contains: '"default":true' }
          // For now, picking the first active one by sortOrder or any if sortOrder is not set consistently.
        },
        orderBy: [
          { sortOrder: 'asc' }, // Prioritize by sortOrder if available
          { key: 'asc' }         // Fallback ordering if sortOrder is not set or same
        ]
      });
      if (defaultPrincipal) {
        principalKey = defaultPrincipal.key;
      } else {
        return new NextResponse(
          "Principal key is required for an opportunity, but none was provided and no default principal setting (category: PRINCIPAL, active: true) could be found.", 
          { status: 400 }
        );
      }
    }
    // --- Principal Handling End ---

    // --- Optional Contact Handling Start ---
    let contactId: string | undefined = undefined;
    // Destructure contact-related fields from the body, these come from the original lead data.
    // const { first_name, last_name, email, phone, jobTitle } = body; // Already destructured earlier

    if (email && email.trim() !== "") {
      // Try to find an existing contact by email.
      const existingContact = await prismadb.contact.findFirst({
        where: { email: email.trim() },
      });

      if (existingContact) {
        contactId = existingContact.id;
        // TODO: Consider if the existing contact should be updated with any new info from the lead (e.g., phone, jobTitle).
        // TODO: Consider if the existing contact's organizationId matches the current opportunity's organizationId.
        // If not, this might indicate a contact working for multiple organizations or a data mismatch.
        // For now, we link if email matches, regardless of their current organization.
      } else {
        // If contact not found by email, and we have minimal info (firstName or lastName) and the organizationId, create a new one.
        if ((first_name || last_name) && organizationId) {
          const newContact = await prismadb.contact.create({
            data: {
              organizationId: organizationId, // Link to the organization determined earlier
              email: email.trim(),
              firstName: first_name,
              lastName: last_name,
              phone: phone, // from lead data
              position: jobTitle, // from lead data (use position instead of title)
              // TODO: Set default values for other Contact fields if necessary/possible.
              // e.g., source: lead_source (if applicable to contacts too)
              // Note: isActive field doesn't exist in Contact model
            },
          });
          contactId = newContact.id;
        }
      }
    }
    // --- Optional Contact Handling End ---

    const opportunityUserId = assigned_to || sessionUserId;

    // --- Stage and Status Validation Start ---
    let validatedStageKey: string;
    const requestedStageKey = type; // 'type' from lead data maps to Opportunity.stage

    if (requestedStageKey) {
      const validStage = await prismadb.systemSetting.findFirst({
        where: { category: "OPPORTUNITY_STAGE", key: requestedStageKey, active: true },
      });
      if (validStage) {
        validatedStageKey = validStage.key;
      } else {
        return new NextResponse(
          `Invalid or inactive stage key (from lead 'type': '${requestedStageKey}') provided. Please use a valid active key from settings (category: OPPORTUNITY_STAGE).`,
          { status: 400 }
        );
      }
    } else {
      const defaultStage = await prismadb.systemSetting.findFirst({
        where: { category: "OPPORTUNITY_STAGE", active: true, key: "NEW_LEAD" }, // Attempt to find a specific default key
        orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
      });
      if (defaultStage) {
        validatedStageKey = defaultStage.key;
      } else {
         // Fallback: try any active stage if specific default 'NEW_LEAD' not found
        const fallbackDefaultStage = await prismadb.systemSetting.findFirst({
            where: { category: "OPPORTUNITY_STAGE", active: true },
            orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
        });
        if (fallbackDefaultStage) {
            validatedStageKey = fallbackDefaultStage.key;
        } else {
            return new NextResponse(
            "Opportunity stage is required, but none was provided (from lead 'type') and no default active stage (category: OPPORTUNITY_STAGE) could be found.",
            { status: 400 }
            );
        }
      }
    }

    let validatedStatusKey: string;
    const requestedStatusKey = status; // 'status' from lead data maps to Opportunity.status

    if (requestedStatusKey) {
      const validStatus = await prismadb.systemSetting.findFirst({
        where: { category: "OPPORTUNITY_STATUS", key: requestedStatusKey, active: true },
      });
      if (validStatus) {
        validatedStatusKey = validStatus.key;
      } else {
        return new NextResponse(
          `Invalid or inactive status key '${requestedStatusKey}' provided. Please use a valid active key from settings (category: OPPORTUNITY_STATUS).`,
          { status: 400 }
        );
      }
    } else {
      const defaultStatus = await prismadb.systemSetting.findFirst({
        where: { category: "OPPORTUNITY_STATUS", active: true, key: "OPEN" }, // Attempt to find a specific default key
        orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
      });
      if (defaultStatus) {
        validatedStatusKey = defaultStatus.key;
      } else {
        // Fallback: try any active status if specific default 'OPEN' not found
        const fallbackDefaultStatus = await prismadb.systemSetting.findFirst({
            where: { category: "OPPORTUNITY_STATUS", active: true },
            orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
        });
        if (fallbackDefaultStatus) {
            validatedStatusKey = fallbackDefaultStatus.key;
        } else {
            return new NextResponse(
            "Opportunity status is required, but none was provided and no default active status (category: OPPORTUNITY_STATUS) could be found.",
            { status: 400 }
            );
        }
      }
    }
    // --- Stage and Status Validation End ---

    const newOpportunity = await prismadb.opportunity.create({
      data: {
        name: `${first_name} ${last_name} - ${company}`, // Required field
        organizationId: organizationId, // Use the actual organizationId determined above
        // Note: userId field doesn't exist in Opportunity model
        // Note: principal field doesn't exist in Opportunity model
        contactId: contactId, // Use the contactId determined above, or null/undefined if not found/created
        stage: validatedStageKey, // Use validated stage key
        // Note: Opportunity model doesn't have 'status' field, only 'stage'
        // Note: source field doesn't exist in Opportunity model
        probability: 10, // Default probability for a new opportunity from lead
        notes: JSON.stringify({
          originalLeadData: {
            v: 1, // Legacy field
            createdBy: sessionUserId, // Log who created the original lead entry
            firstName: first_name,
            lastName: last_name,
            company,
            jobTitle,
            email,
            phone,
            description,
            refered_by,
            campaign,
            originalAssignedTo: assigned_to, // Log original assignment if different
            originalAccountsIDs: accountIDs, // Legacy field
            originalStatus: status,
            originalType: type,
          },
          dataSource: "POST /api/crm/leads",
          message: "This opportunity was created from a lead. Review and complete required fields like Organization, Principal, and link Contact if applicable.",
        }),
        isActive: true,
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
    
    // Database operations
    const prisma = getOptimizedPrisma();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const assigned_to = url.searchParams.get("assigned_to");
    const lead_source = url.searchParams.get("lead_source");
    const campaign = url.searchParams.get("campaign");

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }
    if (assigned_to) {
      whereClause.userId = assigned_to;
    }
    if (lead_source) {
      whereClause.source = lead_source;
    }
    if (campaign) {
      whereClause.notes = {
        contains: `"campaign":"${campaign}"`, 
      };
    }

    const opportunities = await prisma.opportunity.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        organization: true,
        // Note: user relation doesn't exist in Opportunity model
        contact: true
      }
    });
    
    // Response
    const response = createSuccessResponse(opportunities);
    addPerformanceHeaders(response, performance.now() - startTime);
    
    return response;

  } catch (error) {
    return handlePrismaError(error);
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

    const prisma = getOptimizedPrisma();
    const { id, ...initialUpdateData } = data;

    if (!id) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Opportunity ID is required for update'
      }, 400);
    }

    const existingOpportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!existingOpportunity) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Opportunity not found for update'
      }, 404);
    }

    // --- Stage Validation (from body.type) ---
    let validatedStageKey = existingOpportunity.stage; // Default to existing opportunity's stage
    if (type !== undefined) { // Check if 'type' (for stage) was actually provided in the body
      const validStage = await prismadb.systemSetting.findFirst({
        where: { category: "OPPORTUNITY_STAGE", key: type, active: true },
      });
      if (validStage) {
        validatedStageKey = validStage.key;
      } else {
        return new NextResponse(
          `Invalid or inactive stage key (from lead 'type': '${type}') provided for update. Please use a valid active key from settings (category: OPPORTUNITY_STAGE).`,
          { status: 400 }
        );
      }
    }

    // --- Status Validation (from body.status) ---
    let validatedStatusKey = existingOpportunity.stage; // Default to existing opportunity's stage (not status)
    if (status !== undefined) { // Check if 'status' was actually provided in the body
      const validStatus = await prismadb.systemSetting.findFirst({
        where: { category: "OPPORTUNITY_STATUS", key: status, active: true },
      });
      if (validStatus) {
        validatedStatusKey = validStatus.key;
      } else {
        return new NextResponse(
          `Invalid or inactive status key '${status}' provided for update. Please use a valid active key from settings (category: OPPORTUNITY_STATUS).`,
          { status: 400 }
        );
      }
    }
    
    // Prepare data for update, ensuring only provided fields are updated or fall back to existing.
    const updateData: any = {
        notes: JSON.stringify({ // Always update notes with the latest incoming lead data
          updatedLeadData: {
            v: 1, // Legacy field. Consider if this is still needed or how it should be versioned.
            updatedBy: sessionUserId, // Log who performed the update action
            // Include all relevant fields from the body that represent the lead's state
            firstName: firstName !== undefined ? firstName : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.firstName : undefined,
            lastName: lastName !== undefined ? lastName : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.lastName : undefined,
            company: company !== undefined ? company : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.company : undefined,
            jobTitle: jobTitle !== undefined ? jobTitle : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.jobTitle : undefined,
            email: email !== undefined ? email : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.email : undefined,
            phone: phone !== undefined ? phone : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.phone : undefined,
            description: description !== undefined ? description : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.description : undefined,
            refered_by: refered_by !== undefined ? refered_by : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.refered_by : undefined,
            campaign: campaign !== undefined ? campaign : existingOpportunity.notes ? JSON.parse(existingOpportunity.notes).updatedLeadData?.campaign : undefined,
            originalAssignedTo: assigned_to, // Capture the 'assigned_to' from this request
            originalAccountsIDs: accountIDs, // Capture 'accountIDs' from this request
            originalStatus: body.status, // Capture raw 'status' from this request
            originalType: body.type,     // Capture raw 'type' from this request
          },
          dataSource: "PUT /api/crm/leads",
          message: "This opportunity was updated via lead update endpoint. Review notes for original lead data. Previous notes might exist.",
        }),
    };

    // Only add fields to updateData if they were provided in the request body
    if (assigned_to !== undefined) {
        updateData.userId = opportunityUserId; // opportunityUserId is 'assigned_to' from body or sessionUserId
    }
    if (lead_source !== undefined) {
        updateData.source = lead_source;
    }
    // Stage and Status are always set in updateData, as they default to existing values if not explicitly updated.
    updateData.stage = validatedStageKey;
    updateData.status = validatedStatusKey;

    const updatedOpportunity = await prismadb.opportunity.update({
      where: {
        id,
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




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });
