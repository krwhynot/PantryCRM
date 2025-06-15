import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// import NewTaskFromCRMEmail from "@/emails/NewTaskFromCRM";
// import NewTaskFromCRMToWatchersEmail from "@/emails/NewTaskFromCRMToWatchers";
import resendHelper from "@/lib/resend";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * Create new task from CRM in project route
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interaction model as proxy for crm_Accounts_Tasks
 * This is a temporary implementation until proper task management functionality is implemented
 */
async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  /*
  Resend.com function init - this is a helper function that will be used to send emails
  */
  const resend = await resendHelper();

  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { title, user: assignedUserId, priority, content, account, dueDateAt } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title || !assignedUserId || !priority || !content || !account) {
    return new NextResponse("Missing one of the task data ", { status: 400 });
  }

  try {
    // First, get a valid interaction type ID to use for tasks
    const taskInteractionType = await prismadb.systemSetting.findFirst({
      where: {
        key: "InteractionType_Task" // Using consistent key format
      }
    });

    // If no Task interaction type exists, create one
    const typeId = taskInteractionType?.id || 
      (await prismadb.systemSetting.create({
        data: {
          key: "InteractionType_Task",
          value: "Task",
          type: "string"
        }
      })).id;
    
    // Use interaction model as a proxy for crm_Accounts_Tasks
    const task = await prismadb.interaction.create({
      data: {
        // Store task content and metadata in description field
        subject: `[TASK] ${title}`,
        description: `${content}\n\n---\nTask Priority: ${priority}\nAssigned to: ${assignedUserId}`,
        type: "TASK",
        organizationId: account,
        date: new Date(), // Required field based on our schema
        nextAction: dueDateAt ? `Follow up on ${dueDateAt}` : null
      },
      include: {
        organization: true,
        contact: true
      }
    });

    //Notification to user who is not a task creator or Account watcher
    if (assignedUserId !== session.user.id) {
      try {
        // Use user model instead of users
        const notifyRecipient = await prismadb.user.findUnique({
          where: { id: assignedUserId },
        });


        // Email sending has been migrated to Azure Communication Services
        // This is a placeholder until Task 7 implementation
        
        // Email sending temporarily disabled
        // const emailResult = await resend.emails.send();
      } catch (error) {
        // Error handling for email notifications
      }
    }

    //Notification to user who are account watchers
    try {
      // Use user model instead of users
      // Note: watching_accountsIDs field doesn't exist in user model, using metadata as proxy
      const emailRecipients = await prismadb.user.findMany({
        where: {
          //Send to all users except the user who created the comment
          id: {
            not: session.user.id,
          }
        },
      });
      
      // In the current schema, User model doesn't have metadata field
      // This is a temporary implementation until proper watching functionality is implemented
      // For now, we'll assume no users are watching accounts
      const watchingUsers: typeof emailRecipients = [];
      
      //Create notifications for every user watching the specific account except the user who created the task
      for (const userWatching of watchingUsers) {
        const user = await prismadb.user.findUnique({
          where: {
            id: userWatching.id,
          },
        });
        // Email sending has been migrated to Azure Communication Services
        // This is a placeholder until Task 7 implementation
        
        // Call the placeholder function without arguments as per implementation
        const emailResult = await resend.emails.send();
      }
    } catch (error) {
      // Error handling for watcher notifications
    }

    return NextResponse.json({ status: 200 });
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}


// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });