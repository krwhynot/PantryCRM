import { handleLegacyRoute } from '@/app/api/_utils/legacyRouteHandler';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  return handleLegacyRoute(request, {
    feature: 'Documents Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/principals',
    sunsetDate: '2025-07-15',
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  return handleLegacyRoute(request, {
    feature: 'Documents Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/principals',
    sunsetDate: '2025-07-15',
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  return handleLegacyRoute(request, {
    feature: 'Documents Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: '/api/principals',
    sunsetDate: '2025-07-15',
  });
}