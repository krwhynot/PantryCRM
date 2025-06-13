import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchSearchQueries } from '@/lib/azure-sql-optimization';
import { processSearchInput } from '@/lib/input-sanitization';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * Unified search endpoint with query batching
 * Optimized for Azure SQL Basic tier performance
 */
async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Secure input processing
    const { query, isValid } = processSearchInput(rawQuery);
    
    if (!isValid) {
      return NextResponse.json({
        organizations: [],
        contacts: [],
        interactions: [],
        message: 'Query too short (minimum 2 characters)',
      });
    }

    // Use batched search for optimal performance
    const results = await batchSearchQueries(query, Math.min(limit, 50));

    return NextResponse.json({
      ...results,
      query,
      totalResults: results.organizations.length + results.contacts.length + results.interactions.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });