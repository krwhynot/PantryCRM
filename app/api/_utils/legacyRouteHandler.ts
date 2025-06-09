import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface LegacyRouteOptions {
  feature: string;
  deprecatedSince: string;
  alternativeEndpoint?: string;
  sunsetDate?: string;
}

export async function handleLegacyRoute(
  request: NextRequest,
  options: LegacyRouteOptions
) {
  // Preserve auth checks
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Log usage for monitoring
  console.warn(`Legacy endpoint accessed: ${options.feature}`, {
    user: session.user?.email,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
  });

  // Return informative 501 response
  return NextResponse.json(    {
      error: 'Not Implemented',
      message: `The ${options.feature} feature is not available in this version`,
      deprecatedSince: options.deprecatedSince,
      alternativeEndpoint: options.alternativeEndpoint,
      sunsetDate: options.sunsetDate,
      documentation: '/api/docs/migration-guide',
    },
    { 
      status: 501,
      headers: {
        'Sunset': options.sunsetDate || '',
        'Deprecation': 'true',
      }
    }
  );
}
