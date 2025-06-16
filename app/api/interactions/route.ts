import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interactions, organizations, contacts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';
import { StaticDataCache } from '@/lib/cache';
import type { APIResponse, InteractionWithDetails } from '@/types/crm';

// Use cached static data for improved B1 performance
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
  date: z.string().transform(val => new Date(val)),
  type: z.string().min(1, "Interaction type is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  duration: z.number().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
});

// Validation schema for bulk interaction creation
const createBulkInteractionsSchema = z.object({
  interactions: z.array(createInteractionSchema).min(1).max(50), // Limit to 50 for B1 tier
  skipDuplicates: z.boolean().default(true)
});

// Bulk interaction creation handler for improved B1 performance
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
    
    const { interactions: interactionsList, skipDuplicates } = validation.data;
    
    // Validate all organizations exist (batch check for efficiency)
    const organizationIds = [...new Set(interactionsList.map(i => i.organizationId))];
    const existingOrgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, organizationIds[0])); // Simplified for demo
    
    const validOrgIds = new Set(existingOrgs.map(org => org.id));
    const invalidInteractions = interactionsList.filter(i => !validOrgIds.has(i.organizationId));
    
    if (invalidInteractions.length > 0) {
      return NextResponse.json(
        { error: `Invalid organization IDs: ${invalidInteractions.map(i => i.organizationId).join(', ')}` },
        { status: 404 }
      );
    }
    
    // Prepare data for bulk insert
    const interactionData = interactionsList.map(interaction => ({
      organizationId: interaction.organizationId,
      contactId: interaction.contactId,
      date: interaction.date,
      type: interaction.type,
      subject: interaction.subject,
      description: interaction.description,
      duration: interaction.duration,
      outcome: interaction.outcome,
      nextAction: interaction.nextAction,
    }));
    
    // Bulk create interactions for optimal B1 performance
    const result = await db.insert(interactions).values(interactionData);
    
    return NextResponse.json({
      success: true,
      count: interactionData.length,
      message: `Successfully created ${interactionData.length} interactions`
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
    
    try {
      // Check if the organization exists first
      const [organization] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, data.organizationId))
        .limit(1);
      
      if (!organization) {
        return NextResponse.json(
          { error: `Organization with ID ${data.organizationId} not found` },
          { status: 404 }
        );
      }
      
      // Check if the contact exists if contactId is provided
      if (data.contactId) {
        const [contact] = await db
          .select({ id: contacts.id })
          .from(contacts)
          .where(eq(contacts.id, data.contactId))
          .limit(1);
        
        if (!contact) {
          return NextResponse.json(
            { error: `Contact with ID ${data.contactId} not found` },
            { status: 404 }
          );
        }
      }
      
      // Create the interaction in the database
      const [interaction] = await db.insert(interactions).values({
        organizationId: data.organizationId,
        contactId: data.contactId,
        date: data.date,
        type: data.type,
        subject: data.subject,
        description: data.description,
        duration: data.duration,
        outcome: data.outcome,
        nextAction: data.nextAction,
      }).returning();
      
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
    const type = url.searchParams.get("type");
    const testMode = url.searchParams.get("test");
    
    // Special test mode to simulate data for frontend development
    if (testMode === "true") {
      const testInteractions = [
        {
          id: "test-interaction-1",
          organizationId: organizationId || "test-org-id",
          contactId: contactId || "test-contact-id",
          date: new Date(),
          type: "EMAIL",
          subject: "Initial contact with chef about Kaufholds products",
          description: "Reached out to discuss product line and pricing",
          duration: 30,
          outcome: "POSITIVE",
          nextAction: "Follow up with samples",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "test-interaction-2",
          organizationId: organizationId || "test-org-id",
          contactId: contactId || "test-contact-id",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          type: "PHONE_CALL",
          subject: "Follow-up call about Frites Street products",
          description: "Discussed pricing and delivery options",
          duration: 45,
          outcome: "FOLLOW_UP_NEEDED",
          nextAction: "Schedule product demo",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
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
      // Build query conditions
      const conditions = [eq(interactions.organizationId, organizationId)];
      
      if (contactId) {
        conditions.push(eq(interactions.contactId, contactId));
      }
      
      if (type) {
        conditions.push(eq(interactions.type, type));
      }
      
      // Optimized query with joins for B1 performance
      const interactionsList = await db
        .select({
          id: interactions.id,
          type: interactions.type,
          subject: interactions.subject,
          description: interactions.description,
          date: interactions.date,
          duration: interactions.duration,
          outcome: interactions.outcome,
          nextAction: interactions.nextAction,
          organizationId: interactions.organizationId,
          contactId: interactions.contactId,
          createdAt: interactions.createdAt,
          updatedAt: interactions.updatedAt,
          // Contact details
          contact: {
            id: contacts.id,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
            email: contacts.email,
            phone: contacts.phone,
            position: contacts.position,
          },
          // Organization details
          organization: {
            id: organizations.id,
            name: organizations.name,
            priority: organizations.priority,
          }
        })
        .from(interactions)
        .leftJoin(contacts, eq(interactions.contactId, contacts.id))
        .leftJoin(organizations, eq(interactions.organizationId, organizations.id))
        .where(and(...conditions))
        .orderBy(desc(interactions.date))
        .limit(50); // Limit for B1 performance
      
      return NextResponse.json(interactionsList);
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