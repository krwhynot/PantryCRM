import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { newUserNotify } from "@/lib/new-user-notify";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: NextRequest);
  if (error) return error; Promise<Response> {
  try {
    const body = await req.json();
    const { name, username, email, language, password, confirmPassword } = body;

    if (!name || !email || !language || !password || !confirmPassword) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (password !== confirmPassword) {
      return new NextResponse("Password does not match", { status: 401 });
    }

    const checkexisting = await prismadb.user.findFirst({
      where: {
        email: email,
      },
    });

    if (checkexisting) {
      return new NextResponse("User already exist", { status: 401 });
    }

    /*
    Check if user is first user in the system. If yes, then create user with admin rights. If not, then create user with no admin rights.
    */

    const isFirstUser = await prismadb.user.findMany({});
    if (isFirstUser.length === 0) {
      //There is no user in the system, so create user with admin rights and set userStatus to ACTIVE
      const user = await prismadb.user.create({
        data: {
          name,
          username,
          avatar: "",
          account_name: "",
          is_account_admin: false,
          is_admin: true,
          email,
          userLanguage: language,
          userStatus: "ACTIVE",
          password: await hash(password, 12),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          // Exclude password from response
        }
      });
      return NextResponse.json(user);
    } else {
      //There is at least one user in the system, so create user with no admin rights and set userStatus to PENDING
      const user = await prismadb.user.create({
        data: {
          name,
          username,
          avatar: "",
          account_name: "",
          is_account_admin: false,
          is_admin: false,
          email,
          userLanguage: language,
          userStatus:
            process.env.NEXT_PUBLIC_APP_URL === "https://demo.nextcrm.io"
              ? "ACTIVE"
              : "PENDING",
          password: await hash(password, 12),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          // Exclude password from response
        }
      });

      /*
      Function will send email to all admins about new user registration which is in PENDING state and need to be activated
    */
      newUserNotify(user);

      return NextResponse.json(user);
    }
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}

async function handleGET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: NextRequest);
  if (error) return error; Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Only return safe user data, exclude password and other sensitive fields
    const users = await prismadb.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // Exclude password, and other sensitive fields
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });