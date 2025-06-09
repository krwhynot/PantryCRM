import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Interaction functionality not implemented in current schema
  return new NextResponse("Interaction functionality not implemented", { status: 501 });
}

export async function GET(req: NextRequest) {
  // Interaction functionality not implemented in current schema
  return new NextResponse("Interaction functionality not implemented", { status: 501 });
}