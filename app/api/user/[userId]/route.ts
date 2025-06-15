import { NextRequest, NextResponse } from "next/server";
import { requireResourceOwnership } from "@/lib/authorization";
import { logDataAccess, logSecurityEvent } from "@/lib/security-logger";
import { prismadb } from "@/lib/prisma";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleGET(req: NextRequest, props: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  
  // SECURITY: Prevent IDOR vulnerability - verify user ownership or admin privileges
  const authResult = await requireResourceOwnership(req, params.userId, 'user');
  if (!authResult.authorized) {
    return authResult.error!;
  }

  try {
    const user = await prismadb.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
        // Exclude sensitive fields like password, resetToken
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Log data access for audit trail
    logDataAccess(
      authResult.user!.id,
      'user',
      params.userId,
      'read',
      req
    );

    return NextResponse.json(user);
  } catch (error) {
    logSecurityEvent('data_access', {
      userId: authResult.user!.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/user/[userId]',
      action: 'GET'
    }, req);
    
    return new NextResponse("Internal server error", { status: 500 });
  }
}

async function handleDELETE(req: NextRequest, props: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const params = await props.params;
  
  // SECURITY: Only admins can delete users (high-privilege operation)
  const authResult = await requireResourceOwnership(req, params.userId, 'user');
  if (!authResult.authorized) {
    return authResult.error!;
  }

  // Additional check: only admins can delete users
  if (authResult.user!.role !== 'admin') {
    logSecurityEvent('unauthorized_access_attempt', {
      userId: authResult.user!.id,
      userRole: authResult.user!.role,
      attemptedAction: 'DELETE_USER',
      targetUserId: params.userId
    }, req);
    
    return new NextResponse("Forbidden - Admin privileges required", { status: 403 });
  }

  // Prevent self-deletion
  if (authResult.user!.id === params.userId) {
    return new NextResponse("Cannot delete your own account", { status: 400 });
  }

  try {
    // Soft delete by deactivating instead of hard delete
    const user = await prismadb.user.update({
      where: { id: params.userId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    // Log critical administrative action
    logSecurityEvent('admin_action', {
      adminUserId: authResult.user!.id,
      action: 'USER_DEACTIVATED',
      targetUserId: params.userId,
      targetUserEmail: user.email
    }, req);

    return NextResponse.json({ 
      message: "User deactivated successfully",
      user 
    });
  } catch (error) {
    logSecurityEvent('admin_action', {
      adminUserId: authResult.user!.id,
      action: 'USER_DELETE_FAILED',
      targetUserId: params.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, req);
    
    return new NextResponse("Failed to deactivate user", { status: 500 });
  }
}

// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const GET = handleGET;
export const DELETE = handleDELETE;