import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';
import { cachedQuery, CacheKeys, CacheStrategies } from '@/lib/cache';

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  // Fallback to session check for compatibility
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      account,
      assigned_to,
      budget,
      campaign,
      close_date,
      contact,
      currency,
      description,
      expected_revenue,
      name,
      next_step,
      sales_stage,
      type,
    } = body;

    const newOpportunity = await prismadb.opportunity.create({
      data: {
        organizationId: account, // assuming account is organization ID
        contactId: contact, // assuming contact is contact ID
        userId: userId,
        principal: type, // using type as principal
        stage: sales_stage,
        status: "ACTIVE",
        expectedRevenue: expected_revenue ? Number(expected_revenue) : null,
        expectedCloseDate: close_date ? new Date(close_date) : null,
        notes: description,
        probability: 10, // default probability for new opportunities
      },
    });

    if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.user.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.cz",
        subject: `New opportunity has been assigned to you`,
        text: `A new opportunity has been added to the system and assigned to you. View details: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newOpportunity.id}`,
      });
    }

    return NextResponse.json({ newOpportunity }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}
async function handlePUT(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  // Fallback to session check for compatibility
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      id,
      account,
      assigned_to,
      budget,
      campaign,
      close_date,
      contact,
      currency,
      description,
      expected_revenue,
      name,
      next_step,
      sales_stage,
      type,
    } = body;

    const updatedOpportunity = await prismadb.opportunity.update({
      where: { id },
      data: {
        organizationId: account,
        contactId: contact,
        userId: assigned_to,
        principal: type,
        stage: sales_stage,
        status: "ACTIVE",
        expectedRevenue: expected_revenue ? Number(expected_revenue) : null,
        expectedCloseDate: close_date ? new Date(close_date) : null,
        notes: description,
      },
    });

    /* if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.user.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.cz",
        subject: `New opportunity has been assigned to you`,
        text: `A new opportunity has been added to the system and assigned to you. View details: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newOpportunity.id}`,
      });
    } */

    return NextResponse.json({ updatedOpportunity }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}

async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  // Fallback to session check for compatibility
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // OPTIMIZED: Execute all queries in parallel to avoid N+1 problem + add caching for settings
    const [users, accounts, contacts, saleTypes, saleStages, industries] = await Promise.all([
      prismadb.user.findMany({}),
      prismadb.organization.findMany({}),
      prismadb.contact.findMany({}),
      cachedQuery(
        CacheKeys.systemSettings('PRINCIPAL'),
        () => prismadb.systemSetting.findMany({ where: { key: { startsWith: "PRINCIPAL_" } } }),
        CacheStrategies.LONG
      ),
      cachedQuery(
        CacheKeys.systemSettings('STAGE'),
        () => prismadb.systemSetting.findMany({ where: { key: { startsWith: "STAGE_" } } }),
        CacheStrategies.LONG
      ),
      cachedQuery(
        CacheKeys.systemSettings('SEGMENT'),
        () => prismadb.systemSetting.findMany({ where: { key: { startsWith: "SEGMENT_" } } }),
        CacheStrategies.LONG
      )
    ]);
    
    // Static data - no database query needed
    const campaigns: any[] = [];

    const data = {
      users,
      accounts,
      contacts,
      saleTypes,
      saleStages,
      campaigns,
      industries,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });