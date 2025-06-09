import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import resendHelper from "@/lib/resend";

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  const resend = await resendHelper();
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const {
    title,
    user,
    board,
    priority,
    content,
    notionUrl,
    account,
    dueDateAt,
  } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title || !user || !board || !priority || !content) {
    return new NextResponse("Missing one of the task data", { status: 400 });
  }

  try {
    // Task creation not implemented - missing Task, Section and Board models
    return NextResponse.json({ 
      error: "Task creation feature not implemented",
      message: "Task, Section and Board models not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[NEW_BOARD_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}