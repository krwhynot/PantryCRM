/**
 * Kitchen Pantry CRM - Comprehensive Type System
 * 
 * This file provides type-safe interfaces for all CRM operations,
 * designed specifically for strict TypeScript mode and Azure B1 optimization.
 * 
 * Architecture Notes:
 * - All types derived from Prisma schema for consistency
 * - API response types include error handling
 * - Performance-optimized query types for Azure SQL Basic (5 DTU)
 * - Food service industry specific enums and constraints
 */

import type { 
  Organization, 
  Contact, 
  Interaction, 
  Opportunity, 
  Lead, 
  Contract,
  User 
} from '@prisma/client';

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

export const ORGANIZATION_PRIORITIES = ['A', 'B', 'C', 'D'] as const;
export const ORGANIZATION_SEGMENTS = [
  'FINE_DINING',
  'FAST_FOOD', 
  'CASUAL_DINING',
  'CATERING',
  'INSTITUTIONAL',
  'HEALTHCARE',
  'EDUCATION',
  'CORPORATE'
] as const;

export const ORGANIZATION_TYPES = ['PROSPECT', 'CUSTOMER', 'INACTIVE'] as const;
export const ORGANIZATION_STATUSES = ['ACTIVE', 'INACTIVE', 'LEAD'] as const;

export const INTERACTION_TYPES = [
  'EMAIL',
  'CALL', 
  'IN_PERSON',
  'DEMO_SAMPLED',
  'QUOTED_PRICE',
  'FOLLOW_UP'
] as const;

export const INTERACTION_OUTCOMES = [
  'POSITIVE',
  'NEUTRAL', 
  'NEGATIVE',
  'FOLLOW_UP_NEEDED'
] as const;

export const OPPORTUNITY_STAGES = [
  'LEAD_DISCOVERY',
  'CONTACTED',
  'SAMPLED_VISITED', 
  'FOLLOW_UP',
  'CLOSE'
] as const;

export const OPPORTUNITY_STATUSES = [
  'OPEN',
  'CLOSED_WON',
  'CLOSED_LOST',
  'ON_HOLD'
] as const;

export const FOOD_SERVICE_PRINCIPALS = [
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
] as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type OrganizationPriority = typeof ORGANIZATION_PRIORITIES[number];
export type OrganizationSegment = typeof ORGANIZATION_SEGMENTS[number];
export type OrganizationType = typeof ORGANIZATION_TYPES[number];
export type OrganizationStatus = typeof ORGANIZATION_STATUSES[number];
export type InteractionType = typeof INTERACTION_TYPES[number];
export type InteractionOutcome = typeof INTERACTION_OUTCOMES[number];
export type OpportunityStage = typeof OPPORTUNITY_STAGES[number];
export type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number];
export type FoodServicePrincipal = typeof FOOD_SERVICE_PRINCIPALS[number];

// =============================================================================
// ENHANCED MODEL TYPES WITH RELATIONS
// =============================================================================

/**
 * Organization with computed fields and relations for API responses
 */
export interface OrganizationWithDetails extends Organization {
  contacts: ContactSummary[];
  interactions: InteractionSummary[];
  opportunities: OpportunitySummary[];
  leads: LeadSummary[];
  contracts: ContractSummary[];
  
  // Computed fields for performance
  totalContacts: number;
  lastInteractionDate: Date | null;
  nextFollowUpDate: Date | null;
  totalOpportunityValue: number;
  primaryContactName: string | null;
}

/**
 * Lightweight organization summary for lists and dropdowns
 */
export interface OrganizationSummary {
  id: string;
  name: string;
  priority: string;
  segment: string;
  type: string;
  status: string;
  primaryContactName: string | null;
  lastContactDate: Date | null;
  estimatedRevenue: number | null;
}

/**
 * Contact with organization details
 */
export interface ContactWithDetails extends Contact {
  organization: OrganizationSummary;
  interactions: InteractionSummary[];
  opportunities: OpportunitySummary[];
  contracts: ContractSummary[];
}

/**
 * Contact summary for organization lists
 */
export interface ContactSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  isPrimary: boolean;
}

/**
 * Interaction with related entity details
 */
export interface InteractionWithDetails extends Interaction {
  organization: OrganizationSummary;
  contact: ContactSummary | null;
}

/**
 * Interaction summary for lists
 */
export interface InteractionSummary {
  id: string;
  type: string;
  subject: string;
  date: Date;
  outcome: string | null;
  duration: number | null;
}

/**
 * Opportunity with full context
 */
export interface OpportunityWithDetails extends Opportunity {
  organization: OrganizationSummary;
  contact: ContactSummary | null;
}

/**
 * Opportunity summary for pipeline views
 */
export interface OpportunitySummary {
  id: string;
  name: string;
  value: number | null;
  stage: string;
  probability: number;
  expectedCloseDate: Date | null;
  isActive: boolean;
}

/**
 * Lead summary
 */
export interface LeadSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  status: string;
  source: string | null;
}

/**
 * Contract summary
 */
