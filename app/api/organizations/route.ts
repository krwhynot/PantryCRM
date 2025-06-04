import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { OrganizationValidation } from '@/lib/validations/organization';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = OrganizationValidation.parse(body);

    const organization = await prismadb.organization.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        website: validatedData.website,
        phone: validatedData.phone,
        email: validatedData.email,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        isActive: validatedData.isActive,
        annualRevenue: validatedData.annualRevenue,
        totalValue: validatedData.totalValue,
        
        // Connect to existing Setting records using their 'key' field
        priority: validatedData.priority ? { connect: { key: validatedData.priority } } : undefined,
        segment: validatedData.segment ? { connect: { key: validatedData.segment } } : undefined,
        distributor: validatedData.distributor ? { connect: { key: validatedData.distributor } } : undefined,

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