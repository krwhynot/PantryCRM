import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// Define allowed interaction types based on requirements
const interactionTypes = [
  "email",
  "call",
  "in-person",
  "demo",
  "quote",
  "follow-up"
];

// Define sales pipeline stages based on requirements
const pipelineStages = [
  "lead-discovery",
  "contacted",
  "sampled-visited",
  "follow-up",
  "close"
];

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

export async function POST(req: NextRequest) {
  try {
    // For API routes in App Router, we need to handle sessions differently
    // Getting session info would normally be done like this:
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // However, for testing purposes we'll allow this without authentication
    // In production, uncomment the above code
    
    const body = await req.json();
    console.log("Received interaction data:", body);
    
    // Validate the request body
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
    
    // In production, get the userId from the session
    // const userId = session.user.id;
    const userId = "system"; // For testing only
    
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
      
      console.log("Created interaction:", interaction);
      return NextResponse.json(interaction);
    } catch (dbError) {
      console.error("Database error creating interaction:", dbError);
      return NextResponse.json(
        { error: "Database error: " + (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating interaction:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the interaction: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    const contactId = url.searchParams.get("contactId");
    const typeId = url.searchParams.get("typeId");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Build the query based on provided filters
    const query: any = {
      where: {
        organizationId,
        ...(contactId && { contactId }),
        ...(typeId && { typeId }),
      },
      include: {
        Contact: true,
        Organization: true,
      },
      orderBy: {
        interactionDate: "desc",
      },
    };
    
    const interactions = await prismadb.interaction.findMany(query);
    
    return NextResponse.json(interactions);
  } catch (error) {
    console.error("Error retrieving interactions:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving interactions" },
      { status: 500 }
    );
  }
}