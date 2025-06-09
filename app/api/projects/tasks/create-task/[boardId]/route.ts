import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import NewTaskFromProject from "@/emails/NewTaskFromProject";
import resendHelper from "@/lib/resend";

export async function POST(req: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  const resend = await resendHelper();
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { boardId } = params;
  const { title, priority, content, section, user, dueDateAt } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!section) {
    return new NextResponse("Missing section id", { status: 400 });
  }

  try {
    // Task creation not implemented - missing Task and Board models
    return NextResponse.json({ 
      error: "Task creation feature not implemented",
      message: "Task model not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[NEW_TASK_IN_PROJECT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}