import { handleLegacyRoute } from '@/app/api/_utils/legacyRouteHandler';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  return handleLegacyRoute(request, {
    feature: 'Sections Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: null,
    sunsetDate: '2025-07-15',
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  return handleLegacyRoute(request, {
    feature: 'Sections Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: null,
    sunsetDate: '2025-07-15',
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  return handleLegacyRoute(request, {
    feature: 'Sections Management',
    deprecatedSince: '2025-01-15',
    alternativeEndpoint: null,
    sunsetDate: '2025-07-15',
  });
}
