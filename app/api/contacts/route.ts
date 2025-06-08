import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const contacts = await prismadb.contact.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        position: { select: { label: true } },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Contact fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}