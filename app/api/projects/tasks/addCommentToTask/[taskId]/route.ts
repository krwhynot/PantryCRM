import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import NewTaskCommentEmail from "@/emails/NewTaskComment";
import resendHelper from "@/lib/resend";

export async function POST(
  req: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  const params = await props.params;
  const resend = await resendHelper();
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { comment } = body;
  const { taskId } = params;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!taskId) {
    return new NextResponse("Missing taskId", { status: 400 });
  }

  if (!comment) {
    return new NextResponse("Missing comment", { status: 400 });
  }

  try {
    // Task comments not implemented - missing Task model
    return NextResponse.json({ 
      error: "Task comment feature not implemented",
      message: "Task model not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log("[COMMENTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}