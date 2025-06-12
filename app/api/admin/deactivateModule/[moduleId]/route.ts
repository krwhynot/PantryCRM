import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * API route to deactivate a module
 * Updated as part of Task 3 (Critical Dependency Fixes) to use setting model as proxy for system modules
 * This is a temporary implementation until proper module management functionality is implemented
 */
async function handlePOST(req: Request, props: { params: Promise<{ moduleId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: Request);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Use setting model as a proxy for system modules
    // Update a setting with category "SystemModule" to mark it as inactive
    const moduleSettings = await prismadb.setting.update({
      where: {
        id: params.moduleId
      },
      data: {
        active: false,
        metadata: JSON.stringify({ enabled: false, lastUpdated: new Date().toISOString() })
      }
    });

    return NextResponse.json(moduleSettings);
  } catch (error) {
    return new NextResponse("Error deactivating module", { status: 500 });
  }
}


// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });