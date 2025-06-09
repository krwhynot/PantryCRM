import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ taskId: string }> }) {
  // Task functionality not implemented in current schema
  return new NextResponse("Task functionality not implemented", { status: 501 });
}