import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const data = body;

  const search = data.data;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  //return new NextResponse("Done", { status: 200 });

  try {
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
    console.log("[FULLTEXT_SEARCH_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}


