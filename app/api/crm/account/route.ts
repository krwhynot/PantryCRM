import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

//Create new account route
async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      name,
      office_phone,
      website,
      fax,
      company_id,
      vat,
      email,
      billing_street,
      billing_postal_code,
      billing_city,
      billing_state,
      billing_country,
      shipping_street,
      shipping_postal_code,
      shipping_city,
      shipping_state,
      shipping_country,
      description,
      assigned_to,
      status,
      annual_revenue,
      member_of,
      industry,
    } = body;

    // Use organization model as proxy for crm_Accounts
    // Map fields from crm_Accounts to organization model
    const newAccount = await prismadb.organization.create({
      data: {
        // Core fields
        name,
        email,
        phone: office_phone || "",
        website: website || "",
        
        // Address fields - using correct field names from Organization model
        address: shipping_street || billing_street || "",
        city: shipping_city || billing_city || "",
        state: shipping_state || billing_state || "",
        zipCode: shipping_postal_code || billing_postal_code || "",
        
        // Notes field for additional info including account manager and extra data
        notes: `Account Manager: ${assigned_to || session.user.id}\n\nAdditional Data: ${JSON.stringify({
          fax,
          company_id,
          vat,
          billing_street,
          billing_postal_code,
          billing_city,
          billing_state,
          billing_country,
          description,
          annual_revenue,
          member_of,
          industry,
          status: "Active",
          createdBy: session.user.id,
          updatedBy: session.user.id,
          v: 0
        })}`,
        
        // Set required fields with defaults
        priority: "B",
        segment: "CASUAL_DINING", // Required field
        type: "PROSPECT"
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}

//Update account route
async function handlePUT(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      id,
      name,
      office_phone,
      website,
      fax,
      company_id,
      vat,
      email,
      billing_street,
      billing_postal_code,
      billing_city,
      billing_state,
      billing_country,
      shipping_street,
      shipping_postal_code,
      shipping_city,
      shipping_state,
      shipping_country,
      description,
      assigned_to,
      status,
      annual_revenue,
      member_of,
      industry,
    } = body;

    // Use organization model as proxy for crm_Accounts
    // Map fields from crm_Accounts to organization model
    const newAccount = await prismadb.organization.update({
      where: {
        id,
      },
      data: {
        // Core fields
        name,
        email,
        phone: office_phone || "",
        website: website || "",
        
        // Address fields - using correct field names from Organization model
        address: shipping_street || billing_street || "",
        city: shipping_city || billing_city || "",
        state: shipping_state || billing_state || "",
        zipCode: shipping_postal_code || billing_postal_code || "",
        
        // Store additional fields including account manager in notes (as JSON string)
        notes: `Account Manager: ${assigned_to || 'Not assigned'}\n\nAdditional Data: ${JSON.stringify({
          fax,
          company_id,
          vat,
          billing_street,
          billing_postal_code,
          billing_city,
          billing_state,
          billing_country,
          description,
          annual_revenue,
          member_of,
          industry,
          status: status || "Active",
          updatedBy: session.user.id,
          v: 0
        })}`,
        
        // Map status correctly - use status field instead of isActive
        status: status === "Inactive" ? "INACTIVE" : "ACTIVE"
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}

//GET all accounts route
async function handleGET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    // Use organization model as proxy for crm_Accounts
    const organizations = await prismadb.organization.findMany({
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isPrimary: true
          }
        }
      }
    });

    // Transform organizations to match expected crm_Accounts structure
    const accounts = organizations.map(org => {
      // Parse additional fields from notes if available
      let additionalFields = {};
      try {
        if (org.notes) {
          // Extract JSON from notes if it exists
          const jsonMatch = org.notes.match(/Additional Data: (\{.*\})/);
          if (jsonMatch) {
            additionalFields = JSON.parse(jsonMatch[1]);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        id: org.id,
        name: org.name,
        email: org.email,
        office_phone: org.phone,
        website: org.website,
        shipping_street: org.address,
        shipping_city: org.city,
        shipping_state: org.state,
        shipping_postal_code: org.zipCode,
        shipping_country: "", // Not in schema
        assigned_to: null, // Not in schema
        status: org.status === "ACTIVE" ? "Active" : "Inactive",
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        accountManager: null, // Not in schema
        ...additionalFields
      };
    });

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}




// Export handlers directly (wrappers incompatible with Next.js 15 dynamic routes)
export const POST = handlePOST;
export const PUT = handlePUT;
export const GET = handleGET;