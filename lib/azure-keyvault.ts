/**
 * Azure Key Vault integration for PantryCRM
 * Secure secrets management for Azure B1 deployment
 */

import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';

interface KeyVaultConfig {
  vaultUrl: string;
  credential: DefaultAzureCredential | ManagedIdentityCredential;
  enableCaching: boolean;
  cacheTtlMs: number;
  enableFallback: boolean;
}

interface SecretCache {
  [key: string]: {
    value: string;
    expiry: number;
  };
}

/**
 * Azure Key Vault manager for secure secrets management
 */
export class AzureKeyVaultManager {
  private client: SecretClient | null = null;
  private cache: SecretCache = {};
  private config: KeyVaultConfig;
  private initialized = false;

  constructor() {
    this.config = this.getKeyVaultConfig();
    this.initializeKeyVault();
  }

  /**
   * Get Key Vault configuration optimized for Azure B1
   */
  private getKeyVaultConfig(): KeyVaultConfig {
    const vaultUrl = process.env.AZURE_KEYVAULT_URL || process.env.KEY_VAULT_URL;
    
    if (!vaultUrl) {
      console.warn('[KEYVAULT] No vault URL provided, Key Vault will not be initialized');
    }

    // Use Managed Identity in Azure, DefaultAzureCredential for local development
    const credential = process.env.AZURE_CLIENT_ID 
      ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
      : new DefaultAzureCredential();

    return {
      vaultUrl: vaultUrl || '',
      credential,
      enableCaching: true, // Cache secrets to reduce API calls (cost optimization)
      cacheTtlMs: 15 * 60 * 1000, // 15 minutes cache
      enableFallback: true // Fallback to environment variables if Key Vault fails
    };
  }

  /**
   * Initialize Azure Key Vault client
   */
  private async initializeKeyVault(): Promise<void> {
    if (!this.config.vaultUrl) {
      console.warn('[KEYVAULT] No vault URL configured, using environment variables fallback');
      return;
    }

    try {
      this.client = new SecretClient(this.config.vaultUrl, this.config.credential);
      
      // Test connectivity
      await this.testConnection();
      
      this.initialized = true;
      console.log('[KEYVAULT] Azure Key Vault initialized successfully');
      
    } catch (error) {
      console.error('[KEYVAULT] Failed to initialize Azure Key Vault:', error);
      
      if (this.config.enableFallback) {
        console.warn('[KEYVAULT] Falling back to environment variables');
      }
    }
  }

  /**
   * Test Key Vault connectivity
   */
  private async testConnection(): Promise<void> {
    if (!this.client) return;

    try {
      // Try to list secrets (this tests both connectivity and permissions)
      const secretsIterator = this.client.listPropertiesOfSecrets();
      await secretsIterator.next();
      
    } catch (error: any) {
      if (error.code === 'Forbidden') {
        console.warn('[KEYVAULT] Limited permissions detected, some operations may fail');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get secret value with caching and fallback
   */
  async getSecret(secretName: string, fallbackEnvVar?: string): Promise<string | null> {
    // Check cache first
    if (this.config.enableCaching && this.cache[secretName]) {
      const cached = this.cache[secretName];
      if (Date.now() < cached.expiry) {
        return cached.value;
      }
      // Remove expired cache entry
      delete this.cache[secretName];
    }

    // Try Key Vault if initialized
    if (this.initialized && this.client) {
      try {
        const secret = await this.client.getSecret(secretName);
        const value = secret.value;
        
        if (value) {
          // Cache the secret
          if (this.config.enableCaching) {
            this.cache[secretName] = {
              value,
              expiry: Date.now() + this.config.cacheTtlMs
            };
          }
          
          return value;
        }
        
      } catch (error: any) {
        console.error(`[KEYVAULT] Error retrieving secret '${secretName}':`, error.message);
        
        // Don't throw error, fall back to environment variable
      }
    }

    // Fallback to environment variable
    if (this.config.enableFallback && fallbackEnvVar) {
      const envValue = process.env[fallbackEnvVar];
      if (envValue) {
        console.warn(`[KEYVAULT] Using fallback environment variable for '${secretName}'`);
        return envValue;
      }
    }

    console.error(`[KEYVAULT] Secret '${secretName}' not found in Key Vault or environment variables`);
    return null;
  }

  /**
   * Get multiple secrets efficiently
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    // Process secrets in parallel but limit concurrency for B1 constraints
    const BATCH_SIZE = 3; // Limit concurrent requests for B1
    
    for (let i = 0; i < secretNames.length; i += BATCH_SIZE) {
      const batch = secretNames.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (secretName) => {
        const value = await this.getSecret(secretName);
        return { secretName, value };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ secretName, value }) => {
        results[secretName] = value;
      });
    }
    
    return results;
  }

  /**
   * Set secret in Key Vault
   */
  async setSecret(secretName: string, secretValue: string): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.error('[KEYVAULT] Key Vault not initialized, cannot set secret');
      return false;
    }

    try {
      await this.client.setSecret(secretName, secretValue);
      
      // Update cache
      if (this.config.enableCaching) {
        this.cache[secretName] = {
          value: secretValue,
          expiry: Date.now() + this.config.cacheTtlMs
        };
      }
      
      console.log(`[KEYVAULT] Secret '${secretName}' set successfully`);
      return true;
      
    } catch (error) {
      console.error(`[KEYVAULT] Error setting secret '${secretName}':`, error);
      return false;
    }
  }

  /**
   * Delete secret from Key Vault
   */
  async deleteSecret(secretName: string): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.error('[KEYVAULT] Key Vault not initialized, cannot delete secret');
      return false;
    }

