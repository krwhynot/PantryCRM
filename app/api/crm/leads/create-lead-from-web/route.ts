import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { CreateLeadFromWebSchema, APITokenSchema } from '@/lib/validations/lead';
import { validateInput } from '@/lib/api-error-handler';
import { withEnhancedRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/enhanced-rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { withErrorHandler } from '@/lib/api-error-handler';
import crypto from 'crypto';

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // SECURITY FIX: Remove authentication requirement for public lead creation endpoint
  // This is a public API endpoint for web forms
  
  // Validate content type
  if (req.headers.get("content-type") !== "application/json") {
    return NextResponse.json(
      { error: "Invalid content-type. Expected application/json" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    
    // SECURITY FIX: Validate input with Zod schema
    const validatedData = validateInput(CreateLeadFromWebSchema, body);
    const { firstName, lastName, account, job, email, phone, lead_source } = validatedData;

    // SECURITY FIX: Improve token validation with timing attack protection
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader) {
      logSecurityEvent('authn_fail', {
        endpoint: req.nextUrl.pathname,
        reason: 'missing_token'
      }, req);
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    if (!process.env.NEXTCRM_TOKEN) {
      console.error('[SECURITY] NEXTCRM_TOKEN not configured');
      return NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 503 }
      );
    }

    // SECURITY FIX: Use crypto.timingSafeEqual to prevent timing attacks
    const providedToken = Buffer.from(authHeader.trim());
    const expectedToken = Buffer.from(process.env.NEXTCRM_TOKEN.trim());
    
    if (providedToken.length !== expectedToken.length || 
        !crypto.timingSafeEqual(providedToken, expectedToken)) {
      logSecurityEvent('authn_fail', {
        endpoint: req.nextUrl.pathname,
        reason: 'invalid_token'
      }, req);
      return NextResponse.json({ error: "Invalid authorization token" }, { status: 401 });
    }
    // SECURITY FIX: Disable placeholder implementation that contains hard-coded invalid IDs
    // This endpoint should be disabled until proper implementation is completed
    logSecurityEvent('admin_action', {
      action: 'attempted_lead_creation_with_placeholder_implementation',
      endpoint: req.nextUrl.pathname,
      data: { firstName, lastName, email, account }
    }, req);
    
    return NextResponse.json(
      { 
        error: "Lead creation endpoint temporarily disabled",
        message: "This endpoint requires proper implementation of organization and user assignment logic"
      },
      { status: 503 }
    );

    /* 
    // TODO: Complete implementation with proper validation:
    // 1. Find/create Organization
    // 2. Find/create Contact  
    // 3. Assign valid User ID
    // 4. Assign valid Principal
    // 5. Validate status/stage values
    
    try {
      await prismadb.opportunity.create({
        data: {
          // Implementation needed
        },
      });

      return NextResponse.json({ message: "Lead created successfully" });
    } catch (error) {
      logSecurityEvent('database_error', {
        endpoint: req.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, req);
      
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 }
      );
    }
    */
  } catch (error) {
    console.error('[CREATE_LEAD_FROM_WEB]', error);
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  }
}




// Export with enhanced rate limiting and error handling
export const POST = withEnhancedRateLimit(
  withErrorHandler(handlePOST), 
  RATE_LIMIT_CONFIGS.authentication // Strict limits for token-based endpoints
);