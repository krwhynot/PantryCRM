import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, props: { params: Promise<{ invoiceId: string }> }) {
  // Invoice functionality not implemented in current schema
  return new NextResponse("Invoice functionality not implemented", { status: 501 });
}