/**
 * Environment variable validation for PantryCRM
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Node.js environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid APP_URL').optional(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'APP_NAME is required').optional(),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL').optional(),
  
  // OAuth Providers
  GOOGLE_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  
  // Email Service
  EMAIL_FROM: z.string().email('Invalid EMAIL_FROM address').optional(),
  RESEND_API_KEY: z.string().optional(),
  
  // Azure Storage (Optional)
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER_NAME: z.string().optional(),
  
  // Monitoring & Logging (Optional)
  AZURE_INSIGHTS_CONNECTION_STRING: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  
  // Security
  RATE_LIMIT_WINDOW: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).optional(),
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).optional(),
  
  // Feature Flags
  NEXT_PUBLIC_BYPASS_AUTH: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  
  // Build-time
  ANALYZE: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  CI: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  
  // Port (for server)
  PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).optional(),
});

export type Env = z.infer<typeof envSchema>;

// Validation function
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional validation logic
    validateOAuthConfiguration(env);
    validateProductionRequirements(env);
    validateEmailConfiguration(env);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\n` +
        'Please check your .env file or environment variables.'
      );
    }
    throw error;
  }
}

// Additional validation functions
function validateOAuthConfiguration(env: Env): void {
  // If OAuth providers are configured, both ID and SECRET must be present
  if (env.GOOGLE_ID && !env.GOOGLE_SECRET) {
    throw new Error('GOOGLE_SECRET is required when GOOGLE_ID is set');
  }
  
  if (env.GOOGLE_SECRET && !env.GOOGLE_ID) {
    throw new Error('GOOGLE_ID is required when GOOGLE_SECRET is set');
  }
  
  if (env.GITHUB_ID && !env.GITHUB_SECRET) {
    throw new Error('GITHUB_SECRET is required when GITHUB_ID is set');
  }
  
  if (env.GITHUB_SECRET && !env.GITHUB_ID) {
    throw new Error('GITHUB_ID is required when GITHUB_SECRET is set');
  }
}

function validateProductionRequirements(env: Env): void {
  if (env.NODE_ENV === 'production') {
    const requiredForProduction = [
      'NEXT_PUBLIC_APP_URL',
      'JWT_SECRET',
      'EMAIL_FROM',
    ];
    
    const missing = requiredForProduction.filter(key => !env[key as keyof Env]);
    
    if (missing.length > 0) {
      throw new Error(
        `The following environment variables are required in production:\n${missing.join('\n')}`
      );
    }
    
    // Validate URLs in production
    if (env.NEXT_PUBLIC_APP_URL && !env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
      console.warn('WARNING: APP_URL should use HTTPS in production');
    }
    
    // Validate secret strength in production
    if (env.JWT_SECRET && env.JWT_SECRET.length < 64) {
      console.warn('WARNING: JWT_SECRET should be at least 64 characters in production');
    }
  }
}

function validateEmailConfiguration(env: Env): void {
  // If email is configured, validate the setup
  if (env.EMAIL_FROM && !env.RESEND_API_KEY) {
    console.warn('WARNING: EMAIL_FROM is set but RESEND_API_KEY is missing. Email features may not work.');
  }
  
  if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is required when RESEND_API_KEY is set');
  }
}

// Type-safe environment variable getter
export function getEnvVar<K extends keyof Env>(key: K, fallback?: Env[K]): Env[K] {
  const value = process.env[key] as Env[K];
  
  if (value === undefined && fallback !== undefined) {
    return fallback;
  }
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value;
}

// Utility functions for common environment checks
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isTest = (): boolean => process.env.NODE_ENV === 'test';

// Check if specific features are enabled
export const isAuthBypassed = (): boolean => process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
export const isAnalyticsEnabled = (): boolean => process.env.ENABLE_ANALYTICS === 'true';
export const isCIEnvironment = (): boolean => process.env.CI === 'true';

// Get application configuration
export const getAppConfig = () => {
  const env = validateEnv();
  
  return {
    app: {
      name: env.NEXT_PUBLIC_APP_NAME || 'Kitchen Pantry CRM',
      url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      environment: env.NODE_ENV,
    },
    database: {
      url: env.DATABASE_URL,
    },
    auth: {
      jwtSecret: env.JWT_SECRET,
      nextAuthSecret: env.NEXTAUTH_SECRET,
      nextAuthUrl: env.NEXTAUTH_URL,
      google: {
        enabled: !!(env.GOOGLE_ID && env.GOOGLE_SECRET),
        clientId: env.GOOGLE_ID,
        clientSecret: env.GOOGLE_SECRET,
      },
      github: {
        enabled: !!(env.GITHUB_ID && env.GITHUB_SECRET),
        clientId: env.GITHUB_ID,
        clientSecret: env.GITHUB_SECRET,
      },
    },
    email: {
      enabled: !!(env.EMAIL_FROM && env.RESEND_API_KEY),
      from: env.EMAIL_FROM,
      apiKey: env.RESEND_API_KEY,
    },
    monitoring: {
      azureInsights: env.AZURE_INSIGHTS_CONNECTION_STRING,
      datadog: env.DATADOG_API_KEY,
      logLevel: env.LOG_LEVEL || (isDevelopment() ? 'DEBUG' : 'INFO'),
    },
    features: {
      authBypass: isAuthBypassed(),
      analytics: isAnalyticsEnabled(),
    },
    security: {
      rateLimitWindow: env.RATE_LIMIT_WINDOW || 60000, // 1 minute
      rateLimitMax: env.RATE_LIMIT_MAX || 100,
    },
  };
};

// Validate environment on module load (except in test environment)
if (!isTest()) {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : error);
    
    if (isProduction()) {
      // Exit in production if environment is invalid
      process.exit(1);
    } else {
      // Just warn in development
      console.warn('⚠️ Continuing with invalid environment in development mode');
    }
  }
}

export default validateEnv;