import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth";
import resendHelper from "@/lib/resend";
import { getServerSession } from "next-auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: NextRequest);
  if (error) return error; Promise<Response> {
  /*
  Resend.com function init - this is a helper function that will be used to send emails
  */
  const resend = await resendHelper();
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  const body = await req.json();
  if (!body) {
    return new NextResponse("Missing body", { status: 400 });
  }
  const { feedback } = body;

  if (!feedback) {
    return new NextResponse("Missing feedback", { status: 400 });
  }

  try {
    //Send mail via Resend to info@softbase.cz
    await resend.emails.send({
      from:
        process.env.NEXT_PUBLIC_APP_NAME + " <" + process.env.EMAIL_FROM + ">",
      to: "info@softbase.cz",
      subject: "New Feedback from: " + process.env.NEXT_PUBLIC_APP_URL,
      text: feedback, // Add this line to fix the types issue
    });
    return NextResponse.json({ message: "Feedback sent" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Initial error" }, { status: 500 });
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });