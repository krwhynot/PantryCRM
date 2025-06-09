import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  const body = await req.json();
  const { sectionId } = params;
  const { newTitle } = body;

  try {
    // Section title update not implemented - missing Section model
    return NextResponse.json({ 
      error: "Section title update feature not implemented",
      message: "Section model not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[NEW_SECTION_TITLE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
