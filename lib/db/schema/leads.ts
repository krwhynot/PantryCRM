/**
 * Leads Schema for Drizzle ORM
 * Lead generation and qualification tracking
 */

import { pgTable, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const leads = pgTable('leads', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Lead information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  company: varchar('company', { length: 255 }),
  source: varchar('source', { length: 100 }), // Website, referral, cold call, etc.
  status: varchar('status', { length: 50 }).notNull().default('NEW'), // NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
  notes: text('notes'),
  
  // Foreign keys
  organizationId: varchar('organization_id', { length: 36 }).references(() => organizations.id, { onDelete: 'set null' }),
  assignedToId: varchar('assigned_to_id', { length: 36 }),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes optimized for B1 PostgreSQL
  statusCreatedAtIdx: index('lead_status_created_at_idx').on(table.status, table.createdAt),
  organizationIdx: index('lead_organization_idx').on(table.organizationId),
  assignedToIdx: index('lead_assigned_to_idx').on(table.assignedToId),
  emailIdx: index('lead_email_idx').on(table.email),
  sourceStatusIdx: index('lead_source_status_idx').on(table.source, table.status),
  companyIdx: index('lead_company_idx').on(table.company),
  phoneIdx: index('lead_phone_idx').on(table.phone),
  statusUpdatedAtIdx: index('lead_status_updated_at_idx').on(table.status, table.updatedAt),
}));

// Type inference
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type UpdateLead = Partial<NewLead>;

// Lead statuses enum
export const LeadStatuses = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST'
} as const;

export type LeadStatus = typeof LeadStatuses[keyof typeof LeadStatuses];

// Lead sources enum for food service industry
export const LeadSources = {
  WEBSITE: 'WEBSITE',
  REFERRAL: 'REFERRAL',
  COLD_CALL: 'COLD_CALL',
  EMAIL_CAMPAIGN: 'EMAIL_CAMPAIGN',
  TRADE_SHOW: 'TRADE_SHOW',
  SOCIAL_MEDIA: 'SOCIAL_MEDIA',
  ADVERTISING: 'ADVERTISING',
  PARTNER: 'PARTNER',
  INBOUND_CALL: 'INBOUND_CALL',
  EXISTING_CUSTOMER: 'EXISTING_CUSTOMER',
  LINKEDIN: 'LINKEDIN',
  GOOGLE_ADS: 'GOOGLE_ADS'
} as const;

export type LeadSource = typeof LeadSources[keyof typeof LeadSources];

// Helper function to get status display information
export const getLeadStatusInfo = (status: LeadStatus) => {
  const statusMap = {
    [LeadStatuses.NEW]: { label: 'New', color: '#94a3b8', priority: 'high' },
    [LeadStatuses.CONTACTED]: { label: 'Contacted', color: '#60a5fa', priority: 'medium' },
    [LeadStatuses.QUALIFIED]: { label: 'Qualified', color: '#fbbf24', priority: 'high' },
    [LeadStatuses.CONVERTED]: { label: 'Converted', color: '#10b981', priority: 'low' },
    [LeadStatuses.LOST]: { label: 'Lost', color: '#ef4444', priority: 'low' }
  };
  
  return statusMap[status];
};