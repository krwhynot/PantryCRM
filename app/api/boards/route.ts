import { handleLegacyRoute } from '@/app/api/_utils/legacyRouteHandler';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return handleLegacyRoute(request, {
    feature: 'Boards Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/pipeline',
    sunsetDate: '2025-07-15',
  });
}

export async function POST(request: NextRequest) {
  return handleLegacyRoute(request, {
    feature: 'Boards Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/pipeline',
    sunsetDate: '2025-07-15',
  });
}

export async function PUT(request: NextRequest) {
  return handleLegacyRoute(request, {
    feature: 'Boards Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/pipeline',
    sunsetDate: '2025-07-15',
  });
}

export async function DELETE(request: NextRequest) {
  return handleLegacyRoute(request, {
    feature: 'Boards Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/pipeline',
    sunsetDate: '2025-07-15',
  });
}
