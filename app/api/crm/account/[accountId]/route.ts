import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * API route to delete an organization (account)
 * Updated as part of Task 3 (Critical Dependency Fixes) to use organization model instead of crm_Accounts
 */
async function handleDELETE(req: Request, props: { params: Promise<{ accountId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Use organization model instead of crm_Accounts
    await prismadb.organization.delete({
      where: {
        id: params.accountId,
      },
    });

    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    return new NextResponse("Error deleting organization", { status: 500 });
  }
}


// Export with authentication, rate limiting, and error handling
export const DELETE = withRateLimit(withErrorHandler(handleDELETE), { maxAttempts: 100, windowMs: 60000 });