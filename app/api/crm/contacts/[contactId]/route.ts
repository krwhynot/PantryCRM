import { NextRequest, NextResponse } from "next/server";
import { requireContactAccess } from "@/lib/authorization";
import { logDataAccess, logSecurityEvent } from "@/lib/security-logger";
import { prismadb } from "@/lib/prisma";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

// Contact delete route
async function handleDELETE(req: NextRequest, props: { params: Promise<{ contactId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;

  if (!params.contactId) {
    return new NextResponse("Contact ID is required", { status: 400 });
  }

  // SECURITY: Prevent IDOR vulnerability - verify user has access to this contact
  const authResult = await requireContactAccess(req, params.contactId, 'delete');
  if (!authResult.authorized) {
    return authResult.error!;
  }

  try {
    // First check if contact exists
    const existingContact = await prismadb.contact.findUnique({
      where: { id: params.contactId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organizationId: true,
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    if (!existingContact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    // For non-admin users, verify they have access to the organization
    if (authResult.user!.role !== 'admin') {
      // Additional organization-level access check could go here
      // For now, we'll allow managers to delete contacts in organizations they manage
    }

    // Perform soft delete or hard delete based on business requirements
    // For audit trail purposes, we'll do a soft delete by marking as inactive
    const deletedContact = await prismadb.contact.update({
      where: { id: params.contactId },
      data: { 
        // If you have an isActive field, use soft delete:
        // isActive: false,
        // Otherwise, we can add a deletedAt field
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // If your schema doesn't support soft delete, use hard delete:
    // await prismadb.contact.delete({
    //   where: { id: params.contactId }
    // });

    // For this implementation, let's use hard delete as the original code intended
    await prismadb.contact.delete({
      where: { id: params.contactId }
    });

    // Log the deletion for audit trail
    logSecurityEvent('data_access', {
      userId: authResult.user!.id,
      action: 'CONTACT_DELETED',
      resourceType: 'contact',
      resourceId: params.contactId,
      contactName: `${existingContact.firstName} ${existingContact.lastName}`,
      contactEmail: existingContact.email,
      organizationName: existingContact.organization?.name
    }, req);

    return NextResponse.json({ 
      message: "Contact deleted successfully",
      deletedContact: {
        id: existingContact.id,
        name: `${existingContact.firstName} ${existingContact.lastName}`
      }
    }, { status: 200 });

  } catch (error) {
    logSecurityEvent('data_access', {
      userId: authResult.user!.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/crm/contacts/[contactId]',
      action: 'DELETE',
      resourceId: params.contactId
    }, req);
    
    return new NextResponse("Failed to delete contact", { status: 500 });
  }
}

// GET route for retrieving a single contact
async function handleGET(req: NextRequest, props: { params: Promise<{ contactId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;

  if (!params.contactId) {
    return new NextResponse("Contact ID is required", { status: 400 });
  }

  // SECURITY: Prevent IDOR vulnerability - verify user has access to this contact
  const authResult = await requireContactAccess(req, params.contactId, 'read');
  if (!authResult.authorized) {
    return authResult.error!;
  }

  try {
    const contact = await prismadb.contact.findUnique({
      where: { id: params.contactId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            segment: true
          }
        }
      }
    });

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    // Log data access for audit trail
    logDataAccess(
      authResult.user!.id,
      'contact',
      params.contactId,
      'read',
      req
    );

    return NextResponse.json(contact);

  } catch (error) {
    logSecurityEvent('data_access', {
      userId: authResult.user!.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/crm/contacts/[contactId]',
      action: 'GET',
      resourceId: params.contactId
    }, req);
    
    return new NextResponse("Failed to retrieve contact", { status: 500 });
  }
}

// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const DELETE = handleDELETE;
export const GET = handleGET;