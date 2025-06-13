import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { withBatchTimeout, QUERY_TIMEOUTS } from "@/lib/query-timeout";
import { cacheSearch } from "@/lib/result-cache";
import { timeOperation } from "@/lib/performance-monitoring";

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

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

async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  return timeOperation('fulltext-search', async () => {
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
    
    // Use caching for search results to improve performance
    const searchResults = await cacheSearch(
      { search, timestamp: Math.floor(Date.now() / (5 * 60 * 1000)) }, // 5min cache buckets
      async () => {
        // Execute all search queries in parallel with timeout protection
        const [resultsCrmOpportunities, resultsCrmAccounts, resultsCrmContacts, resultsUser] = await withBatchTimeout([
      //Search in modul CRM (Opportunities)
      prismadb.opportunity.findMany({
        where: {
          OR: [
            { notes: { contains: search } },
            { principal: { contains: search } },
          ],
        },
        take: 50, // Limit results for performance
      }),

      //Search in modul CRM (Accounts/Organizations)
      prismadb.organization.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { notes: { contains: search } },
          ],
        },
        take: 50, // Limit results for performance
      }),

      //Search in modul CRM (Contacts)
      prismadb.contact.findMany({
        where: {
          OR: [
            { lastName: { contains: search } },
            { firstName: { contains: search } },
            { email: { contains: search } },
          ],
        },
        take: 50, // Limit results for performance
      }),

      //Search in local user database
      prismadb.user.findMany({
        where: {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
          ],
        },
        take: 50, // Limit results for performance
        }),
      ], QUERY_TIMEOUTS.FAST, 'fulltext-search-batch');

        // Tasks model not implemented - returning empty array
        const resultsTasks: any[] = [];
        
        // Boards model not implemented - returning empty array  
        const reslutsProjects: any[] = [];

        return {
          opportunities: resultsCrmOpportunities,
          accounts: resultsCrmAccounts,
          contacts: resultsCrmContacts,
          users: resultsUser,
          tasks: resultsTasks,
          projects: reslutsProjects,
        };
      }
    );

      return NextResponse.json({ data: searchResults }, { status: 200 });
    } catch (error) {
      console.error("[FULLTEXT_SEARCH_POST]", error);
      return NextResponse.json(
        { error: "Search operation failed" },
        { status: 500 }
      );
    }
  });
}




// Export with authentication, rate limiting, and error handling
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });