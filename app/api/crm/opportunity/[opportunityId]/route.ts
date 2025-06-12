import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ opportunityId: string }> }) {
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

export async function DELETE(req: Request, props: { params: Promise<{ opportunityId: string }> }) {
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
