import { NextResponse } from 'next/server';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleGET(): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth();
  if (error) return error;
  const migrationGuide = {
    title: 'Kitchen Pantry CRM API Migration Guide',
    version: '2.0',
    lastUpdated: '2025-01-15',
    overview: 'This guide covers the migration from NextCRM base features to Kitchen Pantry CRM specialized features.',
    
    deprecatedEndpoints: [
      {
        endpoint: '/api/tasks',
        status: 'Deprecated',
        deprecatedSince: '2025-01-15',
        sunsetDate: '2025-07-15',
        alternative: '/api/interactions',
        reason: 'Tasks replaced with food service specific interaction tracking',
      },
      {
        endpoint: '/api/boards',
        status: 'Deprecated',
        deprecatedSince: '2025-01-15',
        sunsetDate: '2025-07-15',
        alternative: '/api/pipeline',
        reason: 'Kanban boards replaced with sales pipeline visualization',
      },
      {
        endpoint: '/api/sections',
        status: 'Deprecated',
        deprecatedSince: '2025-01-15',
        sunsetDate: '2025-07-15',
        alternative: null,
        reason: 'Not applicable to food service CRM workflow',
      },
      {
        endpoint: '/api/documents',
        status: 'Deprecated',
        deprecatedSince: '2025-01-15',
        sunsetDate: '2025-07-15',
        alternative: '/api/principals',
        reason: 'Documents replaced with principal/brand management',
      },
    ],
    
    newEndpoints: [
      {
        endpoint: '/api/organizations',
        description: 'Restaurant and food service business management',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        endpoint: '/api/contacts',
        description: 'Contact management for chefs, buyers, and managers',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        endpoint: '/api/interactions',
        description: '30-second interaction logging',
        methods: ['GET', 'POST'],
      },
      {
        endpoint: '/api/pipeline',
        description: '5-stage sales pipeline tracking',
        methods: ['GET', 'PUT'],
      },
    ],
    
    migrationSteps: [
      'Update all frontend code to use new endpoints',
      'Test thoroughly with new API structure',
      'Monitor legacy endpoint usage via logs',
      'Plan data migration if needed',
      'Remove legacy endpoint calls before sunset date',
    ],
  };

  return NextResponse.json(migrationGuide, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}


// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });