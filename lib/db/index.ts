/**
 * Drizzle Database Connection
 * Handles connection to PostgreSQL with environment-based configuration
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/settings';

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// PostgreSQL connection configuration
const connectionConfig = {
  max: NODE_ENV === 'production' ? 4 : 2, // B1 constraint: limit connections
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Disable prepared statements for better compatibility
};

// Create connection
const client = postgres(DATABASE_URL, connectionConfig);

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for use in other files
export { schema };

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Connection pool monitoring for B1 optimization
export function getConnectionStats() {
  return {
    totalConnections: client.options.max,
    environment: NODE_ENV,
    url: DATABASE_URL?.replace(/(:\/\/.+:).+(@)/, '$1***$2'), // Hide password
  };
}

// Helper for transactions
export { client as pg };