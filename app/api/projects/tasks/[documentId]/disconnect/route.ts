import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ documentId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body) return NextResponse.json({ error: "No body" }, { status: 400 });

  const { taskId } = body;

  console.log(taskId, "taskId");

  const { documentId } = params;
  console.log(documentId, "documentId");

  try {
    // Task-document disconnect not implemented - missing Task and Document models
    return NextResponse.json({ 
      error: "Task-document disconnect feature not implemented",
      message: "Task and Document models not available in current schema" 
    }, { status: 501 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
