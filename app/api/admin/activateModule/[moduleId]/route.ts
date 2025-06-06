import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route to activate a module
 * Updated as part of Task 3 (Critical Dependency Fixes) to use setting model as proxy for system modules
 * This is a temporary implementation until proper module management functionality is implemented
 */
export async function POST(req: Request, props: { params: Promise<{ moduleId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Use setting model as a proxy for system modules
    // Create or update a setting with category "SystemModule" and key based on moduleId
    const moduleSettings = await prismadb.setting.upsert({
      where: {
        id: params.moduleId
      },
      update: {
        active: true,
        metadata: JSON.stringify({ enabled: true, lastUpdated: new Date().toISOString() })
      },
      create: {
        id: params.moduleId,
        category: "SystemModule",
        key: `module-${params.moduleId}`,
        label: `Module ${params.moduleId}`,
        active: true,
        sortOrder: 0,
        metadata: JSON.stringify({ enabled: true, lastUpdated: new Date().toISOString() })
      }
    });

    return NextResponse.json(moduleSettings);
  } catch (error) {
    console.log("[MODULE_ACTIVATE_POST]", error);
    return new NextResponse("Error activating module", { status: 500 });
  }
}
