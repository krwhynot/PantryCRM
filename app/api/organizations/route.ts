import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { OrganizationValidation } from '@/lib/validations/organization';
import { ZodError } from 'zod';

export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const priority = searchParams.get('priority');
    const segment = searchParams.get('segment');
    const distributor = searchParams.get('distributor');

    const where: any = {
      isActive: true, // Only fetch active organizations by default
    };

    // Text search across name and account manager
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { accountManager: { name: { contains: q, mode: 'insensitive' } } } // Search by account manager's name
      ];
    }

    // Filter by priority
    if (priority) {
      where.priority = { key: priority }; // Filter by the key of the related Setting model
    }

    // Filter by segment
    if (segment) {
      where.segment = { key: segment }; // Filter by the key of the related Setting model
    }

    // Filter by distributor
    if (distributor) {
      where.distributor = { key: distributor }; // Filter by the key of the related Setting model
    }

    const organizations = await prismadb.organization.findMany({
      where,
      orderBy: [
        { priority: { sortOrder: 'asc' } }, // Order by the sortOrder field of the related Setting model
        { name: 'asc' }
      ],
      take: 50, // Limit results for performance
      include: {
        priority: { select: { key: true, color: true } }, // Include priority key and color
        segment: { select: { key: true } },
        distributor: { select: { key: true } },
        accountManager: { select: { name: true } }, // Include account manager's name
      }
    });

    return NextResponse.json({
      organizations,
      count: organizations.length,
      query: q || '',
      filters: { priority, segment, distributor }
    });

  } catch (error) {
    console.error('Organizations API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  try {
    const body = await req.json();
    const validatedData = OrganizationValidation.parse(body);

    const organization = await prismadb.organization.create({
      data: {
        name: validatedData.name,
        // description: validatedData.description, // TODO: Add to validation schema
        // website: validatedData.website, // TODO: Add to validation schema
        phone: validatedData.phone,
        email: validatedData.email,
        addressLine1: validatedData.addressLine1,
        // addressLine2: validatedData.addressLine2, // TODO: Add to validation schema
        // city: validatedData.city, // TODO: Add to validation schema
        // state: validatedData.state, // TODO: Add to validation schema
        // postalCode: validatedData.postalCode, // TODO: Add to validation schema
        // country: validatedData.country, // TODO: Add to validation schema
        // isActive: validatedData.isActive, // TODO: Add to validation schema
        // annualRevenue: validatedData.annualRevenue, // TODO: Add to validation schema
        // totalValue: validatedData.totalValue, // TODO: Add to validation schema
        
        // Connect to existing Setting records - need to find IDs based on keys
        // TODO: Implement proper Setting lookups
        priorityId: undefined, // validatedData.priority
        segmentId: undefined, // validatedData.segment  
        distributorId: undefined, // validatedData.distributor

        // Connect to existing User record using their 'id'
        accountManager: validatedData.accountManagerId ? { connect: { id: validatedData.accountManagerId } } : undefined,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create Organization Error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}


