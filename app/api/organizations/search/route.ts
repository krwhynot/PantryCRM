import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.length < 2) {
      return NextResponse.json([], { status: 200 }); // Return empty array for queries less than 2 characters
    }

    // Implement priority-based ordering if 'priority' field exists in Organization model
    // For now, simple search by name and city
    const organizations = await prismadb.organization.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { city: { contains: query } },
        ],
        isActive: true, // Assuming an isActive flag for organizations
      },
      select: {
        id: true,
        name: true,
        city: true,
        // Include priority level if available in your schema
        // priority: { select: { label: true } },
      },
      orderBy: {
        name: 'asc',
      },
      take: 10, // Limit results for performance
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Organization search error:', error);
    return NextResponse.json({ error: 'Failed to search organizations' }, { status: 500 });
  }
}


