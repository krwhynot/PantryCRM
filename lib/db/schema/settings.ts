/**
 * Settings Schema for Drizzle ORM
 * Unified schema combining SystemSetting and Setting models
 */

import { pgTable, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const systemSettings = pgTable('system_settings', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Core fields
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  
  // Extended fields (previously missing)
  label: varchar('label', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('string'), // string, number, boolean, json
  
  // Display and ordering
  sortOrder: integer('sort_order').notNull().default(0),
  color: varchar('color', { length: 7 }), // hex color code
  active: boolean('active').notNull().default(true),
  
  // Metadata
  description: text('description'),
  defaultValue: text('default_value'),
  validation: text('validation'), // JSON validation rules
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for common queries
  keyIdx: index('settings_key_idx').on(table.key),
  categoryIdx: index('settings_category_idx').on(table.category),
  typeIdx: index('settings_type_idx').on(table.type),
  activeIdx: index('settings_active_idx').on(table.active),
  sortOrderIdx: index('settings_sort_order_idx').on(table.category, table.sortOrder),
}));

// Type inference
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
export type UpdateSystemSetting = Partial<NewSystemSetting>;

// Setting categories enum for type safety
export const SettingCategories = {
  PRIORITIES: 'PRIORITIES',
  MARKET_SEGMENTS: 'MARKET_SEGMENTS', 
  DISTRIBUTORS: 'DISTRIBUTORS',
  CONTACT_ROLES: 'CONTACT_ROLES',
  INTERACTION_TYPES: 'INTERACTION_TYPES',
  PRINCIPALS: 'PRINCIPALS',
  SYSTEM: 'SYSTEM',
  UI: 'UI',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE'
} as const;

export type SettingCategory = typeof SettingCategories[keyof typeof SettingCategories];

// Setting types enum for validation
export const SettingTypes = {
  STRING: 'string',
  NUMBER: 'number', 
  BOOLEAN: 'boolean',
  JSON: 'json',
  COLOR: 'color',
  EMAIL: 'email',
  URL: 'url'
} as const;

export type SettingType = typeof SettingTypes[keyof typeof SettingTypes];

// Helper type for typed setting values
export interface TypedSetting<T = any> extends SystemSetting {
  parsedValue: T;
  categoryInfo?: SettingCategoryInfo;
}

export interface SettingCategoryInfo {
  key: SettingCategory;
  label: string;
  description?: string;
  sortOrder: number;
  icon?: string;
}

