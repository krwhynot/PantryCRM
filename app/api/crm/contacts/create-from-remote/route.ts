import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: NextRequest);
  if (error) return error; Promise<Response> {
  const apiKey = req.headers.get("NEXTCRM_TOKEN");

  // Get API key from headers
  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 401 });
  }

  // Here you would typically check the API key against a stored value
  // For example, you could fetch it from a database or environment variable
  const storedApiKey = process.env.NEXTCRM_TOKEN; // Example of fetching from env
  if (apiKey !== storedApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();


  const { name, surname, email, phone, company, message, tag } = body;
  if (!name || !surname || !email || !phone || !company || !message || !tag) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Use Contact model as proxy for crm_Contacts
    // Need to find or create an organization first for the contact
    let organization = await prismadb.organization.findFirst({
      where: {
        name: company
      }
    });
    
    if (!organization) {
      // Create a new organization if it doesn't exist
      organization = await prismadb.organization.create({
        data: {
          name: company,
          isActive: true
        }
      });
    }
    
    // Now create the contact with the organization
    await prismadb.contact.create({
      data: {
        firstName: name,
        lastName: surname,
        email,
        phone,
        organization: {
          connect: {
            id: organization.id
          }
        },
        // Store additional information in notes field
        notes: `Type: Prospect\nTags: ${tag}\nMessage: ${message}`
      },
    });
    return NextResponse.json({ message: "Contact created" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating contact" },
      { status: 500 }
    );
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });