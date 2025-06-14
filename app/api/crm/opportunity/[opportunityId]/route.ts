import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handlePUT(req: NextRequest, props: { params: Promise<{ opportunityId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!params.opportunityId) {
    return new NextResponse("Opportunity ID is required", { status: 400 });
  }

  const body = await req.json();

  const { destination } = body;

  try {
    await prismadb.opportunity.update({
      where: {
        id: params.opportunityId,
      },
      data: {
        stage: destination,
      },
    });

    const data = await prismadb.opportunity.findMany({
      include: {
        user: {
          select: {
            image: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Opportunity updated", data },

      { status: 200 }
    );
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}

async function handleDELETE(req: NextRequest, props: { params: Promise<{ opportunityId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!params.opportunityId) {
    return new NextResponse("Opportunity ID is required", { status: 400 });
  }

  try {
    await prismadb.opportunity.delete({
      where: {
        id: params.opportunityId,
      },
    });

    return NextResponse.json(
      { message: "Opportunity deleted" },
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}


// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const PUT = handlePUT;
export const DELETE = handleDELETE;