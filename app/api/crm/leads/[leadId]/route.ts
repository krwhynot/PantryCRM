import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleDELETE(req: NextRequest, props: { params: Promise<{ leadId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!params.leadId) {
    return new NextResponse("Lead ID is required", { status: 400 });
  }

  try {
    await prismadb.opportunity.delete({
      where: {
        id: params.leadId,
      },
    });

    return NextResponse.json({ message: "Lead deleted" }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}


// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const DELETE = handleDELETE;