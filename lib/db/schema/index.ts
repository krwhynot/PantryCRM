/**
 * Main Schema Index
 * Exports all Drizzle schemas and types for the PantryCRM database
 */

// Export all schemas
export * from './auth';
export * from './organizations';
export * from './contacts';
export * from './interactions';
export * from './opportunities';
export * from './leads';
export * from './contracts';
export * from './settings';

// Import all schemas for database relations
import { users, accounts, sessions, verificationTokens } from './auth';
import { organizations } from './organizations';
import { contacts } from './contacts';
import { interactions } from './interactions';
import { opportunities } from './opportunities';
import { leads } from './leads';
import { contracts } from './contracts';
import { systemSettings } from './settings';

// Export combined schema object for Drizzle
export const schema = {
  // Authentication
  users,
  accounts,
  sessions,
  verificationTokens,
  
  // Core CRM
  organizations,
  contacts,
  interactions,
  opportunities,
  leads,
  contracts,
  
  // Settings
  systemSettings,
};

// Database relation definitions (for joins and queries)
export const relations = {
  // User relations
  users: {
    accounts: 'many',
    sessions: 'many',
    assignedLeads: 'many'
  },
  
  // Organization relations
  organizations: {
    contacts: 'many',
    interactions: 'many',
    opportunities: 'many',
    leads: 'many',
    contracts: 'many'
  },
  
  // Contact relations
  contacts: {
    organization: 'one',
    interactions: 'many',
    opportunities: 'many',
    contracts: 'many'
  },
  
  // Interaction relations
  interactions: {
    organization: 'one',
    contact: 'one'
  },
  
  // Opportunity relations
  opportunities: {
    organization: 'one',
    contact: 'one'
  },
  
  // Lead relations
  leads: {
    organization: 'one',
    assignedTo: 'one'
  },
  
  // Contract relations
  contracts: {
    organization: 'one',
    contact: 'one'
  }
};

// Export table names for migrations and utilities
export const tableNames = {
  users: 'users',
  accounts: 'accounts',
  sessions: 'sessions',
  verificationTokens: 'verification_tokens',
  organizations: 'organizations',
  contacts: 'contacts',
  interactions: 'interactions',
  opportunities: 'opportunities',
  leads: 'leads',
  contracts: 'contracts',
  systemSettings: 'system_settings'
} as const;