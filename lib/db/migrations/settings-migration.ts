/**
 * Settings Migration Script
 * Migrates from Prisma SystemSetting to Drizzle unified settings schema
 */

import { prismadb } from '@/lib/prisma';
import { settingsService } from '@/lib/services/settings-service';
import { SettingCategories, SettingTypes, DEFAULT_FOOD_SERVICE_SETTINGS } from '@/lib/db/schema/settings';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  duration: number;
}

export class SettingsMigrationService {
  
  /**
   * Migrate settings from Prisma to Drizzle
   */
  async migrateFromPrisma(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('🔄 Starting settings migration from Prisma to Drizzle...');

      // 1. Fetch all existing SystemSettings from Prisma
      const existingSettings = await prismadb.systemSetting.findMany({
        orderBy: [
          { createdAt: 'asc' }
        ]
      });

      console.log(`📊 Found ${existingSettings.length} existing settings to migrate`);

      // 2. Initialize default food service settings first
      console.log('🍽️ Initializing default food service settings...');
      await settingsService.initializeDefaultSettings();

      // 3. Migrate existing settings
      for (const setting of existingSettings) {
        try {
          // Check if setting already exists (by key)
          const existing = await settingsService.getSetting(setting.key);
          
          if (existing) {
            console.log(`⏭️ Skipping existing setting: ${setting.key}`);
            result.skippedCount++;
            continue;
          }

          // Transform Prisma setting to Drizzle format
          const migratedSetting = await settingsService.upsertSetting({
            key: setting.key,
            value: setting.value,
            label: this.generateLabelFromKey(setting.key),
            category: this.mapToCategory(setting.key),
            type: this.mapToType(setting.type, setting.value),
            sortOrder: 0, // Will be updated later
            color: undefined, // Will be set for priorities
            description: undefined,
            active: true,
            // Preserve timestamps
            createdAt: setting.createdAt,
            updatedAt: setting.updatedAt
          });

          console.log(`✅ Migrated setting: ${setting.key} -> ${migratedSetting.category}`);
          result.migratedCount++;

        } catch (error) {
          const errorMsg = `Failed to migrate setting ${setting.key}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
          result.errorCount++;
        }
      }

      // 4. Update sort orders for migrated settings
      await this.updateSortOrders();

      // 5. Set colors for priority settings
      await this.setPriorityColors();

      result.success = result.errorCount === 0;
      result.duration = Date.now() - startTime;

      console.log('\n📊 Migration Summary:');
      console.log(`✅ Migrated: ${result.migratedCount} settings`);
      console.log(`⏭️ Skipped: ${result.skippedCount} settings`);
      console.log(`❌ Errors: ${result.errorCount} settings`);
      console.log(`⏱️ Duration: ${result.duration}ms`);

      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }

      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`💥 ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Validate migration integrity
   */
  async validateMigration(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check that all default settings exist
      for (const defaultSetting of DEFAULT_FOOD_SERVICE_SETTINGS) {
        const existing = await settingsService.getSetting(defaultSetting.key);
        if (!existing) {
          issues.push(`Missing default setting: ${defaultSetting.key}`);
        }
      }

      // Check that priority settings have colors
      const priorities = await settingsService.getSettings({ 
        category: SettingCategories.PRIORITIES 
      });
      
      for (const priority of priorities) {
        if (!priority.color) {
          issues.push(`Priority setting ${priority.key} missing color`);
        }
      }

      // Check category distribution
      const categories = await settingsService.getSettingsByCategory();
      const emptyCategoriesCount = Object.keys(SettingCategories).length - Object.keys(categories).length;
      
      if (emptyCategoriesCount > 3) { // Allow some categories to be empty
        issues.push(`Too many empty categories: ${emptyCategoriesCount}`);
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      issues.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, issues };
    }
  }

  /**
   * Rollback migration (restore from Prisma backup)
   */
  async rollbackMigration(): Promise<boolean> {
    try {
      console.log('🔄 Rolling back settings migration...');

      // Get all settings from Drizzle
      const allSettings = await settingsService.exportSettings();
      
      console.log(`📊 Found ${allSettings.length} settings to remove`);

      // Remove all migrated settings (keep only defaults)
      for (const setting of allSettings) {
        const isDefault = DEFAULT_FOOD_SERVICE_SETTINGS.some(def => def.key === setting.key);
        if (!isDefault) {
          await settingsService.deleteSetting(setting.key);
          console.log(`🗑️ Removed migrated setting: ${setting.key}`);
        }
      }

      console.log('✅ Migration rollback completed');
      return true;

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  // Helper methods

  private generateLabelFromKey(key: string): string {
    // Convert KEY_FORMAT to "Key Format"
    return key
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private mapToCategory(key: string): string {
    // Map setting keys to categories based on prefixes
    if (key.startsWith('PRIORITY_')) return SettingCategories.PRIORITIES;
    if (key.startsWith('MARKET_')) return SettingCategories.MARKET_SEGMENTS;
    if (key.startsWith('DISTRIBUTOR_')) return SettingCategories.DISTRIBUTORS;
    if (key.startsWith('ROLE_')) return SettingCategories.CONTACT_ROLES;
    if (key.startsWith('INTERACTION_')) return SettingCategories.INTERACTION_TYPES;
    if (key.startsWith('PRINCIPAL_')) return SettingCategories.PRINCIPALS;
    if (key.startsWith('UI_')) return SettingCategories.UI;
    if (key.startsWith('SECURITY_')) return SettingCategories.SECURITY;
    if (key.startsWith('PERFORMANCE_')) return SettingCategories.PERFORMANCE;
    
    return SettingCategories.SYSTEM; // Default category
  }

  private mapToType(prismaType: string, value: string): string {
    // Map Prisma types to Drizzle types
    switch (prismaType.toLowerCase()) {
      case 'number':
        return SettingTypes.NUMBER;
      case 'boolean':
        return SettingTypes.BOOLEAN;
      case 'json':
        return SettingTypes.JSON;
      default:
        // Try to infer type from value
        if (value.match(/^#[0-9A-Fa-f]{6}$/)) return SettingTypes.COLOR;
        if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return SettingTypes.EMAIL;
        if (value.match(/^https?:\/\//)) return SettingTypes.URL;
        return SettingTypes.STRING;
    }
  }

  private async updateSortOrders(): Promise<void> {
    console.log('🔢 Updating sort orders for migrated settings...');

    // Update sort orders within each category
    const categories = await settingsService.getSettingsByCategory();
    
    for (const [categoryKey, settings] of Object.entries(categories)) {
      for (let i = 0; i < settings.length; i++) {
        await settingsService.updateSetting(settings[i].key, {
          sortOrder: i + 1
        });
      }
    }
  }

  private async setPriorityColors(): Promise<void> {
    console.log('🎨 Setting colors for priority settings...');

    const priorityColors = {
      'PRIORITY_A': '#ef4444', // Red
      'PRIORITY_B': '#f97316', // Orange  
      'PRIORITY_C': '#eab308', // Yellow
      'PRIORITY_D': '#22c55e'  // Green
    };

    for (const [key, color] of Object.entries(priorityColors)) {
      await settingsService.updateSetting(key, { color });
    }
  }
}

// Singleton instance
export const settingsMigration = new SettingsMigrationService();