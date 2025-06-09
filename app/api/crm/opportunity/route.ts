import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
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

    //console.log(req.body, "req.body");

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
    console.log("[NEW_OPPORTUNITY_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
export async function PUT(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
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

    //console.log(req.body, "req.body");

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
    console.log("[UPDATED_OPPORTUNITY_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const users = await prismadb.user.findMany({});
    const accounts = await prismadb.organization.findMany({});
    const contacts = await prismadb.contact.findMany({});
    // Using settings for dropdown data
    const saleTypes = await prismadb.setting.findMany({ where: { category: "PRINCIPAL" } });
    const saleStages = await prismadb.setting.findMany({ where: { category: "STAGE" } });
    const campaigns: any[] = [];
    const industries = await prismadb.setting.findMany({ where: { category: "SEGMENT" } });

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
    console.log("[GET_OPPORTUNITIES]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}