// Default food service settings data
export const DEFAULT_FOOD_SERVICE_SETTINGS: Omit<NewSystemSetting, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Priority Settings
  {
    key: 'PRIORITY_A',
    value: 'A',
    label: 'Priority A',
    category: SettingCategories.PRIORITIES,
    type: SettingTypes.STRING,
    color: '#ef4444',
    sortOrder: 1,
    description: 'Highest priority accounts requiring immediate attention',
    active: true
  },
  {
    key: 'PRIORITY_B', 
    value: 'B',
    label: 'Priority B',
    category: SettingCategories.PRIORITIES,
    type: SettingTypes.STRING,
    color: '#f97316',
    sortOrder: 2,
    description: 'High priority accounts for regular follow-up',
    active: true
  },
  {
    key: 'PRIORITY_C',
    value: 'C', 
    label: 'Priority C',
    category: SettingCategories.PRIORITIES,
    type: SettingTypes.STRING,
    color: '#eab308',
    sortOrder: 3,
    description: 'Medium priority accounts for periodic review',
    active: true
  },
  {
    key: 'PRIORITY_D',
    value: 'D',
    label: 'Priority D', 
    category: SettingCategories.PRIORITIES,
    type: SettingTypes.STRING,
    color: '#22c55e',
    sortOrder: 4,
    description: 'Lower priority accounts for maintenance',
    active: true
  },

  // Market Segments
  {
    key: 'MARKET_FINE_DINING',
    value: 'Fine Dining',
    label: 'Fine Dining',
    category: SettingCategories.MARKET_SEGMENTS,
    type: SettingTypes.STRING,
    sortOrder: 1,
    description: 'High-end restaurants and fine dining establishments',
    active: true
  },
  {
    key: 'MARKET_FAST_FOOD',
    value: 'Fast Food',
    label: 'Fast Food',
    category: SettingCategories.MARKET_SEGMENTS,
    type: SettingTypes.STRING,
    sortOrder: 2,
    description: 'Quick service restaurants and fast food chains',
    active: true
  },
  {
    key: 'MARKET_HEALTHCARE',
    value: 'Healthcare',
    label: 'Healthcare Food Service', 
    category: SettingCategories.MARKET_SEGMENTS,
    type: SettingTypes.STRING,
    sortOrder: 3,
    description: 'Hospitals, clinics, and healthcare facility dining',
    active: true
  },
  {
    key: 'MARKET_EDUCATION',
    value: 'Education',
    label: 'Educational Food Service',
    category: SettingCategories.MARKET_SEGMENTS, 
    type: SettingTypes.STRING,
    sortOrder: 4,
    description: 'Schools, universities, and educational institutions',
    active: true
  },
  {
    key: 'MARKET_CORPORATE',
    value: 'Corporate',
    label: 'Corporate Dining',
    category: SettingCategories.MARKET_SEGMENTS,
    type: SettingTypes.STRING,
    sortOrder: 5,
    description: 'Corporate cafeterias and business dining',
    active: true
  },

  // Distributors
  {
    key: 'DISTRIBUTOR_SYSCO',
    value: 'Sysco',
    label: 'Sysco Corporation',
    category: SettingCategories.DISTRIBUTORS,
    type: SettingTypes.STRING,
    sortOrder: 1,
    description: 'Largest food service distributor in North America',
    active: true
  },
  {
    key: 'DISTRIBUTOR_US_FOODS',
    value: 'US Foods',
    label: 'US Foods',
    category: SettingCategories.DISTRIBUTORS,
    type: SettingTypes.STRING,
    sortOrder: 2,
    description: 'Major food service distributor',
    active: true
  },
  {
    key: 'DISTRIBUTOR_PERFORMANCE_FOOD',
    value: 'Performance Food Group',
    label: 'Performance Food Group',
    category: SettingCategories.DISTRIBUTORS,
    type: SettingTypes.STRING,
    sortOrder: 3,
    description: 'Food distribution and supply chain company',
    active: true
  },
  {
    key: 'DISTRIBUTOR_GORDON_FOOD',
    value: 'Gordon Food Service',
    label: 'Gordon Food Service',
    category: SettingCategories.DISTRIBUTORS,
    type: SettingTypes.STRING,
    sortOrder: 4,
    description: 'Family-owned food service distributor',
    active: true
  },
  {
    key: 'DISTRIBUTOR_REINHART',
    value: 'Reinhart FoodService',
    label: 'Reinhart FoodService',
    category: SettingCategories.DISTRIBUTORS,
    type: SettingTypes.STRING,
    sortOrder: 5,
    description: 'Regional food service distributor',
    active: true
  },

  // Contact Roles
  {
    key: 'ROLE_EXECUTIVE_CHEF',
    value: 'Executive Chef',
    label: 'Executive Chef',
    category: SettingCategories.CONTACT_ROLES,
    type: SettingTypes.STRING,
    sortOrder: 1,
    description: 'Head chef responsible for menu and kitchen operations',
    active: true
  },
  {
    key: 'ROLE_FOOD_BUYER',
    value: 'Food & Beverage Buyer',
    label: 'Food & Beverage Buyer',
    category: SettingCategories.CONTACT_ROLES,
    type: SettingTypes.STRING,
    sortOrder: 2,
    description: 'Purchasing decision maker for food and beverages',
    active: true
  },
  {
    key: 'ROLE_GENERAL_MANAGER',
    value: 'General Manager',
    label: 'General Manager',
    category: SettingCategories.CONTACT_ROLES,
    type: SettingTypes.STRING,
    sortOrder: 3,
    description: 'Overall restaurant or facility manager',
    active: true
  },
  {
    key: 'ROLE_OPERATIONS_MANAGER',
    value: 'Operations Manager',
    label: 'Operations Manager',
    category: SettingCategories.CONTACT_ROLES,
    type: SettingTypes.STRING,
    sortOrder: 4,
    description: 'Manager overseeing daily operations',
    active: true
  },
  {
    key: 'ROLE_OWNER',
    value: 'Owner/Proprietor',
    label: 'Owner/Proprietor',
    category: SettingCategories.CONTACT_ROLES,
    type: SettingTypes.STRING,
    sortOrder: 5,
    description: 'Restaurant or business owner',
    active: true
  },

  // Interaction Types
  {
    key: 'INTERACTION_EMAIL',
    value: 'Email',
    label: 'Email Communication',
    category: SettingCategories.INTERACTION_TYPES,
    type: SettingTypes.STRING,
    sortOrder: 1,
    description: 'Email correspondence with contacts',
    active: true
  },
  {
    key: 'INTERACTION_PHONE_CALL',
    value: 'Phone Call',
    label: 'Phone Call',
    category: SettingCategories.INTERACTION_TYPES,
    type: SettingTypes.STRING,
    sortOrder: 2,
    description: 'Telephone conversations',
    active: true
  },
  {
    key: 'INTERACTION_IN_PERSON',
    value: 'In Person',
    label: 'In-Person Meeting',
    category: SettingCategories.INTERACTION_TYPES,
    type: SettingTypes.STRING,
    sortOrder: 3,
    description: 'Face-to-face meetings and visits',
    active: true
  },
  {
    key: 'INTERACTION_DEMO',
    value: 'Product Demo',
    label: 'Product Demonstration',
    category: SettingCategories.INTERACTION_TYPES,
    type: SettingTypes.STRING,
    sortOrder: 4,
    description: 'Product demonstrations and tastings',
    active: true
  },
  {
    key: 'INTERACTION_TRADE_SHOW',
    value: 'Trade Show',
    label: 'Trade Show/Event',
    category: SettingCategories.INTERACTION_TYPES,
    type: SettingTypes.STRING,
    sortOrder: 5,
    description: 'Industry trade shows and events',
    active: true
  },
  {
    key: 'INTERACTION_FOLLOW_UP',
    value: 'Follow Up',
    label: 'Follow-up Contact',
    category: SettingCategories.INTERACTION_TYPES,
    type: SettingTypes.STRING,
    sortOrder: 6,
    description: 'Follow-up communications and check-ins',
    active: true
  },

  // Principals/Brands (Sample - would be customized per client)
  {
    key: 'PRINCIPAL_KAUFHOLDS',
    value: 'Kaufholds',
    label: 'Kaufholds',
    category: SettingCategories.PRINCIPALS,
    type: SettingTypes.STRING,
    sortOrder: 1,
    description: 'Food service brand or product line',
    active: true
  },
  {
    key: 'PRINCIPAL_FRITES_STREET',
    value: 'Frites Street',
    label: 'Frites Street',
    category: SettingCategories.PRINCIPALS,
    type: SettingTypes.STRING,
    sortOrder: 2,
    description: 'Specialty food brand',
    active: true
  },
  {
    key: 'PRINCIPAL_BETTER_BALANCE',
    value: 'Better Balance',
    label: 'Better Balance',
    category: SettingCategories.PRINCIPALS,
    type: SettingTypes.STRING,
    sortOrder: 3,
    description: 'Health-focused food brand',
    active: true
  }
];

