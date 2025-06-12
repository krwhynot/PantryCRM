import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;

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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true, // position is a string field, not a relation
        isPrimary: true,
        notes: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json(contacts);
}

// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });


