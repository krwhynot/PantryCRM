import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handlePOST(req: Request, props: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  // Check if current user is admin
  const currentUser = await prismadb.user.findFirst({
    where: { email: session.user.email }
  });

  if (currentUser?.role !== "admin") {
    return new NextResponse("Unauthorized - Admin access required", { status: 403 });
  }

  try {
    const user = await prismadb.user.update({
      where: {
        id: params.userId,
      },
      data: {
        userStatus: "INACTIVE",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("[USERACTIVATE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}


// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });