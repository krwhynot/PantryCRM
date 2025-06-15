/**
 * TypeScript Strict Mode Migration Strategy
 * 
 * This file contains the migration plan and utilities for enabling strict mode
 * across the Kitchen Pantry CRM codebase. Built for Azure B1 constraints.
 */

export interface StrictModeConfig {
  readonly enabledFeatures: readonly string[];
  readonly strictNullChecks: boolean;
  readonly noImplicitAny: boolean;
  readonly noImplicitReturns: boolean;
  readonly noImplicitThis: boolean;
}

export const MIGRATION_PHASES = {
  PHASE_1: 'API_CONSISTENCY', // Fix API response format consistency
  PHASE_2: 'TYPE_IMPORTS',    // Fix type vs value import issues  
  PHASE_3: 'VALIDATION',      // Standardize request validation
  PHASE_4: 'PRISMA_ACCESS',   // Fix Prisma model access patterns
  PHASE_5: 'STRICT_ENABLE'    // Enable strict mode flags
} as const;

export type MigrationPhase = typeof MIGRATION_PHASES[keyof typeof MIGRATION_PHASES];

/**
 * Azure B1 Optimized Strict Mode Configuration
 * Balances type safety with performance constraints
 */
export const AZURE_B1_STRICT_CONFIG: StrictModeConfig = {
  enabledFeatures: [
    'strictNullChecks',
    'noImplicitAny', 
    'noImplicitReturns',
    'exactOptionalPropertyTypes'
  ],
  strictNullChecks: true,
  noImplicitAny: true,
  noImplicitReturns: true,
  noImplicitThis: true
};

/**
 * Critical Error Categories from TypeScript Analysis
 */
export const ERROR_CATEGORIES = {
  API_RESPONSE_FORMAT: 'Missing APIResponse<T> wrapper in route responses',
  TYPE_VALUE_MISMATCH: 'ErrorCode imported as type but used as value',
  VALIDATION_PARSING: 'Inconsistent request parsing patterns',
  PRISMA_MODEL_ACCESS: 'Wrong method names on OptimizedPrismaClient',
  NULL_UNDEFINED: 'Missing null/undefined checks in strict mode'
} as const;

/**
 * Migration Utilities for Windsurf Cascade
 */
export class StrictModeMigrationHelper {
  /**
   * Pattern for API Response Wrapper
   */
  static getAPIResponsePattern() {
    return {
      before: 'return NextResponse.json({ data: result });',
      after: 'return createSuccessResponse(result);',
      imports: `import { createSuccessResponse, createErrorResponse } from '@/lib/types/api-helpers';`
    };
  }

  /**
   * Pattern for Error Code Import Fix
   */
  static getErrorCodeImportPattern() {
    return {
      before: `import type { ErrorCode } from '@/types/api';`,
      after: `import { ErrorCode } from '@/types/api';`,
      usage: 'ErrorCode can now be used as both type and value'
    };
  }

  /**
   * Pattern for Request Validation
   */
  static getValidationPattern() {
    return {
      before: `const body = await req.json();`,
      after: `const { success, data, error } = await parseRequestBody(req, validateSchema);
if (!success) return handleValidationError(error.details.errors);`,
      imports: `import { parseRequestBody, handleValidationError } from '@/lib/types/api-helpers';`
    };
  }

  /**
   * Pattern for Prisma Client Access
   */
  static getPrismaAccessPattern() {
    return {
      before: `const result = await prisma.organization.create(data);`,
      after: `const result = await prisma.createOrganization(data);`,
      note: 'OptimizedPrismaClient uses method-based access for performance'
    };
  }
}

/**
 * File Priority Matrix for Migration
 * High priority files that block other development
 */
export const MIGRATION_PRIORITY = {
  CRITICAL: [
    'lib/types/api-helpers.ts',          // Core API utilities - fixes cascade
    'app/api/crm/account/route.ts',      // Main organization API
    'app/api/crm/contacts/route.ts',     // Contact management API
    'app/api/contacts/by-organization/[orgId]/route.ts' // Relational queries
  ],
  HIGH: [
    'app/api/crm/leads/route.ts',        // Already partially fixed
    'app/api/crm/opportunity/route.ts',  // Pipeline management
    'src/app/api/organizations/route.ts' // Legacy organization route
  ],
  MEDIUM: [
    'lib/security.ts',                   // Security middleware
    'lib/performance/optimized-prisma.ts' // Database layer
  ]
} as const;

/**
 * Performance Impact Assessment for Azure B1
 */
export const PERFORMANCE_IMPACT = {
  COMPILATION_TIME: 'Strict mode adds ~15% to TypeScript compilation',
  RUNTIME_OVERHEAD: 'Minimal - type checking is compile-time only', 
  MEMORY_USAGE: 'Slightly higher due to more detailed type information',
  BUNDLE_SIZE: 'No impact - types are stripped in production'
} as const;

export default StrictModeMigrationHelper;