// Category information for UI
export const SETTING_CATEGORY_INFO: Record<SettingCategory, SettingCategoryInfo> = {
  [SettingCategories.PRIORITIES]: {
    key: SettingCategories.PRIORITIES,
    label: 'Account Priorities',
    description: 'Priority levels for account classification',
    sortOrder: 1,
    icon: '🎯'
  },
  [SettingCategories.MARKET_SEGMENTS]: {
    key: SettingCategories.MARKET_SEGMENTS,
    label: 'Market Segments',
    description: 'Types of food service establishments',
    sortOrder: 2,
    icon: '🏢'
  },
  [SettingCategories.DISTRIBUTORS]: {
    key: SettingCategories.DISTRIBUTORS,
    label: 'Distributors',
    description: 'Food service distribution partners',
    sortOrder: 3,
    icon: '🚚'
  },
  [SettingCategories.CONTACT_ROLES]: {
    key: SettingCategories.CONTACT_ROLES,
    label: 'Contact Roles',
    description: 'Job titles and roles of contacts',
    sortOrder: 4,
    icon: '👥'
  },
  [SettingCategories.INTERACTION_TYPES]: {
    key: SettingCategories.INTERACTION_TYPES,
    label: 'Interaction Types',
    description: 'Types of customer interactions',
    sortOrder: 5,
    icon: '💬'
  },
  [SettingCategories.PRINCIPALS]: {
    key: SettingCategories.PRINCIPALS,
    label: 'Principals/Brands',
    description: 'Product brands and principals represented',
    sortOrder: 6,
    icon: '🏷️'
  },
  [SettingCategories.SYSTEM]: {
    key: SettingCategories.SYSTEM,
    label: 'System Settings',
    description: 'Core system configuration',
    sortOrder: 7,
    icon: '⚙️'
  },
  [SettingCategories.UI]: {
    key: SettingCategories.UI,
    label: 'User Interface',
    description: 'UI preferences and customization',
    sortOrder: 8,
    icon: '🎨'
  },
  [SettingCategories.SECURITY]: {
    key: SettingCategories.SECURITY,
    label: 'Security Settings',
    description: 'Security and access controls',
    sortOrder: 9,
    icon: '🔒'
  },
  [SettingCategories.PERFORMANCE]: {
    key: SettingCategories.PERFORMANCE,
    label: 'Performance Settings',
    description: 'Performance and optimization settings',
    sortOrder: 10,
    icon: '⚡'
  }
};