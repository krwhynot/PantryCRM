import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { organizations } from '../../../lib/db/schema';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { requireAuth } from '../../../lib/security';
import { processSearchInput } from '../../../lib/input-sanitization';

// Import validation and API helpers
import { validateCreateOrganization, validateUpdateOrganization } from '../../../lib/types/validation';
import { parseRequestBody, createSuccessResponse, createErrorResponse, handleValidationError } from '../../../lib/types/api-helpers';
import type { APIResponse, OrganizationWithDetails, OrganizationSummary } from '../../../types/crm';

// Handle database errors for Drizzle
function handleDrizzleError(err: any): NextResponse<APIResponse<any>> {
  console.error('Database error:', err);
  
  if (err.code === '23505') { // Unique constraint violation
    return createErrorResponse('Organization with this name or email already exists', 409);
  }
  
  if (err.code === '23503') { // Foreign key constraint violation
    return createErrorResponse('Referenced record does not exist', 400);
  }
  
  return createErrorResponse('Database operation failed', 500);
}

async function GET(req: NextRequest): Promise<NextResponse<APIResponse<OrganizationSummary[]>>> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error as NextResponse<APIResponse<OrganizationSummary[]>>;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const priority = searchParams.get('priority');
  const segment = searchParams.get('segment');
  const distributor = searchParams.get('distributor');

  try {
    // Build query conditions
    const conditions = [
      eq(organizations.status, 'ACTIVE') // Only fetch active organizations by default
    ];

    // Text search across name and email with secure processing
    if (q) {
      const { query: sanitizedQuery, isValid } = processSearchInput(q);
      if (isValid) {
        conditions.push(
          or(
            ilike(organizations.name, `%${sanitizedQuery}%`),
            ilike(organizations.email, `%${sanitizedQuery}%`)
          )!
        );
      }
    }

    // Filter by priority, segment, etc.
    if (priority) {
      conditions.push(eq(organizations.priority, priority));
    }
    if (segment) {
      conditions.push(eq(organizations.segment, segment));
    }

    const results = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
        phone: organizations.phone,
        priority: organizations.priority,
        segment: organizations.segment,
        estimatedRevenue: organizations.estimatedRevenue,
        lastContactDate: organizations.lastContactDate,
        nextFollowUpDate: organizations.nextFollowUpDate,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(and(...conditions))
      .orderBy(asc(organizations.priority), asc(organizations.name))
      .limit(50); // Limit results for B1 performance

    return createSuccessResponse({
      organizations: results,
      count: results.length,
      query: q || '',
      filters: { priority, segment, distributor }
    });
  } catch (err) {
    return handleDrizzleError(err);
  }
}

async function POST(req: NextRequest): Promise<NextResponse<APIResponse<any>>> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error as NextResponse<APIResponse<OrganizationWithDetails>>;

  // 1. Validate request using provided validation helpers
  const parsed = await parseRequestBody(req, validateCreateOrganization);
  if (parsed.success === false) {
    return handleValidationError([{ field: 'body', message: parsed.error.message }]);
  }
  const data = parsed.data;

  // 2. Database operation with error handling
  try {
    const [organization] = await db.insert(organizations).values({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      priority: data.priority || "C",
      segment: data.segment || "CASUAL_DINING",
      type: "PROSPECT",
      status: "ACTIVE",
      notes: data.notes,
      zipCode: data.zipCode,
      city: data.city,
      state: data.state,
      website: data.website,
      estimatedRevenue: data.estimatedRevenue,
      employeeCount: data.employeeCount,
      primaryContact: data.primaryContact,
    }).returning();
    
    return createSuccessResponse(organization);
  } catch (err) {
    return handleDrizzleError(err);
  }
}

// Export the API route handlers directly
export { GET, POST };