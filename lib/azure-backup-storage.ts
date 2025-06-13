/**
 * Azure Blob Storage integration for automated backups
 * Enhanced backup capabilities for PantryCRM with cost optimization
 */

import { BlobServiceClient, ContainerClient, BlobClient } from '@azure/storage-blob';
import { keyVault } from './azure-keyvault';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

interface BackupStorageConfig {
  connectionString?: string;
  accountName?: string;
  containerName: string;
  retentionDays: number;
  enableCompression: boolean;
  maxBackupSizeMB: number;
}

interface BackupMetadata {
  backupType: 'database' | 'application' | 'configuration' | 'logs';
  timestamp: string;
  size: number;
  version: string;
  environment: string;
  checksum?: string;
}

/**
 * Azure Blob Storage manager for automated backups
 */
export class AzureBackupStorageManager {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerClient: ContainerClient | null = null;
  private config: BackupStorageConfig;
  private initialized = false;

  constructor() {
    this.config = this.getStorageConfig();
    this.initializeStorage();
  }

  /**
   * Get storage configuration optimized for cost
   */
  private getStorageConfig(): BackupStorageConfig {
    return {
      connectionString: undefined, // Will be loaded from Key Vault
      accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
      containerName: 'pantry-crm-backups',
      retentionDays: 30, // Keep backups for 30 days
      enableCompression: true, // Reduce storage costs
      maxBackupSizeMB: 500 // Limit individual backup size
    };
  }

  /**
   * Initialize Azure Blob Storage
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Get connection string from Key Vault with fallback
      const connectionString = await keyVault.getSecret(
        'azure-storage-connection-string',
        'AZURE_STORAGE_CONNECTION_STRING'
      );

      if (!connectionString) {
        console.warn('[BACKUP_STORAGE] No storage connection string found');
        return;
      }

      // Initialize blob service client
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      
      // Get or create container
      this.containerClient = this.blobServiceClient.getContainerClient(this.config.containerName);
      
      // Ensure container exists
      await this.containerClient.createIfNotExists({
        access: 'private' // Private access for security
      });

      this.initialized = true;
      console.log('[BACKUP_STORAGE] Azure Blob Storage initialized successfully');

      // Set up lifecycle management
      await this.setupLifecycleManagement();

    } catch (error) {
      console.error('[BACKUP_STORAGE] Failed to initialize Azure Blob Storage:', error);
    }
  }

  /**
   * Setup lifecycle management for cost optimization
   */
  private async setupLifecycleManagement(): Promise<void> {
    try {
      // Note: Lifecycle management rules are typically set at the storage account level
      // This would be configured via ARM template or Azure portal
      console.log('[BACKUP_STORAGE] Lifecycle management should be configured at storage account level');
      console.log(`[BACKUP_STORAGE] Recommended: Delete blobs older than ${this.config.retentionDays} days`);
      
    } catch (error) {
      console.warn('[BACKUP_STORAGE] Could not setup lifecycle management:', error);
    }
  }

