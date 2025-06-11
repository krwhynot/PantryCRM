import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Input validation schema
const searchSchema = z.object({
  data: z.string()
    .min(1, "Search term cannot be empty")
    .max(100, "Search term too long")
    .regex(/^[a-zA-Z0-9\s@.-]+$/, "Search term contains invalid characters")
});

// Input sanitization function
function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .trim()
    .substring(0, 100); // Limit length
}

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid search input", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Sanitize search input
    const search = sanitizeSearchInput(validation.data.data);
    //Search in modul CRM (Oppotunities)
    const resultsCrmOpportunities = await prismadb.opportunity.findMany({
      where: {
        OR: [
          { notes: { contains: search } },
          { principal: { contains: search } },
          // add more fields as needed
        ],
      },
    });

    //Search in modul CRM (Accounts)
    const resultsCrmAccounts = await prismadb.organization.findMany({
      where: {
        OR: [
          { description: { contains: search,  } },
          { name: { contains: search,  } },
          { email: { contains: search,  } },
          // add more fields as needed
        ],
      },
    });

    //Search in modul CRM (Contacts)
    const resultsCrmContacts = await prismadb.contact.findMany({
      where: {
        OR: [
          { lastName: { contains: search,  } },
          { firstName: { contains: search,  } },
          { email: { contains: search,  } },
          // add more fields as needed
        ],
      },
    });

    //Search in local user database
    const resultsUser = await prismadb.user.findMany({
      where: {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
          // add more fields as needed
        ],
      },
    });

    // Tasks model not implemented - returning empty array
    const resultsTasks: any[] = []; /*await prismadb.tasks.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
          // add more fields as needed
        ],
      },
    }); */

    // Boards model not implemented - returning empty array  
    const reslutsProjects: any[] = []; /*await prismadb.boards.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          // add more fields as needed
        ],
      },
    }); */

    const data = {
      opportunities: resultsCrmOpportunities,
      accounts: resultsCrmAccounts,
      contacts: resultsCrmContacts,
      users: resultsUser,
      tasks: resultsTasks,
      projects: reslutsProjects,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("[FULLTEXT_SEARCH_POST]", error);
    return NextResponse.json(
      { error: "Search operation failed" },
      { status: 500 }
    );
  }
}


