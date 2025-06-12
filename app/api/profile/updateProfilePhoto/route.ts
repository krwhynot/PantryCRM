import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handlePUT(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: NextRequest);
  if (error) return error; Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
      }
    );
  }

  const body = await req.json();

  if (!body.avatar) {
    return NextResponse.json(
      { message: "No avatar provided" },
      {
        status: 400,
      }
    );
  }

  try {
    await prismadb.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image: body.avatar, // Using 'image' field from User model
      },
    });
    return NextResponse.json(
      { message: "Profile photo updated" },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Error updating profile photo" },
      {
        status: 500,
      }
    );
  }
}




// Export with authentication, rate limiting, and error handling
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });