import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";

export async function POST(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
  if (req.headers.get("content-type") !== "application/json") {
    return NextResponse.json(
      { message: "Invalid content-type" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const headers = req.headers;

  if (!body) {
    return NextResponse.json({ message: "No body" }, { status: 400 });
  }
  if (!headers) {
    return NextResponse.json({ message: "No headers" }, { status: 400 });
  }

  const { firstName, lastName, account, job, email, phone, lead_source } = body;

  //Validate auth with token from .env.local
  const token = headers.get("authorization");

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXTCRM_TOKEN) {
    return NextResponse.json(
      { message: "NEXTCRM_TOKEN not defined in .env.local file" },
      { status: 401 }
    );
  }

  if (token.trim() !== process.env.NEXTCRM_TOKEN.trim()) {
    console.log("Unauthorized");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  } else {
    if (!lastName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    try {
      // TODO: This route requires significant refactoring to correctly create an Opportunity.
      // The following is a placeholder structure and needs:
      // 1. Logic to find/create Organization from `account` (company name) and get `organizationId`.
      //    Example: const organization = await prismadb.organization.upsert({ where: { name: account }, update: { name: account }, create: { name: account, /* other required fields like accountManagerId, priorityId etc. */ } });
      // 2. Logic to find/create Contact from `firstName`, `lastName`, `email`, etc., link to Organization, and get `contactId`.
      //    Example: const contact = await prismadb.contact.create({ data: { firstName, lastName, email, phone, title: job, organizationId: organization.id } });
      // 3. Logic to assign a `userId` (account manager). This might come from the request or a default assignment rule.
      //    Example: const user = await prismadb.user.findFirst({ where: { role: 'manager' } }); const assignedUserId = user?.id;
      // 4. Logic to assign a `principal` (from Settings, category: 'PRINCIPAL'). This might also come from request or business logic.
      //    Example: const principalSetting = await prismadb.setting.findFirst({ where: { category: 'PRINCIPAL', active: true } }); const assignedPrincipalKey = principalSetting?.key;
      // 5. Validation for `status` ('NEW') and `stage` ('DEMO') values against Settings to ensure they are valid keys.

      const placeholderOrganizationId = "NEEDS_IMPLEMENTATION_FIND_OR_CREATE_ORGANIZATION_ID";
      const placeholderUserId = "NEEDS_IMPLEMENTATION_ASSIGN_USER_ID";
      const placeholderPrincipalKey = "NEEDS_IMPLEMENTATION_ASSIGN_PRINCIPAL_KEY";
      // const placeholderContactId = "NEEDS_IMPLEMENTATION_FIND_OR_CREATE_CONTACT_ID"; // Optional, but good to have

      await prismadb.opportunity.create({
        data: {
          organizationId: placeholderOrganizationId, // Critical: Must be a valid Organization ID
          userId: placeholderUserId,                 // Critical: Must be a valid User ID (Account Manager)
          principal: placeholderPrincipalKey,        // Critical: Must be a valid Principal Key (from Settings)
          stage: "DEMO", // Assuming 'type' from lead maps to 'stage'. Validate this key against Settings (category: OPPORTUNITY_STAGE).
          status: "NEW", // Validate this key against Settings (category: OPPORTUNITY_STATUS).
          source: lead_source, // From original lead data
          probability: 10, // Default probability for a new opportunity, adjust as needed.
          // contactId: placeholderContactId, // Optional: link contact if created/found.
          notes: JSON.stringify({
            originalLeadData: {
              v: 1, // Legacy field from crm_Leads
              firstName,
              lastName,
              company: account,
              jobTitle: job,
              email,
              phone,
              originalTypeFromLead: "DEMO", // Storing original 'type' for reference
            },
            dataSource: "create-lead-from-web",
            message: "This opportunity was created from a web lead. Review and complete required fields like Organization, Contact, User, Principal.",
          }),
          isActive: true, // Default for new opportunities
        },
      });

      return NextResponse.json({ message: "New lead created successfully" });
      //return res.status(200).json({ json: "newContact" });
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Error creating new lead" },
        { status: 500 }
      );
    }
  }
}


