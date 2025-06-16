/**
 * Organizations Schema for Drizzle ORM
 * Core organization/company model with food service industry focus
 */

import { pgTable, varchar, text, real, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const organizations = pgTable('organizations', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Core organization information
  name: varchar('name', { length: 255 }).notNull(),
  priority: varchar('priority', { length: 1 }).notNull(), // A, B, C, D
  segment: varchar('segment', { length: 50 }).notNull(), // FINE_DINING, FAST_FOOD, etc.
  type: varchar('type', { length: 20 }).notNull().default('PROSPECT'), // PROSPECT, CUSTOMER, INACTIVE
  
  // Contact information
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  
  // Business information
  notes: text('notes'),
  estimatedRevenue: real('estimated_revenue'),
  employeeCount: integer('employee_count'),
  primaryContact: varchar('primary_contact', { length: 255 }),
  
  // CRM tracking
  lastContactDate: timestamp('last_contact_date'),
  nextFollowUpDate: timestamp('next_follow_up_date'),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE, LEAD
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes optimized for B1 PostgreSQL
  statusPriorityNameIdx: index('org_status_priority_name_idx').on(table.status, table.priority, table.name),
  nameIdx: index('org_name_idx').on(table.name),
  emailIdx: index('org_email_idx').on(table.email),
  priorityUpdatedAtIdx: index('org_priority_updated_at_idx').on(table.priority, table.updatedAt),
  segmentStatusIdx: index('org_segment_status_idx').on(table.segment, table.status),
  lastContactDateIdx: index('org_last_contact_date_idx').on(table.lastContactDate),
  nextFollowUpDateIdx: index('org_next_follow_up_date_idx').on(table.nextFollowUpDate),
  
  // Multi-column indexes for complex queries
  statusPrioritySegmentIdx: index('org_status_priority_segment_idx').on(table.status, table.priority, table.segment),
  lastContactNextFollowUpIdx: index('org_last_contact_next_follow_up_idx').on(table.lastContactDate, table.nextFollowUpDate),
  priorityRevenueIdx: index('org_priority_revenue_idx').on(table.priority, table.estimatedRevenue),
  segmentRevenueIdx: index('org_segment_revenue_idx').on(table.segment, table.estimatedRevenue),
  
  // Additional optimized indexes
  cityStatusIdx: index('org_city_status_idx').on(table.city, table.status),
  phoneIdx: index('org_phone_idx').on(table.phone),
  createdAtStatusIdx: index('org_created_at_status_idx').on(table.createdAt, table.status),
  zipCodeStateIdx: index('org_zip_code_state_idx').on(table.zipCode, table.state),
  typeStatusIdx: index('org_type_status_idx').on(table.type, table.status),
}));

// Type inference
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type UpdateOrganization = Partial<NewOrganization>;

// Organization priority enum for type safety
export const OrganizationPriorities = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D'
} as const;

export type OrganizationPriority = typeof OrganizationPriorities[keyof typeof OrganizationPriorities];

// Organization segments enum for food service industry
export const OrganizationSegments = {
  FINE_DINING: 'FINE_DINING',
  FAST_FOOD: 'FAST_FOOD',
  HEALTHCARE: 'HEALTHCARE',
  EDUCATION: 'EDUCATION',
  CORPORATE: 'CORPORATE',
  HOSPITALITY: 'HOSPITALITY',
  CASUAL_DINING: 'CASUAL_DINING',
  QUICK_SERVICE: 'QUICK_SERVICE',
  CATERING: 'CATERING',
  RETIREMENT: 'RETIREMENT'
} as const;

export type OrganizationSegment = typeof OrganizationSegments[keyof typeof OrganizationSegments];

// Organization types enum
export const OrganizationTypes = {
  PROSPECT: 'PROSPECT',
  CUSTOMER: 'CUSTOMER',
  INACTIVE: 'INACTIVE'
} as const;

export type OrganizationType = typeof OrganizationTypes[keyof typeof OrganizationTypes];

// Organization status enum
export const OrganizationStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LEAD: 'LEAD'
} as const;

export type OrganizationStatus = typeof OrganizationStatuses[keyof typeof OrganizationStatuses];