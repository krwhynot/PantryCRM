import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';
import { batchDashboardAnalytics } from '@/lib/azure-sql-optimization';

/**
 * Optimized dashboard analytics endpoint
 * Uses query batching for Azure SQL Basic tier efficiency
 */
async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication using the standardized method
  const { user, error } = await requireAuth(req);
  if (error) return error;

    // Use batched queries for optimal DTU usage
    const analytics = await batchDashboardAnalytics();

  return NextResponse.json({
    ...analytics,
    timestamp: new Date().toISOString(),
  });
}

// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 50, windowMs: 60000 });