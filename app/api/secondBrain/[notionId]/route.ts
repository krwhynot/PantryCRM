import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import initNotionClient from "@/lib/notion";

export async function DELETE(req: Request, props: { params: Promise<{ notionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // SecondBrain feature not implemented - missing secondBrain_notions model
    return NextResponse.json({ 
      error: "SecondBrain/Notion feature not implemented",
      message: "secondBrain_notions model not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[NOTION_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}