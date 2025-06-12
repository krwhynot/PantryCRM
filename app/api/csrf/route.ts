/**
 * CSRF Token Initialization Endpoint
 * Provides CSRF tokens for client-side form protection
 */

import { NextRequest } from 'next/server';
import { initializeCSRFToken } from '@/lib/csrf-protection';
import { withEnhancedRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/enhanced-rate-limiter';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleGET(req: NextRequest) {
  // Return a new CSRF token with secure cookie
  return initializeCSRFToken();
}

// Export with rate limiting to prevent abuse
export const GET = withEnhancedRateLimit(
  withErrorHandler(handleGET),
  RATE_LIMIT_CONFIGS.public
);