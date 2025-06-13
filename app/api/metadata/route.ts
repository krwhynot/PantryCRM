import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { StaticDataCache } from '@/lib/cache';
import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

/**
 * GET handler for cached metadata used in dropdowns and filters
 * Optimized for Azure SQL Basic tier performance
 */
async function handleGET(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'interaction-types':
        return NextResponse.json({
          data: StaticDataCache.getCachedInteractionTypes(),
          cached: true
        });

      case 'pipeline-stages':
        return NextResponse.json({
          data: StaticDataCache.getCachedPipelineStages(),
          cached: true
        });

      case 'organization-metadata':
        const orgMetadata = await StaticDataCache.getCachedOrganizationMetadata(prismadb);
        return NextResponse.json({
          data: orgMetadata,
          cached: true
        });

      case 'contact-positions':
        const positions = await StaticDataCache.getCachedContactPositions(prismadb);
        return NextResponse.json({
          data: positions,
          cached: true
        });

      case 'system-settings':
        const settings = await StaticDataCache.getCachedSettings(prismadb);
        return NextResponse.json({
          data: settings,
          cached: true
        });

      case 'all':
        // Return all metadata in a single request to minimize DTU usage
        const [
          interactionTypes,
          pipelineStages,
          organizationMetadata,
          contactPositions,
          systemSettings
        ] = await Promise.all([
          Promise.resolve(StaticDataCache.getCachedInteractionTypes()),
          Promise.resolve(StaticDataCache.getCachedPipelineStages()),
          StaticDataCache.getCachedOrganizationMetadata(prismadb),
          StaticDataCache.getCachedContactPositions(prismadb),
          StaticDataCache.getCachedSettings(prismadb)
        ]);

        return NextResponse.json({
          data: {
            interactionTypes,
            pipelineStages,
            organizationMetadata,
            contactPositions,
            systemSettings
          },
          cached: true,
          optimized: 'Azure SQL Basic tier'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid metadata type. Valid types: interaction-types, pipeline-stages, organization-metadata, contact-positions, system-settings, all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for cache invalidation (admin use)
 */
async function handlePOST(req: NextRequest): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { action, type } = body;

    if (action !== 'invalidate') {
      return NextResponse.json(
        { error: 'Only "invalidate" action is supported' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'organization-metadata':
        StaticDataCache.invalidateOrganizationMetadata();
        break;
      case 'contact-metadata':
        StaticDataCache.invalidateContactMetadata();
        break;
      case 'settings':
        StaticDataCache.invalidateSettings();
        break;
      case 'static-data':
        StaticDataCache.invalidateStaticData();
        break;
      case 'all':
        StaticDataCache.invalidateOrganizationMetadata();
        StaticDataCache.invalidateContactMetadata();
        StaticDataCache.invalidateSettings();
        StaticDataCache.invalidateStaticData();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid invalidation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for type: ${type}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}

// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 200, windowMs: 60000 });
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 10, windowMs: 60000 });