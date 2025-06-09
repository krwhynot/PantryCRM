import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ invoiceId: string }> }) {
  // Invoice functionality not implemented in current schema
  return new NextResponse("Invoice functionality not implemented", { status: 501 });
}

export async function DELETE(req: Request, props: { params: Promise<{ invoiceId: string }> }) {
  // Invoice functionality not implemented in current schema
  return new NextResponse("Invoice functionality not implemented", { status: 501 });
}