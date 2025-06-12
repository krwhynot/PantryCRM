import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { OrganizationValidation } from '@/lib/validations/organization';
import { withErrorHandler, dbOperation, ErrorTypes } from '@/lib/api-error-handler';
import { requireAuth } from '@/lib/security';

import { processSearchInput } from '@/lib/input-sanitization';

async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;

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

  const organizations = await dbOperation(async () => {
    return await prismadb.organization.findMany({
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
  });

  return NextResponse.json({
    organizations,
    count: organizations.length,
    query: q || '',
    filters: { priority, segment, distributor }
  });
}

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const body = await req.json();
  const validatedData = OrganizationValidation.parse(body);

  const organization = await dbOperation(async () => {
    return await prismadb.organization.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.addressLine1,
        priority: validatedData.priority || "C",
        segment: validatedData.segment || "GENERAL",
        type: "PROSPECT",
        status: "ACTIVE",
      },
    });
  });

  return NextResponse.json(organization, { status: 201 });
}

// Export with error handling
export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);


