import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  const { sectionId } = params;
  if (!sectionId) {
    return new NextResponse("Missing sectionId", { status: 400 });
  }

  try {
    // Section deletion not implemented - missing Section and Task models
    return NextResponse.json({ 
      error: "Section deletion feature not implemented",
      message: "Section and Task models not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[DELETE_SECTION]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
