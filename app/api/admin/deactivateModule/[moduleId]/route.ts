import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route to deactivate a module
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
    console.log("[MODULE_DEACTIVATE_POST]", error);
    return new NextResponse("Error deactivating module", { status: 500 });
  }
}