export interface ContractSummary {
  id: string;
  name: string;
  value: number | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper with error handling
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

/**
 * Organization creation request
 */
export interface CreateOrganizationRequest {
  name: string;
  priority: OrganizationPriority;
  segment: OrganizationSegment;
  type?: OrganizationType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  estimatedRevenue?: number;
  employeeCount?: number;
  primaryContact?: string;
  nextFollowUpDate?: Date;
}

/**
 * Organization update request (partial)
 */
export interface UpdateOrganizationRequest extends Partial<CreateOrganizationRequest> {
  id: string;
}

/**
 * Contact creation request
 */
export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
  notes?: string;
  organizationId: string;
}

/**
 * Contact update request
 */
export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  id: string;
}

/**
 * Interaction creation request
 */
export interface CreateInteractionRequest {
  type: InteractionType;
  subject: string;
  description?: string;
  date: Date;
  duration?: number;
  outcome?: InteractionOutcome;
  nextAction?: string;
  organizationId: string;
  contactId?: string;
}

/**
 * Opportunity creation request
 */
export interface CreateOpportunityRequest {
  name: string;
  organizationId: string;
  contactId?: string;
  value?: number;
  stage: OpportunityStage;
  probability?: number;
  expectedCloseDate?: Date;
  notes?: string;
  principal?: FoodServicePrincipal;
}

// =============================================================================
// SEARCH AND FILTER TYPES
// =============================================================================

/**
 * Organization search/filter parameters
 */
export interface OrganizationFilters {
  search?: string;
  priority?: OrganizationPriority[];
  segment?: OrganizationSegment[];
  type?: OrganizationType[];
  status?: OrganizationStatus[];
  city?: string;
  state?: string;
  hasContacts?: boolean;
  hasOpportunities?: boolean;
  lastContactedAfter?: Date;
  lastContactedBefore?: Date;
  estimatedRevenueMin?: number;
  estimatedRevenueMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'priority' | 'lastContactDate' | 'estimatedRevenue' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Quick search result for autocomplete
 */
export interface QuickSearchResult {
  type: 'organization' | 'contact' | 'opportunity';
  id: string;
  label: string;
  subtitle?: string;
  priority?: string;
}

// =============================================================================
// REPORTING AND ANALYTICS TYPES
// =============================================================================

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  organizations: {
    total: number;
    byPriority: Record<OrganizationPriority, number>;
    bySegment: Record<OrganizationSegment, number>;
    byStatus: Record<OrganizationStatus, number>;
    recentlyAdded: number;
    needingFollowUp: number;
  };
  interactions: {
    total: number;
    thisWeek: number;
    byType: Record<InteractionType, number>;
    byOutcome: Record<InteractionOutcome, number>;
  };
  opportunities: {
    total: number;
    totalValue: number;
    byStage: Record<OpportunityStage, number>;
    averageProbability: number;
    closingThisMonth: number;
  };
  performance: {
    averageResponseTime: number;
    topPerformingSegments: Array<{
      segment: OrganizationSegment;
      conversionRate: number;
      averageValue: number;
    }>;
  };
}

/**
 * Chart data point for Tremor charts
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
  color?: string;
}

/**
 * Report configuration
 */
export interface ReportConfig {
  type: 'weekly_activity' | 'pipeline_status' | 'organization_performance' | 'interaction_summary';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    organizationIds?: string[];
    contactIds?: string[];
    segments?: OrganizationSegment[];
    priorities?: OrganizationPriority[];
  };
  groupBy?: 'day' | 'week' | 'month' | 'segment' | 'priority' | 'stage';
  includeCharts?: boolean;
}

// =============================================================================
// FORM VALIDATION TYPES
// =============================================================================

/**
 * Field validation result
 */
export interface FieldValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Form validation result
 */
export interface FormValidation {
  isValid: boolean;
  fields: Record<string, FieldValidation>;
  globalErrors?: string[];
}

// =============================================================================
// PAGINATION AND SORTING
// =============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Application error codes
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Typed application error
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard for organization priority
 */
export function isOrganizationPriority(value: string): value is OrganizationPriority {
  return ORGANIZATION_PRIORITIES.includes(value as OrganizationPriority);
}

/**
 * Type guard for organization segment
 */
export function isOrganizationSegment(value: string): value is OrganizationSegment {
  return ORGANIZATION_SEGMENTS.includes(value as OrganizationSegment);
}

/**
 * Type guard for interaction type
 */
export function isInteractionType(value: string): value is InteractionType {
  return INTERACTION_TYPES.includes(value as InteractionType);
}

/**
 * Type guard for opportunity stage
 */
export function isOpportunityStage(value: string): value is OpportunityStage {
  return OPPORTUNITY_STAGES.includes(value as OpportunityStage);
}

/**
 * Type guard for API response
 */
export function isAPIResponse<T>(obj: unknown): obj is APIResponse<T> {
  return typeof obj === 'object' && 
         obj !== null && 
         'success' in obj && 
         typeof (obj as any).success === 'boolean';
}

/**
 * Type guard for app error
 */
export function isAppError(obj: unknown): obj is AppError {
  return typeof obj === 'object' && 
         obj !== null && 
         'code' in obj && 
         'message' in obj;
}