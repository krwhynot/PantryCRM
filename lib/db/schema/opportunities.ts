/**
 * Opportunities Schema for Drizzle ORM
 * Sales opportunities and pipeline management
 */

import { pgTable, varchar, text, real, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { contacts } from './contacts';

export const opportunities = pgTable('opportunities', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Opportunity details
  name: varchar('name', { length: 255 }).notNull(),
  value: real('value'),
  stage: varchar('stage', { length: 50 }).notNull().default('PROSPECT'), // PROSPECT, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
  probability: integer('probability').notNull().default(50), // 0-100%
  expectedCloseDate: timestamp('expected_close_date'),
  notes: text('notes'),
  reason: text('reason'), // For closed opportunities
  isActive: boolean('is_active').notNull().default(true),
  
  // Foreign keys
  organizationId: varchar('organization_id', { length: 36 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contactId: varchar('contact_id', { length: 36 }).references(() => contacts.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes optimized for B1 PostgreSQL
  organizationStageIdx: index('opportunity_org_stage_idx').on(table.organizationId, table.stage),
  stageCloseDateIdx: index('opportunity_stage_close_date_idx').on(table.stage, table.expectedCloseDate),
  activeUpdatedAtIdx: index('opportunity_active_updated_at_idx').on(table.isActive, table.updatedAt),
  stageValueIdx: index('opportunity_stage_value_idx').on(table.stage, table.value),
  probabilityStageIdx: index('opportunity_probability_stage_idx').on(table.probability, table.stage),
  closeDateIdx: index('opportunity_close_date_idx').on(table.expectedCloseDate),
  valueIdx: index('opportunity_value_idx').on(table.value),
  createdAtStageIdx: index('opportunity_created_at_stage_idx').on(table.createdAt, table.stage),
}));

// Type inference
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type UpdateOpportunity = Partial<NewOpportunity>;

// Opportunity stages enum for sales pipeline
export const OpportunityStages = {
  PROSPECT: 'PROSPECT',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST'
} as const;

export type OpportunityStage = typeof OpportunityStages[keyof typeof OpportunityStages];

// Helper function to get stage display information
export const getStageInfo = (stage: OpportunityStage) => {
  const stageMap = {
    [OpportunityStages.PROSPECT]: { label: 'Prospect', probability: 10, color: '#94a3b8' },
    [OpportunityStages.QUALIFIED]: { label: 'Qualified', probability: 25, color: '#60a5fa' },
    [OpportunityStages.PROPOSAL]: { label: 'Proposal', probability: 50, color: '#fbbf24' },
    [OpportunityStages.NEGOTIATION]: { label: 'Negotiation', probability: 75, color: '#f59e0b' },
    [OpportunityStages.CLOSED_WON]: { label: 'Closed Won', probability: 100, color: '#10b981' },
    [OpportunityStages.CLOSED_LOST]: { label: 'Closed Lost', probability: 0, color: '#ef4444' }
  };
  
  return stageMap[stage];
};