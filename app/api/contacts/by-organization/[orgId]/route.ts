import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

/**
 * GET handler for retrieving contacts by organization ID
 * Updated for Next.js 15 with async params pattern
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Critical: await the params Promise
    const { orgId } = await params;
    
    // Handle query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Validate orgId
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Get total count for pagination
    const totalCount = await prismadb.contact.count({
      where: {
        organizationId: orgId
      }
    });
    
    // Fetch contacts with pagination
    const contacts = await prismadb.contact.findMany({
      where: {
        organizationId: orgId
      },
      include: {
        position: true,  // Include contact position details
      },
      skip,
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return NextResponse.json({
      contacts,
      organization: orgId,
      pagination: { 
        page, 
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new contact for an organization
 * Updated for Next.js 15 with async params pattern
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Critical: await the params Promise
    const { orgId } = await params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.roleId) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }
    
    // Create the contact with organization ID from route params
    const newContact = await prismadb.contact.create({
      data: {
        ...body,
        organizationId: orgId
      },
      include: {
        position: true  // Include position details in response
      }
    });
    
    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}