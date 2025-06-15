// R:\Projects\PantryCRM\src\app\api\organizations\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Assuming authOptions is in @/lib/auth
import { 
  validateCreateOrganization,
  // validateUpdateOrganization // Not implementing PUT in this file for now
} from '@/lib/types/validation';
import { 
  parseRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handlePrismaError,
  addPerformanceHeaders
} from '@/lib/types/api-helpers';
import { getOptimizedPrisma } from '@/lib/performance/optimized-prisma';
import type { APIResponse, OrganizationWithDetails, OrganizationSummary } from '@/types/crm'; // Assuming these types exist
import { Prisma } from '@prisma/client';

export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
  const startTime = performance.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({ message: 'Unauthorized' }, 401);
    }
    const userId = session.user.id;

    const { success, data: validatedData, error: validationError } = await parseRequestBody(
      request,
      validateCreateOrganization
    );

    if (!success || !validatedData) {
      return handleValidationError(validationError);
    }

    // Ensure 'segment' is present (as per TODO)
    // Ensure 'isActive' is not used, 'zipCode' is used instead of 'postalCode'
    // validatedData should reflect this from the Zod schema
    const { ...restData } = validatedData; // Assuming validatedData is correct

    const prisma = getOptimizedPrisma(userId);
    const newOrganization = await prisma.organization.create({
      data: {
        ...restData,
        // Example: Ensure fields like name, segment, zipCode are from validatedData
        // name: validatedData.name,
        // segmentId: validatedData.segmentId, // Assuming segment is by ID
        // zipCode: validatedData.zipCode,
        // ... other fields from validateCreateOrganization
        createdById: userId,
        updatedById: userId,
        // accountManagerId may also come from validatedData or be assigned
      },
      include: { // Include relations as needed for OrganizationWithDetails
        priority: true,
        segment: true,
        distributor: true,
        accountManager: true,
        contacts: true,
        interactions: true,
      }
    });

    const response = createSuccessResponse(newOrganization, 201);
    addPerformanceHeaders(response, startTime);
    return response;

  } catch (error) {
    const response = handlePrismaError(error); // This will handle Prisma-specific errors
    addPerformanceHeaders(response, startTime);
    return response;
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<OrganizationSummary[] | OrganizationWithDetails[]>>> {
  const startTime = performance.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({ message: 'Unauthorized' }, 401);
    }
    const userId = session.user.id;
    const prisma = getOptimizedPrisma(userId);

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const priorityId = searchParams.get('priorityId');
    const segmentId = searchParams.get('segmentId');
    const status = searchParams.get('status');

    const where: Prisma.OrganizationWhereInput = {};
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { companyNumber: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (priorityId) where.priorityId = priorityId;
    if (segmentId) where.segmentId = segmentId;
    if (status) where.status = status;
    // Add more filters as needed (e.g., distributorId, accountManagerId)

    const organizations = await prisma.organization.findMany({
      where,
      include: { // Adjust includes based on OrganizationSummary vs OrganizationWithDetails
        priority: true,
        segment: true,
        distributor: true,
        accountManager: { select: { id: true, name: true, email: true } },
        _count: { select: { contacts: true, interactions: true } }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        updatedAt: 'desc' // Default sort order
      }
    });
    
    const totalOrganizations = await prisma.organization.count({ where });

    const response = createSuccessResponse(
      {
        data: organizations,
        totalPages: Math.ceil(totalOrganizations / limit),
        currentPage: page,
        totalCount: totalOrganizations
      }, 
      200
    );
    addPerformanceHeaders(response, startTime);
    return response;

  } catch (error) {
    const response = handlePrismaError(error);
    addPerformanceHeaders(response, startTime);
    return response;
  }
}
