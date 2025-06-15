/**
 * Runtime Type Validation Utilities
 * 
 * Provides runtime validation for TypeScript types to ensure type safety
 * at API boundaries and user input points. Essential for strict mode.
 */

import { z } from 'zod';
import type {
  OrganizationPriority,
  OrganizationSegment,
  OrganizationType,
  OrganizationStatus,
  InteractionType,
  InteractionOutcome,
  OpportunityStage,
  OpportunityStatus,
  FoodServicePrincipal,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateContactRequest,
  CreateInteractionRequest,
  CreateOpportunityRequest,
  OrganizationFilters
} from '@/types/crm';

// =============================================================================
// ZOD SCHEMAS FOR RUNTIME VALIDATION
// =============================================================================

/**
 * Organization priority validation
 */
export const organizationPrioritySchema = z.enum(['A', 'B', 'C', 'D']);

/**
 * Organization segment validation
 */
export const organizationSegmentSchema = z.enum([
  'FINE_DINING',
  'FAST_FOOD',
  'CASUAL_DINING',
  'CATERING',
  'INSTITUTIONAL',
  'HEALTHCARE',
  'EDUCATION',
  'CORPORATE'
]);

/**
 * Organization type validation
 */
export const organizationTypeSchema = z.enum(['PROSPECT', 'CUSTOMER', 'INACTIVE']);

/**
 * Organization status validation
 */
export const organizationStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'LEAD']);

/**
 * Interaction type validation
 */
export const interactionTypeSchema = z.enum([
  'EMAIL',
  'CALL',
  'IN_PERSON',
  'DEMO_SAMPLED',
  'QUOTED_PRICE',
  'FOLLOW_UP'
]);

/**
 * Interaction outcome validation
 */
export const interactionOutcomeSchema = z.enum([
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
  'FOLLOW_UP_NEEDED'
]);

/**
 * Opportunity stage validation
 */
export const opportunityStageSchema = z.enum([
  'LEAD_DISCOVERY',
  'CONTACTED',
  'SAMPLED_VISITED',
  'FOLLOW_UP',
  'CLOSE'
]);

/**
 * Food service principal validation
 */
export const foodServicePrincipalSchema = z.enum([
  'KAUFHOLDS',
  'FRITES_STREET',
  'BETTER_BALANCE',
  'VAF',
  'OFK',
  'ANNASEA',
  'WICKS',
  'RJC',
  'KAYCO',
  'ABDALE',
  'LAND_LOVERS'
]);

// =============================================================================
// REQUEST VALIDATION SCHEMAS
// =============================================================================

/**
 * Create organization request validation
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  priority: organizationPrioritySchema,
  segment: organizationSegmentSchema,
  type: organizationTypeSchema.optional().default('PROSPECT'),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  estimatedRevenue: z.number().min(0).optional(),
  employeeCount: z.number().int().min(1).optional(),
  primaryContact: z.string().max(255).optional(),
  nextFollowUpDate: z.string().datetime().optional().or(z.date().optional())
});

/**
 * Update organization request validation
 */
export const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  id: z.string().cuid('Invalid organization ID')
});

/**
 * Create contact request validation
 */
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional(),
  organizationId: z.string().cuid('Invalid organization ID')
});

/**
 * Update contact request validation
 */
export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().cuid('Invalid contact ID')
});

/**
 * Create interaction request validation
 */
export const createInteractionSchema = z.object({
  type: interactionTypeSchema,
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.date()),
  duration: z.number().int().min(1).max(1440).optional(), // Max 24 hours
  outcome: interactionOutcomeSchema.optional(),
  nextAction: z.string().max(500).optional(),
  organizationId: z.string().cuid('Invalid organization ID'),
  contactId: z.string().cuid('Invalid contact ID').optional()
});

/**
 * Create opportunity request validation
 */
export const createOpportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required').max(255),
  organizationId: z.string().cuid('Invalid organization ID'),
  contactId: z.string().cuid('Invalid contact ID').optional(),
  value: z.number().min(0).optional(),
  stage: opportunityStageSchema,
  probability: z.number().int().min(0).max(100).optional().default(50),
  expectedCloseDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().max(2000).optional(),
  principal: foodServicePrincipalSchema.optional()
});

/**
 * Organization filters validation
 */
export const organizationFiltersSchema = z.object({
  search: z.string().max(255).optional(),
  priority: z.array(organizationPrioritySchema).optional(),
  segment: z.array(organizationSegmentSchema).optional(),
  type: z.array(organizationTypeSchema).optional(),
  status: z.array(organizationStatusSchema).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  hasContacts: z.boolean().optional(),
  hasOpportunities: z.boolean().optional(),
  lastContactedAfter: z.string().datetime().optional().or(z.date().optional()),
  lastContactedBefore: z.string().datetime().optional().or(z.date().optional()),
  estimatedRevenueMin: z.number().min(0).optional(),
  estimatedRevenueMax: z.number().min(0).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'priority', 'lastContactDate', 'estimatedRevenue', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate create organization request
 */
export function validateCreateOrganization(data: unknown): ValidationResult<CreateOrganizationRequest> {
  try {
    const validated = createOrganizationSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validate update organization request
 */
export function validateUpdateOrganization(data: unknown): ValidationResult<UpdateOrganizationRequest> {
  try {
    const validated = updateOrganizationSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validate create contact request
 */
export function validateCreateContact(data: unknown): ValidationResult<CreateContactRequest> {
  try {
    const validated = createContactSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validate create interaction request
 */
export function validateCreateInteraction(data: unknown): ValidationResult<CreateInteractionRequest> {
  try {
    const validated = createInteractionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validate create opportunity request
 */
export function validateCreateOpportunity(data: unknown): ValidationResult<CreateOpportunityRequest> {
  try {
    const validated = createOpportunitySchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

/**
 * Validate organization filters
 */
export function validateOrganizationFilters(data: unknown): ValidationResult<OrganizationFilters> {
  try {
    const validated = organizationFiltersSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safe JSON parse with type validation
 */
export function safeJsonParse<T>(
  json: string,
  validator: (data: unknown) => ValidationResult<T>
): ValidationResult<T> {
  try {
    const parsed = JSON.parse(json);
    return validator(parsed);
  } catch {
    return {
      success: false,
      errors: [{ field: 'json', message: 'Invalid JSON format' }]
    };
  }
}

/**
 * Transform Zod errors to application error format
 */
export function transformZodErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}

/**
 * Type-safe environment variable validation
 */
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  AZURE_SQL_CONNECTION_STRING: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
});

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:', error.errors);
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}