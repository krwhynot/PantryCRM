import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { requireAuth } from '@/lib/security';
import { processSearchInput } from '@/lib/input-sanitization';

// Import validation and API helpers as required by TODO-WS-001
import { validateCreateOrganization, validateUpdateOrganization } from '@/lib/types/validation';
import { parseRequestBody, createSuccessResponse, createErrorResponse, handleValidationError, handlePrismaError } from '@/lib/types/api-helpers';
import type { APIResponse, OrganizationWithDetails, OrganizationSummary } from '@/types/crm';

async function GET(req: NextRequest): Promise<NextResponse<APIResponse<OrganizationSummary[]>>> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error as NextResponse<APIResponse<OrganizationSummary[]>>;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const priority = searchParams.get('priority');
  const segment = searchParams.get('segment');
  const distributor = searchParams.get('distributor');

  const where: any = {
    status: "ACTIVE", // Only fetch active organizations by default
  };

  // Text search across name and email with secure processing
  if (q) {
    const { query: sanitizedQuery, isValid } = processSearchInput(q);
    if (isValid) {
      where.OR = [
        { name: { contains: sanitizedQuery, mode: 'insensitive' } },
        { email: { contains: sanitizedQuery, mode: 'insensitive' } }
      ];
    }
  }

  // Filter by priority, segment, etc.
  if (priority) where.priority = priority;
  if (segment) where.segment = segment;

  try {
    const organizations = await prismadb.organization.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { name: 'asc' }
      ],
      take: 50, // Limit results for Azure SQL Basic performance
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        priority: true,
        segment: true,
        estimatedRevenue: true,
        lastContactDate: true,
        nextFollowUpDate: true,
        createdAt: true,
      }
    });

    return createSuccessResponse({
      organizations,
      count: organizations.length,
      query: q || '',
      filters: { priority, segment, distributor }
    });
  } catch (err) {
    return handlePrismaError(err);
  }
}

async function POST(req: NextRequest): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error as NextResponse<APIResponse<OrganizationWithDetails>>;

  // 1. Validate request using provided validation helpers
  const { success, data, error: validationError } = await parseRequestBody(req, validateCreateOrganization);
  if (!success) return handleValidationError([{ field: 'body', message: validationError.message }]);

  // 2. Database operation with error handling
  try {
    const organization = await prismadb.organization.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address, // Changed from addressLine1 to address per schema
        priority: data.priority || "C",
        segment: data.segment || "CASUAL_DINING", // Default segment value
        type: "PROSPECT",
        status: "ACTIVE",
        notes: data.notes, // Changed from description to notes per schema
        zipCode: data.zipCode, // Changed from postalCode to zipCode per schema
        city: data.city,
        state: data.state,
        website: data.website,
        estimatedRevenue: data.estimatedRevenue,
        employeeCount: data.employeeCount,
        primaryContact: data.primaryContact,
        // isActive field removed as it doesn't exist in the schema
      },
    });
    
    return createSuccessResponse(organization);
  } catch (err) {
    return handlePrismaError(err);
  }
}

// Export the API route handlers directly
export { GET, POST };


