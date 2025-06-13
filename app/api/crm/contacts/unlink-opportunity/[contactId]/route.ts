import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

//Route to unlink contact from opportunity
async function handlePUT(req: Request, props: { params: Promise<{ contactId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!params.contactId) {
    return new NextResponse("contact ID is required", { status: 400 });
  }

  const body = await req.json();

  const { opportunityId } = body;

  if (!opportunityId) {
    return new NextResponse("opportunity ID is required", { status: 400 });
  }

  try {
    await prismadb.contact.update({
      where: {
        id: params.contactId,
      },
      //Disconnect opportunity ID from contacts opportunities array
      data: {
        opportunities: {
          disconnect: {
            id: opportunityId,
          },
        },
      },
    });
  } catch (error) {
    return new NextResponse(
      "[CONTACTS - UNLINK - PUT] - Error, somethings went wrong",
      { status: 500 }
    );
  }
  return NextResponse.json("Hello World", { status: 200 });
}


// Export with authentication, rate limiting, and error handling
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });