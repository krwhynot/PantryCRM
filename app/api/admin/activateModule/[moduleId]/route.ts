import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * API route to activate a module
 * Updated as part of Task 3 (Critical Dependency Fixes) to use setting model as proxy for system modules
 * This is a temporary implementation until proper module management functionality is implemented
 */
async function handlePOST(req: NextRequest, props: { params: Promise<{ moduleId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Use systemSetting model as a proxy for system modules
    // Create or update a setting with key based on moduleId
    const moduleSettings = await prismadb.systemSetting.upsert({
      where: {
        key: `module-${params.moduleId}`
      },
      update: {
        value: JSON.stringify({ enabled: true, lastUpdated: new Date().toISOString() }),
        type: "json"
      },
      create: {
        key: `module-${params.moduleId}`,
        value: JSON.stringify({ enabled: true, lastUpdated: new Date().toISOString() }),
        type: "json"
      }
    });

    return NextResponse.json(moduleSettings);
  } catch (error) {
    return new NextResponse("Error activating module", { status: 500 });
  }
}


// Export with error handling
export const POST = withErrorHandler(handlePOST);