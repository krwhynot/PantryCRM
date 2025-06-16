/**
 * Authentication Schema for Drizzle ORM
 * NextAuth.js compatible user, account, and session models
 */

import { pgTable, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // User information
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: varchar('image', { length: 255 }),
  password: varchar('password', { length: 255 }),
  
  // User management
  role: varchar('role', { length: 50 }).notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  
  // Password reset
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes
  emailIdx: index('user_email_idx').on(table.email),
  roleIdx: index('user_role_idx').on(table.role),
  activeIdx: index('user_active_idx').on(table.isActive),
  resetTokenIdx: index('user_reset_token_idx').on(table.resetToken),
}));

// Accounts table (OAuth providers)
export const accounts = pgTable('accounts', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // OAuth information
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  
  // OAuth tokens
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 50 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  // Performance indexes and constraints
  userIdx: index('account_user_idx').on(table.userId),
  providerIdx: index('account_provider_idx').on(table.provider, table.providerAccountId),
}));

// Sessions table
export const sessions = pgTable('sessions', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Session information
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  // Performance indexes
  sessionTokenIdx: index('session_token_idx').on(table.sessionToken),
  userIdx: index('session_user_idx').on(table.userId),
  expiresIdx: index('session_expires_idx').on(table.expires),
}));

// Verification tokens table
export const verificationTokens = pgTable('verification_tokens', {
  // Composite primary key
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  // Performance indexes
  tokenIdx: index('verification_token_idx').on(table.token),
  identifierIdx: index('verification_identifier_idx').on(table.identifier),
}));

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<NewUser>;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

// User roles enum
export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales'
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];