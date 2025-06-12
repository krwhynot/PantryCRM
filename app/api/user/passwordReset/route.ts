"use server";

import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { hash } from "bcryptjs";
import PasswordResetEmail from "@/emails/PasswordReset";
import resendHelper from "@/lib/resend";
import crypto from "crypto";
import { z } from "zod";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

// Rate limiting store (in production, use Redis or database)
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Validation schema
const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address")
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// Generate secure reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Check rate limiting
function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempt = resetAttempts.get(email);
  
  if (!attempt) {
    resetAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset counter if more than 1 hour has passed
  if (now - attempt.lastAttempt > 3600000) {
    resetAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Allow max 3 attempts per hour
  if (attempt.count >= 3) {
    return false;
  }
  
  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

// Request password reset (sends reset token via email)
async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // SECURITY FIX: Remove authentication check for password reset requests
  // Password reset should be available to unauthenticated users
  try {
    const body = await req.json();
    
    // Validate input
    const validation = passwordResetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again in an hour." },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prismadb.user.findFirst({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        message: "If an account with that email exists, a reset link has been sent." 
      });
    }

    // Generate secure reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prismadb.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email with token
    const resend = await resendHelper();
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: user.email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetUrl}`,
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({ 
      message: "If an account with that email exists, a reset link has been sent." 
    });
  } catch (error) {
    console.error("[PASSWORD_RESET_POST]", error);
    return NextResponse.json(
      { error: "Password reset request failed" },
      { status: 500 }
    );
  }
}

// Reset password with token
async function handlePUT(req: NextRequest): Promise<NextResponse> {
  // SECURITY FIX: Remove authentication check for token-based password reset
  // Token validation provides sufficient authentication
  try {
    const body = await req.json();
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token, newPassword } = validation.data;

    // Find user with valid reset token
    const user = await prismadb.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    await prismadb.user.update({
      where: { id: user.id },
      data: {
        password: await hash(newPassword, 12),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ 
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("[PASSWORD_RESET_PUT]", error);
    return NextResponse.json(
      { error: "Password reset failed" },
      { status: 500 }
    );
  }
}


// Export with stricter rate limiting and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 5, windowMs: 3600000 }); // 5/hour
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 10, windowMs: 3600000 }); // 10/hour