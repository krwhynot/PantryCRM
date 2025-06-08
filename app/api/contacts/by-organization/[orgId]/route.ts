import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = params;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const contacts = await prismadb.contact.findMany({
      where: {
        organizationId: orgId,
        isActive: true, // Assuming an isActive flag for contacts
      },
      include: {
        position: { select: { label: true } }, // Include position label if applicable
      },
      orderBy: [
        { isPrimary: 'desc' }, // Primary contact first
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Contact fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}