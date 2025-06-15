import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';
import { StaticDataCache } from '@/lib/cache';
import type { APIResponse, InteractionWithDetails } from '@/types/crm';
import crypto from "crypto";

// Use cached static data for improved Azure SQL Basic performance
function getInteractionTypes() {
  return StaticDataCache.getCachedInteractionTypes();
}

function getPipelineStages() {
  return StaticDataCache.getCachedPipelineStages();
}

// Validation schema for creating interactions
const createInteractionSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  contactId: z.string().optional(),
  interactionDate: z.string().transform(val => new Date(val)),
  typeId: z.string().min(1, "Interaction type is required"),
  notes: z.string().optional(),
  followUpDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  stageId: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

// Validation schema for bulk interaction creation
const createBulkInteractionsSchema = z.object({
  interactions: z.array(createInteractionSchema).min(1).max(50), // Limit to 50 for Azure Basic tier
  skipDuplicates: z.boolean().default(true)
});

// Bulk interaction creation handler for improved Azure SQL Basic performance
async function handleBulkInteractionCreation(body: z.infer<typeof createBulkInteractionsSchema>, userId: string): Promise<NextResponse> {
  try {
    // Validate bulk request
    const validation = createBulkInteractionsSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("Bulk validation error:", validation.error.errors);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { interactions, skipDuplicates } = validation.data;
    
    // Validate all organizations exist (batch check for efficiency)
    const organizationIds = [...new Set(interactions.map(i => i.organizationId))];
    const existingOrgs = await prismadb.organization.findMany({
      where: { id: { in: organizationIds } },
      select: { id: true }
    });
    
    const validOrgIds = new Set(existingOrgs.map(org => org.id));
    const invalidInteractions = interactions.filter(i => !validOrgIds.has(i.organizationId));
    
    if (invalidInteractions.length > 0) {
      return NextResponse.json(
        { error: `Invalid organization IDs: ${invalidInteractions.map(i => i.organizationId).join(', ')}` },
        { status: 404 }
      );
    }
    
    // Prepare data for bulk insert
    const interactionData = interactions.map(interaction => ({
      id: crypto.randomUUID(),
      organizationId: interaction.organizationId,
      contactId: interaction.contactId,
      userId,
      interactionDate: interaction.interactionDate,
      typeId: interaction.typeId,
      notes: interaction.notes,
      followUpDate: interaction.followUpDate,
      isCompleted: interaction.isCompleted,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    // Bulk create interactions for optimal Azure SQL Basic performance
    const result = await prismadb.interaction.createMany({
      data: interactionData,
      skipDuplicates
    });
    
    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully created ${result.count} interactions`
    });
    
  } catch (dbError) {
    console.error("Database error creating bulk interactions:", dbError);
    return NextResponse.json(
      { error: "Failed to create interactions" },
      { status: 500 }
    );
  }
}

async function handlePOST(req: NextRequest): Promise<NextResponse<APIResponse<InteractionWithDetails>>> {
  // Check authentication using the standardized method
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const body = await req.json();
    
    // Check if this is a bulk operation
    const isBulkOperation = Array.isArray(body.interactions);
    
    if (isBulkOperation) {
      return handleBulkInteractionCreation(body, user.id);
    }
    
    // Single interaction validation
    const validation = createInteractionSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("Validation error:", validation.error.errors);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Create a unique ID for the interaction
    const id = crypto.randomUUID();
    
    // Get the userId from authenticated user
    const userId = user.id;
    
    try {
      // Check if the organization exists first
      const organization = await prismadb.organization.findUnique({
        where: { id: data.organizationId }
      });
      
      if (!organization) {
        return NextResponse.json(
          { error: `Organization with ID ${data.organizationId} not found` },
          { status: 404 }
        );
      }
      
      // Check if the contact exists if contactId is provided
      if (data.contactId) {
        const contact = await prismadb.contact.findUnique({
          where: { id: data.contactId }
        });
        
        if (!contact) {
          return NextResponse.json(
            { error: `Contact with ID ${data.contactId} not found` },
            { status: 404 }
          );
        }
      }
      
      // Create the interaction in the database
      const interaction = await prismadb.interaction.create({
        data: {
          id,
          organizationId: data.organizationId,
          contactId: data.contactId,
          userId,
          interactionDate: data.interactionDate,
          typeId: data.typeId,
          notes: data.notes,
          followUpDate: data.followUpDate,
          isCompleted: data.isCompleted,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      return NextResponse.json(interaction);
    } catch (dbError) {
      console.error("Database error creating interaction:", dbError);
      return NextResponse.json(
        { error: "Failed to create interaction" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating interaction:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the interaction" },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication using the standardized method
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    const contactId = url.searchParams.get("contactId");
    const typeId = url.searchParams.get("typeId");
    const testMode = url.searchParams.get("test");
    
    // Special test mode to simulate data for frontend development
    if (testMode === "true") {
      const testInteractions = [
        {
          id: "test-interaction-1",
          organizationId: organizationId || "test-org-id",
          contactId: contactId || "test-contact-id",
          userId: "test-user-id",
          interactionDate: new Date(),
          typeId: "email",
          notes: "Initial contact with chef about Kaufholds products",
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          stageId: "contacted"
        },
        {
          id: "test-interaction-2",
          organizationId: organizationId || "test-org-id",
          contactId: contactId || "test-contact-id",
          userId: "test-user-id",
          interactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          typeId: "call",
          notes: "Follow-up call about Frites Street products",
          followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks later
          isCompleted: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          stageId: "follow-up"
        }
      ];
      
      return NextResponse.json(testInteractions);
    }
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    try {
      // Optimized query with relation load strategy to prevent N+1 issues on Azure SQL Basic
      const interactions = await prismadb.interaction.findMany({
        relationLoadStrategy: "join", // Use database JOIN for optimal performance
        where: {
          organizationId,
          ...(contactId && { contactId }),
          ...(typeId && { typeId }),
        },
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          date: true,
          duration: true,
          outcome: true,
          nextAction: true,
          organizationId: true,
          contactId: true,
          createdAt: true,
          updatedAt: true,
          // Include contact and organization details with JOIN strategy
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              position: true,
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              priority: true,
            }
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 50, // Limit for Azure SQL Basic performance
      });
      
      return NextResponse.json(interactions);
    } catch (dbError) {
      console.error("Database error retrieving interactions:", dbError);
      return NextResponse.json(
        { error: "Failed to retrieve interactions" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error retrieving interactions:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving interactions" },
      { status: 500 }
    );
  }
}

// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 50, windowMs: 60000 });