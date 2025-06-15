import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

//Create route
async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
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
      assigned_to,
      assigned_account,
      birthday_day,
      birthday_month,
      birthday_year,
      description,
      email,
      personal_email,
      first_name,
      last_name,
      office_phone,
      mobile_phone,
      website,
      status,
      social_twitter,
      social_facebook,
      social_linkedin,
      social_skype,
      social_instagram,
      social_youtube,
      social_tiktok,
      type,
    } = body;

    // Use Contact model as proxy for crm_Contacts
    // First, need to ensure we have a valid organization
    if (!assigned_account) {
      return new NextResponse("Organization ID is required", { status: 400 });
    }
    
    // Check if the organization exists
    const organization = await prismadb.organization.findUnique({
      where: { id: assigned_account }
    });
    
    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }
    
    // Create the contact using the Contact model
    const newContact = await prismadb.contact.create({
      data: {
        // Map fields from crm_Contacts to Contact model
        firstName: first_name,
        lastName: last_name,
        email,
        phone: mobile_phone || office_phone || "",
        position: type || "", // Use position instead of title
        
        // Store additional information in notes field as JSON
        notes: JSON.stringify({
          birthday: birthday_day + "/" + birthday_month + "/" + birthday_year,
          description,
          personal_email,
          office_phone,
          website,
          status,
          social_twitter,
          social_facebook,
          social_linkedin,
          social_skype,
          social_instagram,
          social_youtube,
          social_tiktok,
          createdBy: userId,
          updatedBy: userId,
          v: 0
        }),
        
        // Connect to organization
        organization: {
          connect: {
            id: assigned_account
          }
        },
        
        // Default values for required fields
        // isActive field doesn't exist in Contact model - removing
      },
    });

    // Email notification will be implemented in Task 7 with Azure Communication Services
    if (assigned_to !== userId) {
      // Use user model instead of non-existent users model
      const notifyRecipient = await prismadb.user.findUnique({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      // Use placeholder implementation until Task 7 (Azure Communication Services)
      
      // Call with required parameters as per the function signature
      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.cz",
        subject: `New contact ${first_name} ${last_name} notification (placeholder)`,
        text: `This is a placeholder email. Email functionality will be migrated to Azure Communication Services in Task 7.`
      });
    }

    return NextResponse.json({ newContact }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}

//Update route
async function handlePUT(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
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
      assigned_account,
      assigned_to,
      birthday_day,
      birthday_month,
      birthday_year,
      description,
      email,
      personal_email,
      first_name,
      last_name,
      office_phone,
      mobile_phone,
      website,
      status,
      social_twitter,
      social_facebook,
      social_linkedin,
      social_skype,
      social_instagram,
      social_youtube,
      social_tiktok,
      type,
    } = body;


    // Use Contact model as proxy for crm_Contacts
    // First, check if the contact exists
    const existingContact = await prismadb.contact.findUnique({
      where: { id }
    });
    
    if (!existingContact) {
      return new NextResponse("Contact not found", { status: 404 });
    }
    
    // Update the contact using the Contact model
    const newContact = await prismadb.contact.update({
      where: {
        id,
      },
      data: {
        // Map fields from crm_Contacts to Contact model
        firstName: first_name,
        lastName: last_name,
        email,
        phone: mobile_phone || office_phone || "",
        position: type || "", // Use position instead of title
        
        // Store additional information in notes field as JSON
        notes: JSON.stringify({
          birthday: birthday_day + "/" + birthday_month + "/" + birthday_year,
          description,
          personal_email,
          office_phone,
          website,
          status,
          social_twitter,
          social_facebook,
          social_linkedin,
          social_skype,
          social_instagram,
          social_youtube,
          social_tiktok,
          updatedBy: userId,
          v: 0
        }),
        
        // Update organization if provided
        ...(assigned_account ? {
          organization: {
            connect: {
              id: assigned_account
            }
          }
        } : {}),
        
        // Default values for required fields
        // isActive field doesn't exist in Contact model - removing
      },
    });

    /* 
    // Email notification is commented out since it will be implemented in Task 7 with Azure Communication Services
    if (assigned_to !== userId) {
      // Use user model instead of non-existent users model
      const notifyRecipient = await prismadb.user.findUnique({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      // Use placeholder implementation until Task 7 (Azure Communication Services)
      
      // Call with required parameters as per the function signature
      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.cz",
        subject: `New contact ${first_name} ${last_name} notification (placeholder)`,
        text: `This is a placeholder email. Email functionality will be migrated to Azure Communication Services in Task 7.`
      });
    } 
    */

    return NextResponse.json({ newContact }, { status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });
export const PUT = withRateLimit(withErrorHandler(handlePUT), { maxAttempts: 100, windowMs: 60000 });