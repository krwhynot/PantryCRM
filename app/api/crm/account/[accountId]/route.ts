import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

// Drizzle imports
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * API route to delete an organization (account)
 * Updated as part of Task 3 (Critical Dependency Fixes) to use organization model instead of crm_Accounts
 */
async function handleDELETE(req: NextRequest, props: { params: Promise<{ accountId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Use organization model with Drizzle
    await db
      .delete(organizations)
      .where(eq(organizations.id, params.accountId));

    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new NextResponse("Error deleting organization", { status: 500 });
  }
}


// Export handler directly (wrappers incompatible with Next.js 15 dynamic routes)
export const DELETE = handleDELETE;