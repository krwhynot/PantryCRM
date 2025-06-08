import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for validation of incoming interaction data
const interactionSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  contactId: z.string().min(1, 'Contact ID is required'),
  type: z.enum(['Email', 'Call', 'In Person', 'Demo', 'Quoted price', 'Follow-up'], { message: 'Interaction type is required' }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export async function POST(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
  try {
    const body = await req.json();

    // Validate the request body against the schema
    const validatedData = interactionSchema.parse(body);

    const { organizationId, contactId, type, notes } = validatedData;

    // Create the interaction in the database
    const interaction = await prismadb.interaction.create({
      data: {
        organizationId,
        contactId,
        type,
        notes,
        // Assuming a userId will be available from authentication context
        // userId: 'some-user-id', 
      },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    } else {
      console.error('Interaction submission error:', error);
      return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 });
    }
  }
}


