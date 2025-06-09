import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // OpenAI functionality not implemented in current schema
  return new NextResponse("OpenAI functionality not implemented", { status: 501 });
}