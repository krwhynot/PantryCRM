import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';
import { requireOrganizationAccess } from '@/lib/authorization';
import type { APIResponse, ContactWithDetails } from '@/types/crm';

/**
 * GET handler for retrieving contacts by organization ID
 * Updated for Next.js 15 with async params pattern
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
): Promise<NextResponse<APIResponse<ContactWithDetails[]>>> {
  // Critical: await the params Promise
  const { orgId } = await params;
  
  // Check authentication and organization access
  const authResult = await requireOrganizationAccess(request, orgId);
  if (!authResult.authorized) {
    return authResult.error!;
  }
    
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
    
    // Optimized query with relation load strategy to prevent N+1 issues on Azure SQL Basic
    const contacts = await prismadb.contact.findMany({
      relationLoadStrategy: "join", // Use database JOIN for optimal performance
      where: {
        organizationId: orgId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        isPrimary: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        // Include recent interactions for better contact context
        interactions: {
          take: 3,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            type: true,
            subject: true,
            date: true,
            outcome: true,
          },
        },
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
}

/**
 * POST handler for creating a new contact for an organization
 * Updated for Next.js 15 with async params pattern
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
): Promise<NextResponse<APIResponse<ContactWithDetails>>> {
  // Critical: await the params Promise
  const { orgId } = await params;
  
  // Check authentication and organization access
  const authResult = await requireOrganizationAccess(request, orgId);
  if (!authResult.authorized) {
    return authResult.error!;
  }
  
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        isPrimary: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(newContact, { status: 201 });
}

// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const GET = handleGET;
export const POST = handlePOST;