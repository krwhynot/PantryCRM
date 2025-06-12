import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchDashboardAnalytics } from '@/lib/azure-sql-optimization';

/**
 * Optimized dashboard analytics endpoint
 * Uses query batching for Azure SQL Basic tier efficiency
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use batched queries for optimal DTU usage
    const analytics = await batchDashboardAnalytics();

    return NextResponse.json({
      ...analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard analytics' },
      { status: 500 }
    );
  }
}