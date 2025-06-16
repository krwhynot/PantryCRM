/**
 * Drizzle Kit Configuration
 * Configuration for database migrations and schema generation
 */

import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema/*.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
  verbose: true,
  strict: true,
  // Additional options for better development experience
  introspect: {
    casing: 'snake_case',
  },
} satisfies Config;