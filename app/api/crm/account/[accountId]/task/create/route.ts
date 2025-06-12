import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// import NewTaskFromCRMEmail from "@/emails/NewTaskFromCRM";
// import NewTaskFromCRMToWatchersEmail from "@/emails/NewTaskFromCRMToWatchers";
import resendHelper from "@/lib/resend";

/**
 * Create new task from CRM in project route
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interaction model as proxy for crm_Accounts_Tasks
 * This is a temporary implementation until proper task management functionality is implemented
 */
export async function POST(req: Request) {
  /*
  Resend.com function init - this is a helper function that will be used to send emails
  */
  const resend = await resendHelper();

  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { title, user, priority, content, account, dueDateAt } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title || !user || !priority || !content || !account) {
    return new NextResponse("Missing one of the task data ", { status: 400 });
  }

  try {
    // First, get a valid interaction type ID to use for tasks
    const taskInteractionType = await prismadb.setting.findFirst({
      where: {
        category: "InteractionType",
        key: "Task" // Using "Task" as the interaction type
      }
    });

    // If no Task interaction type exists, create one
    const typeId = taskInteractionType?.id || 
      (await prismadb.setting.create({
        data: {
          category: "InteractionType",
          key: "Task",
          label: "Task",
          sortOrder: 100,
          active: true
        }
      })).id;
    
    // Use interaction model as a proxy for crm_Accounts_Tasks
    const task = await prismadb.interaction.create({
      data: {
        // Store task content and metadata in notes field
        notes: `[TASK] ${title}\n\n${content}\n\n---\nTask Priority: ${priority}`,
        followUpDate: dueDateAt,
        isCompleted: false,
        userId: user,
        organizationId: account,
        interactionDate: new Date(), // Required field based on our schema
        typeId: typeId // Required field based on our schema
      },
      include: {
        user: true,
        organization: true
      }
    });

    //Notification to user who is not a task creator or Account watcher
    if (user !== session.user.id) {
      try {
        // Use user model instead of users
        const notifyRecipient = await prismadb.user.findUnique({
          where: { id: user },
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