  /**
   * Upload backup file to blob storage
   */
  async uploadBackup(
    filePath: string, 
    backupType: BackupMetadata['backupType'], 
    metadata?: Partial<BackupMetadata>
  ): Promise<string | null> {
    if (!this.initialized || !this.containerClient) {
      console.error('[BACKUP_STORAGE] Storage not initialized');
      return null;
    }

    try {
      // Check file size
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > this.config.maxBackupSizeMB) {
        console.error(`[BACKUP_STORAGE] File too large: ${fileSizeMB.toFixed(2)}MB > ${this.config.maxBackupSizeMB}MB`);
        return null;
      }

      // Generate blob name with timestamp and type
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = path.basename(filePath);
      const blobName = `${backupType}/${timestamp}/${fileName}`;

      // Prepare metadata
      const blobMetadata: BackupMetadata = {
        backupType,
        timestamp: new Date().toISOString(),
        size: stats.size,
        version: process.env.npm_package_version || '0.0.3-beta',
        environment: process.env.NODE_ENV || 'production',
        ...metadata
      };

      // Get blob client
      const blobClient = this.containerClient.getBlobClient(blobName);
      const blockBlobClient = blobClient.getBlockBlobClient();

      // Upload with metadata
      await blockBlobClient.uploadFile(filePath, {
        metadata: {
          backupType: blobMetadata.backupType,
          timestamp: blobMetadata.timestamp,
          size: blobMetadata.size.toString(),
          version: blobMetadata.version,
          environment: blobMetadata.environment
        },
        tags: {
          'backup-type': backupType,
          'retention-days': this.config.retentionDays.toString(),
          'automated': 'true'
        }
      });

      console.log(`[BACKUP_STORAGE] Backup uploaded successfully: ${blobName}`);
      console.log(`[BACKUP_STORAGE] Size: ${fileSizeMB.toFixed(2)}MB`);

      return blobName;

    } catch (error) {
      console.error('[BACKUP_STORAGE] Error uploading backup:', error);
      return null;
    }
  }

  /**
   * Upload backup from buffer/stream
   */
  async uploadBackupFromBuffer(
    buffer: Buffer,
    fileName: string,
    backupType: BackupMetadata['backupType'],
    metadata?: Partial<BackupMetadata>
  ): Promise<string | null> {
    if (!this.initialized || !this.containerClient) {
      console.error('[BACKUP_STORAGE] Storage not initialized');
      return null;
    }

    try {
      const fileSizeMB = buffer.length / (1024 * 1024);
      
      if (fileSizeMB > this.config.maxBackupSizeMB) {
        console.error(`[BACKUP_STORAGE] Buffer too large: ${fileSizeMB.toFixed(2)}MB > ${this.config.maxBackupSizeMB}MB`);
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blobName = `${backupType}/${timestamp}/${fileName}`;

      const blobMetadata: BackupMetadata = {
        backupType,
        timestamp: new Date().toISOString(),
        size: buffer.length,
        version: process.env.npm_package_version || '0.0.3-beta',
        environment: process.env.NODE_ENV || 'production',
        ...metadata
      };

      const blobClient = this.containerClient.getBlobClient(blobName);
      const blockBlobClient = blobClient.getBlockBlobClient();

      await blockBlobClient.upload(buffer, buffer.length, {
        metadata: {
          backupType: blobMetadata.backupType,
          timestamp: blobMetadata.timestamp,
          size: blobMetadata.size.toString(),
          version: blobMetadata.version,
          environment: blobMetadata.environment
        },
        tags: {
          'backup-type': backupType,
          'retention-days': this.config.retentionDays.toString(),
          'automated': 'true'
        }
      });

      console.log(`[BACKUP_STORAGE] Buffer backup uploaded: ${blobName}`);
      return blobName;

    } catch (error) {
      console.error('[BACKUP_STORAGE] Error uploading buffer backup:', error);
      return null;
    }
  }

  /**
   * Download backup from blob storage
   */
  async downloadBackup(blobName: string, downloadPath: string): Promise<boolean> {
    if (!this.initialized || !this.containerClient) {
      console.error('[BACKUP_STORAGE] Storage not initialized');
      return false;
    }

    try {
      const blobClient = this.containerClient.getBlobClient(blobName);
      
      // Check if blob exists
      const exists = await blobClient.exists();
      if (!exists) {
        console.error(`[BACKUP_STORAGE] Backup not found: ${blobName}`);
        return false;
      }

      // Download to file
      await blobClient.downloadToFile(downloadPath);
      
      console.log(`[BACKUP_STORAGE] Backup downloaded: ${blobName} -> ${downloadPath}`);
      return true;

    } catch (error) {
      console.error('[BACKUP_STORAGE] Error downloading backup:', error);
      return false;
    }
  }

  /**
   * List available backups
   */
  async listBackups(backupType?: BackupMetadata['backupType'], maxResults: number = 50): Promise<{
    name: string;
    metadata: BackupMetadata;
    lastModified: Date;
    sizeBytes: number;
  }[]> {
    if (!this.initialized || !this.containerClient) {
      console.error('[BACKUP_STORAGE] Storage not initialized');
      return [];
    }

    try {
      const backups: any[] = [];
      const prefix = backupType ? `${backupType}/` : '';

      // List blobs with prefix
      const listOptions = {
        prefix,
        includeMetadata: true,
        includeTags: true
      };

      let count = 0;
      for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
        if (count >= maxResults) break;

        const metadata: BackupMetadata = {
          backupType: (blob.metadata?.backupType as any) || 'unknown',
          timestamp: blob.metadata?.timestamp || '',
          size: parseInt(blob.metadata?.size || '0'),
          version: blob.metadata?.version || '',
          environment: blob.metadata?.environment || ''
        };

        backups.push({
          name: blob.name,
          metadata,
          lastModified: blob.properties.lastModified || new Date(),
          sizeBytes: blob.properties.contentLength || 0
        });

        count++;
      }

      // Sort by last modified (newest first)
      backups.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

      return backups;

    } catch (error) {
      console.error('[BACKUP_STORAGE] Error listing backups:', error);
      return [];
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    if (!this.initialized || !this.containerClient) {
      console.error('[BACKUP_STORAGE] Storage not initialized');
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for await (const blob of this.containerClient.listBlobsFlat({ includeMetadata: true })) {
        const lastModified = blob.properties.lastModified;
        
        if (lastModified && lastModified < cutoffDate) {
          try {
            const blobClient = this.containerClient.getBlobClient(blob.name);
            await blobClient.delete();
            
            console.log(`[BACKUP_STORAGE] Deleted old backup: ${blob.name}`);
            deletedCount++;
            
          } catch (deleteError) {
            console.warn(`[BACKUP_STORAGE] Failed to delete ${blob.name}:`, deleteError);
          }
        }
      }

      console.log(`[BACKUP_STORAGE] Cleanup completed: ${deletedCount} old backups deleted`);
      return deletedCount;

    } catch (error) {
      console.error('[BACKUP_STORAGE] Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalBackups: number;
    totalSizeBytes: number;
    totalSizeMB: number;
    backupsByType: Record<string, number>;
    oldestBackup?: Date;
    newestBackup?: Date;
  }> {
    if (!this.initialized || !this.containerClient) {
      return {
        totalBackups: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        backupsByType: {}
      };
    }

    try {
      let totalBackups = 0;
      let totalSizeBytes = 0;
      const backupsByType: Record<string, number> = {};
      let oldestBackup: Date | undefined;
      let newestBackup: Date | undefined;

      for await (const blob of this.containerClient.listBlobsFlat({ includeMetadata: true })) {
        totalBackups++;
        totalSizeBytes += blob.properties.contentLength || 0;

        const backupType = blob.metadata?.backupType || 'unknown';
        backupsByType[backupType] = (backupsByType[backupType] || 0) + 1;

        const lastModified = blob.properties.lastModified;
        if (lastModified) {
          if (!oldestBackup || lastModified < oldestBackup) {
            oldestBackup = lastModified;
          }
          if (!newestBackup || lastModified > newestBackup) {
            newestBackup = lastModified;
          }
        }
      }

      return {
        totalBackups,
        totalSizeBytes,
        totalSizeMB: totalSizeBytes / (1024 * 1024),
        backupsByType,
        oldestBackup,
        newestBackup
      };

    } catch (error) {
      console.error('[BACKUP_STORAGE] Error getting storage stats:', error);
      return {
        totalBackups: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        backupsByType: {}
      };
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(blobName: string): Promise<boolean> {
    if (!this.initialized || !this.containerClient) {
      return false;
    }

    try {
      const blobClient = this.containerClient.getBlobClient(blobName);
      
      // Check if blob exists and get properties
      const properties = await blobClient.getProperties();
      
      // Basic integrity checks
      const hasValidSize = (properties.contentLength || 0) > 0;
      const hasValidTimestamp = properties.lastModified instanceof Date;
      const hasMetadata = Object.keys(properties.metadata || {}).length > 0;

      const isValid = hasValidSize && hasValidTimestamp && hasMetadata;
      
      if (isValid) {
        console.log(`[BACKUP_STORAGE] Backup verification passed: ${blobName}`);
      } else {
        console.warn(`[BACKUP_STORAGE] Backup verification failed: ${blobName}`);
      }

      return isValid;

    } catch (error) {
      console.error(`[BACKUP_STORAGE] Error verifying backup ${blobName}:`, error);
      return false;
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    initialized: boolean;
    storageStats?: Awaited<ReturnType<typeof this.getStorageStats>>;
    lastError?: string;
  }> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        initialized: false,
        lastError: 'Storage not initialized'
      };
    }

    try {
      const storageStats = await this.getStorageStats();
      
      // Check if we can create a test blob
      const testBlobName = `health-check/${new Date().toISOString()}`;
      const testBuffer = Buffer.from('health-check');
      
      await this.uploadBackupFromBuffer(testBuffer, 'health-check.txt', 'application');
      
      // Clean up test blob
      if (this.containerClient) {
        const testBlobClient = this.containerClient.getBlobClient(testBlobName);
        await testBlobClient.deleteIfExists();
      }

      return {
        status: 'healthy',
        initialized: true,
        storageStats
      };

    } catch (error: any) {
      return {
        status: 'degraded',
        initialized: true,
        lastError: error.message
      };
    }
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Global backup storage instance
export const backupStorage = new AzureBackupStorageManager();

/**
 * Automated backup orchestrator
 */
export class AutomatedBackupOrchestrator {
  private backupStorage: AzureBackupStorageManager;

  constructor(storage: AzureBackupStorageManager) {
    this.backupStorage = storage;
  }

  /**
   * Perform comprehensive backup
   */
  async performBackup(): Promise<{
    success: boolean;
    backups: string[];
    errors: string[];
  }> {
    const results = {
      success: true,
      backups: [] as string[],
      errors: [] as string[]
    };

    console.log('[BACKUP_ORCHESTRATOR] Starting comprehensive backup...');

    // Backup application configuration
    try {
      const configBackup = await this.backupApplicationConfig();
      if (configBackup) {
        results.backups.push(configBackup);
      }
    } catch (error: any) {
      results.errors.push(`Config backup failed: ${error.message}`);
      results.success = false;
    }

    // Backup documentation
    try {
      const docsBackup = await this.backupDocumentation();
      if (docsBackup) {
        results.backups.push(docsBackup);
      }
    } catch (error: any) {
      results.errors.push(`Docs backup failed: ${error.message}`);
    }

    // Backup application logs (if any)
    try {
      const logsBackup = await this.backupLogs();
      if (logsBackup) {
        results.backups.push(logsBackup);
      }
    } catch (error: any) {
      results.errors.push(`Logs backup failed: ${error.message}`);
    }

    console.log(`[BACKUP_ORCHESTRATOR] Backup completed: ${results.backups.length} successful, ${results.errors.length} errors`);
    return results;
  }

  /**
   * Backup application configuration files
   */
  private async backupApplicationConfig(): Promise<string | null> {
    const configFiles = [
      'web.config',
      'next.config.azure.js',
      'package.json',
      'prisma/schema.prisma',
      '.env.azure.example'
    ];

    // Create temporary archive
    const tempDir = '/tmp';
    const archiveName = `config-backup-${Date.now()}.json`;
    const archivePath = path.join(tempDir, archiveName);

    const configData: Record<string, string | null> = {};

    for (const file of configFiles) {
      try {
        if (fs.existsSync(file)) {
          configData[file] = fs.readFileSync(file, 'utf8');
        }
      } catch (error) {
        console.warn(`[BACKUP_ORCHESTRATOR] Could not read ${file}:`, error);
        configData[file] = null;
      }
    }

    // Write config data to file
    fs.writeFileSync(archivePath, JSON.stringify(configData, null, 2));

    // Upload to blob storage
    const blobName = await this.backupStorage.uploadBackup(archivePath, 'configuration');

    // Clean up temp file
    fs.unlinkSync(archivePath);

    return blobName;
  }

  /**
   * Backup documentation
   */
  private async backupDocumentation(): Promise<string | null> {
    const docsData: Record<string, string | null> = {};
    const docsPaths = ['docs/', 'Docs/', 'CLAUDE.md', 'README.md'];

    for (const docsPath of docsPaths) {
      try {
        if (fs.existsSync(docsPath)) {
          if (fs.lstatSync(docsPath).isDirectory()) {
            // Read directory contents
            const files = this.readDirectoryRecursive(docsPath);
            Object.assign(docsData, files);
          } else {
            // Single file
            docsData[docsPath] = fs.readFileSync(docsPath, 'utf8');
          }
        }
      } catch (error) {
        console.warn(`[BACKUP_ORCHESTRATOR] Could not read ${docsPath}:`, error);
      }
    }

    if (Object.keys(docsData).length === 0) {
      console.log('[BACKUP_ORCHESTRATOR] No documentation found to backup');
      return null;
    }

    // Create backup file
    const tempDir = '/tmp';
    const backupName = `docs-backup-${Date.now()}.json`;
    const backupPath = path.join(tempDir, backupName);

    fs.writeFileSync(backupPath, JSON.stringify(docsData, null, 2));

    // Upload to blob storage
    const blobName = await this.backupStorage.uploadBackup(backupPath, 'application');

    // Clean up temp file
    fs.unlinkSync(backupPath);

    return blobName;
  }

  /**
   * Backup application logs
   */
  private async backupLogs(): Promise<string | null> {
    // For now, just create a simple log summary
    const logData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: process.env.npm_package_version || '0.0.3-beta',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    const logBuffer = Buffer.from(JSON.stringify(logData, null, 2));
    const fileName = `system-log-${Date.now()}.json`;

    return await this.backupStorage.uploadBackupFromBuffer(logBuffer, fileName, 'logs');
  }

  /**
   * Read directory contents recursively
   */
  private readDirectoryRecursive(dirPath: string): Record<string, string> {
    const files: Record<string, string> = {};

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.lstatSync(itemPath);

        if (stat.isDirectory()) {
          // Recursively read subdirectory
          const subFiles = this.readDirectoryRecursive(itemPath);
          Object.assign(files, subFiles);
        } else if (stat.isFile()) {
          // Read file content
          try {
            files[itemPath] = fs.readFileSync(itemPath, 'utf8');
          } catch (error) {
            console.warn(`[BACKUP_ORCHESTRATOR] Could not read file ${itemPath}:`, error);
            files[itemPath] = `Error reading file: ${error}`;
          }
        }
      }
    } catch (error) {
      console.warn(`[BACKUP_ORCHESTRATOR] Could not read directory ${dirPath}:`, error);
    }

    return files;
  }
}

// Global backup orchestrator
export const backupOrchestrator = new AutomatedBackupOrchestrator(backupStorage);