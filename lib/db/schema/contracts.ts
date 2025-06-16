/**
 * Contracts Schema for Drizzle ORM
 * Contract management and tracking
 */

import { pgTable, varchar, text, real, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { contacts } from './contacts';

export const contracts = pgTable('contracts', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Contract details
  name: varchar('name', { length: 255 }).notNull(),
  value: real('value'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, ACTIVE, EXPIRED, CANCELLED
  terms: text('terms'),
  notes: text('notes'),
  
  // Foreign keys
  organizationId: varchar('organization_id', { length: 36 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contactId: varchar('contact_id', { length: 36 }).references(() => contacts.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes optimized for B1 PostgreSQL
  organizationStatusIdx: index('contract_org_status_idx').on(table.organizationId, table.status),
  statusEndDateIdx: index('contract_status_end_date_idx').on(table.status, table.endDate),
  startDateIdx: index('contract_start_date_idx').on(table.startDate),
  endDateIdx: index('contract_end_date_idx').on(table.endDate),
  valueIdx: index('contract_value_idx').on(table.value),
  statusValueIdx: index('contract_status_value_idx').on(table.status, table.value),
  contactIdx: index('contract_contact_idx').on(table.contactId),
  createdAtStatusIdx: index('contract_created_at_status_idx').on(table.createdAt, table.status),
}));

// Type inference
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type UpdateContract = Partial<NewContract>;

// Contract statuses enum
export const ContractStatuses = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING',
  RENEWED: 'RENEWED'
} as const;

export type ContractStatus = typeof ContractStatuses[keyof typeof ContractStatuses];

// Helper function to get status display information
export const getContractStatusInfo = (status: ContractStatus) => {
  const statusMap = {
    [ContractStatuses.DRAFT]: { label: 'Draft', color: '#94a3b8', priority: 'medium' },
    [ContractStatuses.PENDING]: { label: 'Pending', color: '#fbbf24', priority: 'high' },
    [ContractStatuses.ACTIVE]: { label: 'Active', color: '#10b981', priority: 'low' },
    [ContractStatuses.RENEWED]: { label: 'Renewed', color: '#06b6d4', priority: 'low' },
    [ContractStatuses.EXPIRED]: { label: 'Expired', color: '#f59e0b', priority: 'medium' },
    [ContractStatuses.CANCELLED]: { label: 'Cancelled', color: '#ef4444', priority: 'low' }
  };
  
  return statusMap[status];
};