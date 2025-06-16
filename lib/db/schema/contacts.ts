/**
 * Contacts Schema for Drizzle ORM
 * Contact model with relationship to organizations
 */

import { pgTable, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const contacts = pgTable('contacts', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Personal information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  position: varchar('position', { length: 100 }),
  
  // Contact metadata
  isPrimary: boolean('is_primary').notNull().default(false),
  notes: text('notes'),
  
  // Foreign key
  organizationId: varchar('organization_id', { length: 36 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes optimized for B1 PostgreSQL
  organizationPrimaryIdx: index('contact_org_primary_idx').on(table.organizationId, table.isPrimary),
  nameIdx: index('contact_name_idx').on(table.firstName, table.lastName),
  emailIdx: index('contact_email_idx').on(table.email),
  organizationCreatedAtIdx: index('contact_org_created_at_idx').on(table.organizationId, table.createdAt),
  organizationPositionIdx: index('contact_org_position_idx').on(table.organizationId, table.position),
  primaryUpdatedAtIdx: index('contact_primary_updated_at_idx').on(table.isPrimary, table.updatedAt),
  phoneIdx: index('contact_phone_idx').on(table.phone),
}));

// Type inference
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type UpdateContact = Partial<NewContact>;

// Common contact positions in food service industry
export const ContactPositions = {
  EXECUTIVE_CHEF: 'Executive Chef',
  HEAD_CHEF: 'Head Chef',
  SOUS_CHEF: 'Sous Chef',
  KITCHEN_MANAGER: 'Kitchen Manager',
  FOOD_BUYER: 'Food Buyer',
  PURCHASING_MANAGER: 'Purchasing Manager',
  GENERAL_MANAGER: 'General Manager',
  OPERATIONS_MANAGER: 'Operations Manager',
  ASSISTANT_MANAGER: 'Assistant Manager',
  OWNER: 'Owner',
  PRESIDENT: 'President',
  VP_OPERATIONS: 'VP of Operations',
  DIRECTOR_FOOD_SERVICE: 'Director of Food Service',
  FOOD_SERVICE_DIRECTOR: 'Food Service Director',
  CULINARY_DIRECTOR: 'Culinary Director'
} as const;

export type ContactPosition = typeof ContactPositions[keyof typeof ContactPositions];