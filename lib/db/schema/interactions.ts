/**
 * Interactions Schema for Drizzle ORM
 * Track all customer interactions and communications
 */

import { pgTable, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { contacts } from './contacts';

export const interactions = pgTable('interactions', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Interaction details
  type: varchar('type', { length: 50 }).notNull(), // CALL, EMAIL, MEETING, VISIT, etc.
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  duration: integer('duration'), // in minutes
  outcome: varchar('outcome', { length: 50 }), // POSITIVE, NEUTRAL, NEGATIVE, FOLLOW_UP_NEEDED
  nextAction: text('next_action'),
  
  // Foreign keys
  organizationId: varchar('organization_id', { length: 36 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contactId: varchar('contact_id', { length: 36 }).references(() => contacts.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes optimized for B1 PostgreSQL
  organizationDateIdx: index('interaction_org_date_idx').on(table.organizationId, table.date),
  contactDateIdx: index('interaction_contact_date_idx').on(table.contactId, table.date),
  typeDateIdx: index('interaction_type_date_idx').on(table.type, table.date),
  dateIdx: index('interaction_date_idx').on(table.date),
  nextActionIdx: index('interaction_next_action_idx').on(table.nextAction),
  outcomeIdx: index('interaction_outcome_idx').on(table.outcome, table.date),
  
  // Multi-column indexes for analytics
  typeOutcomeDateIdx: index('interaction_type_outcome_date_idx').on(table.type, table.outcome, table.date),
  organizationTypeDateIdx: index('interaction_org_type_date_idx').on(table.organizationId, table.type, table.date),
  outcomeNextActionIdx: index('interaction_outcome_next_action_idx').on(table.outcome, table.nextAction),
  
  // Enhanced performance indexes
  organizationOutcomeDateIdx: index('interaction_org_outcome_date_idx').on(table.organizationId, table.outcome, table.date),
  typeOrganizationIdx: index('interaction_type_org_idx').on(table.type, table.organizationId),
  durationDateIdx: index('interaction_duration_date_idx').on(table.duration, table.date),
  subjectIdx: index('interaction_subject_idx').on(table.subject),
}));

// Type inference
export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
export type UpdateInteraction = Partial<NewInteraction>;

// Interaction types enum for food service industry
export const InteractionTypes = {
  EMAIL: 'EMAIL',
  PHONE_CALL: 'PHONE_CALL',
  IN_PERSON: 'IN_PERSON',
  VIDEO_CALL: 'VIDEO_CALL',
  DEMO: 'DEMO',
  TRADE_SHOW: 'TRADE_SHOW',
  FOLLOW_UP: 'FOLLOW_UP',
  PRESENTATION: 'PRESENTATION',
  TASTING: 'TASTING',
  SITE_VISIT: 'SITE_VISIT',
  TRAINING: 'TRAINING',
  SUPPORT: 'SUPPORT'
} as const;

export type InteractionType = typeof InteractionTypes[keyof typeof InteractionTypes];

// Interaction outcomes enum
export const InteractionOutcomes = {
  POSITIVE: 'POSITIVE',
  NEUTRAL: 'NEUTRAL',
  NEGATIVE: 'NEGATIVE',
  FOLLOW_UP_NEEDED: 'FOLLOW_UP_NEEDED',
  PROPOSAL_REQUESTED: 'PROPOSAL_REQUESTED',
  DEMO_SCHEDULED: 'DEMO_SCHEDULED',
  ORDER_PLACED: 'ORDER_PLACED',
  NO_INTEREST: 'NO_INTEREST',
  DECISION_PENDING: 'DECISION_PENDING'
} as const;

export type InteractionOutcome = typeof InteractionOutcomes[keyof typeof InteractionOutcomes];