import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import resendHelper from "@/lib/resend";

export async function PUT(req: Request, props: { params: Promise<{ taskId: string }> }) {
  const params = await props.params;
  const resend = await resendHelper();
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const {
    title,
    user,
    board,
    boardId,
    priority,
    content,
    notionUrl,
    dueDateAt,
  } = body;

  const taskId = params.taskId;

  if (!taskId) {
    return new NextResponse("Missing task id", { status: 400 });
  }

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title || !user || !priority || !content) {
    return new NextResponse("Missing one of the task data", { status: 400 });
  }

  try {
    // Task update not implemented - missing Task, Section and Board models
    return NextResponse.json({ 
      error: "Task update feature not implemented",
      message: "Task, Section and Board models not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[TASK_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}