    try {
      await this.client.beginDeleteSecret(secretName);
      
      // Remove from cache
      delete this.cache[secretName];
      
      console.log(`[KEYVAULT] Secret '${secretName}' deleted successfully`);
      return true;
      
    } catch (error) {
      console.error(`[KEYVAULT] Error deleting secret '${secretName}':`, error);
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('[KEYVAULT] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalSecrets: number; validSecrets: number; expiredSecrets: number } {
    const now = Date.now();
    let validSecrets = 0;
    let expiredSecrets = 0;
    
    Object.values(this.cache).forEach(entry => {
      if (now < entry.expiry) {
        validSecrets++;
      } else {
        expiredSecrets++;
      }
    });
    
    return {
      totalSecrets: Object.keys(this.cache).length,
      validSecrets,
      expiredSecrets
    };
  }

  /**
   * Check if Key Vault is initialized and working
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    initialized: boolean;
    cacheStats: ReturnType<typeof this.getCacheStats>;
    lastError?: string;
  }> {
    const cacheStats = this.getCacheStats();
    
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        initialized: false,
        cacheStats,
        lastError: 'Key Vault not initialized'
      };
    }

    // Test connectivity
    try {
      if (this.client) {
        await this.client.listPropertiesOfSecrets().next();
      }
      
      return {
        status: 'healthy',
        initialized: true,
        cacheStats
      };
      
    } catch (error: any) {
      return {
        status: 'degraded',
        initialized: true,
        cacheStats,
        lastError: error.message
      };
    }
  }
}

// Global Key Vault instance
export const keyVault = new AzureKeyVaultManager();

/**
 * Secure configuration loader using Key Vault with fallbacks
 */
export class SecureConfigLoader {
  private static instance: SecureConfigLoader;
  private configCache: Record<string, any> = {};

  static getInstance(): SecureConfigLoader {
    if (!SecureConfigLoader.instance) {
      SecureConfigLoader.instance = new SecureConfigLoader();
    }
    return SecureConfigLoader.instance;
  }

  /**
   * Load database configuration from Key Vault
   */
  async getDatabaseConfig(): Promise<{
    url: string;
    shadowUrl?: string;
    poolUrl?: string;
  }> {
    const secrets = await keyVault.getSecrets([
      'database-url',
      'shadow-database-url', 
      'prisma-connection-pool-url'
    ]);

    return {
      url: secrets['database-url'] || process.env.DATABASE_URL || '',
      shadowUrl: secrets['shadow-database-url'] || process.env.SHADOW_DATABASE_URL,
      poolUrl: secrets['prisma-connection-pool-url'] || process.env.PRISMA_CONNECTION_POOL_URL
    };
  }

  /**
   * Load authentication secrets
   */
  async getAuthConfig(): Promise<{
    jwtSecret: string;
    googleId?: string;
    googleSecret?: string;
    githubId?: string;
    githubSecret?: string;
  }> {
    const secrets = await keyVault.getSecrets([
      'jwt-secret',
      'google-oauth-id',
      'google-oauth-secret',
      'github-oauth-id',
      'github-oauth-secret'
    ]);

    return {
      jwtSecret: secrets['jwt-secret'] || process.env.JWT_SECRET || 'fallback-secret',
      googleId: secrets['google-oauth-id'] || process.env.GOOGLE_ID,
      googleSecret: secrets['google-oauth-secret'] || process.env.GOOGLE_SECRET,
      githubId: secrets['github-oauth-id'] || process.env.GITHUB_ID,
      githubSecret: secrets['github-oauth-secret'] || process.env.GITHUB_SECRET
    };
  }

  /**
   * Load Azure service configurations
   */
  async getAzureConfig(): Promise<{
    storageConnectionString?: string;
    redisUrl?: string;
    appInsightsKey?: string;
  }> {
    const secrets = await keyVault.getSecrets([
      'azure-storage-connection-string',
      'azure-redis-url',
      'application-insights-key'
    ]);

    return {
      storageConnectionString: secrets['azure-storage-connection-string'] || process.env.AZURE_STORAGE_CONNECTION_STRING,
      redisUrl: secrets['azure-redis-url'] || process.env.AZURE_REDIS_URL || process.env.REDIS_URL,
      appInsightsKey: secrets['application-insights-key'] || process.env.APPINSIGHTS_INSTRUMENTATIONKEY
    };
  }

  /**
   * Load external API keys
   */
  async getExternalApiConfig(): Promise<{
    openaiKey?: string;
    sendgridKey?: string;
    stripeKey?: string;
  }> {
    const secrets = await keyVault.getSecrets([
      'openai-api-key',
      'sendgrid-api-key',
      'stripe-secret-key'
    ]);

    return {
      openaiKey: secrets['openai-api-key'] || process.env.OPENAI_API_KEY,
      sendgridKey: secrets['sendgrid-api-key'] || process.env.SENDGRID_API_KEY,
      stripeKey: secrets['stripe-secret-key'] || process.env.STRIPE_SECRET_KEY
    };
  }
}

// Global secure config loader
export const secureConfig = SecureConfigLoader.getInstance();

/**
 * Environment setup for Azure Key Vault
 */
export function setupKeyVaultEnvironment(): void {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL || process.env.KEY_VAULT_URL;
  
  if (!vaultUrl) {
    console.warn('[KEYVAULT] Environment variables not set:');
    console.warn('  - AZURE_KEYVAULT_URL (your Key Vault URL)');
    console.warn('  - AZURE_CLIENT_ID (optional, for Managed Identity)');
    console.warn('Key Vault will fall back to environment variables.');
    return;
  }

  console.log('[KEYVAULT] Environment configured for Azure Key Vault');
  console.log(`[KEYVAULT] Vault URL: ${vaultUrl}`);
  
  if (process.env.AZURE_CLIENT_ID) {
    console.log('[KEYVAULT] Using Managed Identity authentication');
  } else {
    console.log('[KEYVAULT] Using DefaultAzureCredential authentication');
  }
}