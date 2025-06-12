import { NextRequest, NextResponse } from "next/server";
import { requireResourceOwnership } from "@/lib/authorization";
import { logDataAccess, logSecurityEvent } from "@/lib/security-logger";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

// Input validation schema
const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long").optional(),
  account_name: z.string().max(100, "Account name too long").optional()
});

async function handlePUT(req: NextRequest, props: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req: NextRequest);
  if (error) return error;
  const params = await props.params;
  
  // SECURITY: Prevent IDOR vulnerability - verify user ownership or admin privileges
  const authResult = await requireResourceOwnership(req, params.userId, 'user');
  if (!authResult.authorized) {
    return authResult.error!;
  }

  if (!params.userId) {
    return new NextResponse("No user ID provided", { status: 400 });
  }

  try {
    const body = await req.json();
    
    // Validate input data
    const validationResult = UpdateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurityEvent('input_validation_fail', {
        userId: authResult.user!.id,
        endpoint: '/api/user/[userId]/updateprofile',
        errors: validationResult.error.errors
      }, req);
      
      return NextResponse.json({
        error: "Invalid input data",
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { name, username, account_name } = validationResult.data;

    // Check if username is already taken (if provided)
    if (username) {
      const existingUser = await prismadb.user.findFirst({
        where: {
          username: username,
          id: { not: params.userId } // Exclude current user
        }
      });

      if (existingUser) {
        return NextResponse.json({
          error: "Username already exists"
        }, { status: 409 });
      }
    }

    // Update user profile
    const updatedUser = await prismadb.user.update({
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(account_name && { account_name }),
        updatedAt: new Date()
      },
      where: {
        id: params.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        account_name: true,
        email: true,
        updatedAt: true
      }
    });

    // Log the profile update for audit trail
    logSecurityEvent('data_access', {
      userId: authResult.user!.id,
      action: 'PROFILE_UPDATE',
      targetUserId: params.userId,
      updatedFields: Object.keys(validationResult.data).filter(key => validationResult.data[key] !== undefined)
    }, req);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logSecurityEvent('data_access', {
      userId: authResult.user!.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/user/[userId]/updateprofile',
      action: 'PUT'
    }, req);
    
    return new NextResponse("Failed to update profile", { status: 500 });
  }
}

// Export with authentication, rate limiting, and error handling
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });