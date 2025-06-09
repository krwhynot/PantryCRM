import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function DELETE(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { id } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!id) {
    return new NextResponse("Missing section ID ", { status: 400 });
  }

  console.log(id, "id");

  try {
    // Section task management not implemented - missing Task and Section models
    return NextResponse.json({ 
      error: "Section task management feature not implemented",
      message: "Task and Section models not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[PROJECT_SECTION_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}


