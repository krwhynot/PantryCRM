import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  // Task functionality not implemented in current schema
  return new NextResponse("Task functionality not implemented", { status: 501 });
}

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  // Task functionality not implemented in current schema
  return new NextResponse("Task functionality not implemented", { status: 501 });
}