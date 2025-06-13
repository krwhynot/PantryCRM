import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { processSearchInput } from '@/lib/input-sanitization';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('query');

    // Secure input processing
    const { query, isValid } = processSearchInput(rawQuery);
    
    if (!isValid) {
      return NextResponse.json([], { status: 200 }); // Return empty array for invalid queries
    }

    // Enhanced search with relation load strategy optimization
    const organizations = await prismadb.organization.findMany({
      relationLoadStrategy: "join", // Use database JOIN for optimal Azure SQL Basic performance
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
        status: "ACTIVE", // Use consistent status field from schema
      },
      select: {
        id: true,
        name: true,
        city: true,
        priority: true, // Include priority for sorting
        estimatedRevenue: true,
        // Include primary contact for enhanced search results
        contacts: {
          take: 1,
          where: { isPrimary: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // A, B, C, D priority ordering
        { name: 'asc' },
      ],
      take: 10, // Limit results for Azure SQL Basic performance
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Organization search error:', error);
    return NextResponse.json({ error: 'Failed to search organizations' }, { status: 500 });
  }
}




// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });