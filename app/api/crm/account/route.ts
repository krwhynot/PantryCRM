import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

//Create new account route
export async function POST(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
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
        addressLine1: shipping_street || billing_street || "",
        addressLine2: "",  // No direct mapping, leaving empty
        city: shipping_city || billing_city || "",
        state: shipping_state || billing_state || "",
        postalCode: shipping_postal_code || billing_postal_code || "",
        country: shipping_country || billing_country || "",
        
        // Account manager
        accountManager: {
          connect: {
            id: assigned_to || session.user.id
          }
        },
        
        // Store additional fields in description (as JSON string)
        description: JSON.stringify({
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
        }),
        
        // Default values for required fields
        isActive: true
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    console.log("[NEW_ACCOUNT_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//Update account route
export async function PUT(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
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
        addressLine1: shipping_street || billing_street || "",
        addressLine2: "",  // No direct mapping, leaving empty
        city: shipping_city || billing_city || "",
        state: shipping_state || billing_state || "",
        postalCode: shipping_postal_code || billing_postal_code || "",
        country: shipping_country || billing_country || "",
        
        // Account manager - only update if provided
        ...(assigned_to ? {
          accountManager: {
            connect: {
              id: assigned_to
            }
          }
        } : {}),
        
        // Store additional fields in description (as JSON string)
        description: JSON.stringify({
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
        }),
        
        // Default values for required fields
        isActive: status === "Inactive" ? false : true
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    console.log("[UPDATE_ACCOUNT_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//GET all accounts route
export async function GET(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    // Use organization model as proxy for crm_Accounts
    const organizations = await prismadb.organization.findMany({
      include: {
        accountManager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Transform organizations to match expected crm_Accounts structure
    const accounts = organizations.map(org => {
      // Parse additional fields from description if available
      let additionalFields = {};
      try {
        if (org.description) {
          additionalFields = JSON.parse(org.description);
        }
      } catch (e) {
        console.log("Error parsing organization description:", e);
      }

      return {
        id: org.id,
        name: org.name,
        email: org.email,
        office_phone: org.phone,
        website: org.website,
        shipping_street: org.addressLine1,
        shipping_city: org.city,
        shipping_state: org.state,
        shipping_postal_code: org.postalCode,
        shipping_country: org.country,
        assigned_to: org.accountManagerId,
        status: org.isActive ? "Active" : "Inactive",
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        accountManager: org.accountManager,
        ...additionalFields
      };
    });

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    console.log("[ACCOUNTS_GET]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}


