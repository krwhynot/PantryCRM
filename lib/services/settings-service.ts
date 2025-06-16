/**
 * Settings Service Layer for Drizzle ORM
 * Provides typed CRUD operations for system settings
 */

import { eq, and, desc, asc, like, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  systemSettings, 
  SystemSetting, 
  NewSystemSetting, 
  UpdateSystemSetting,
  TypedSetting,
  SettingCategory,
  SettingType,
  SettingCategories,
  SettingTypes,
  SETTING_CATEGORY_INFO,
  DEFAULT_FOOD_SERVICE_SETTINGS
} from '@/lib/db/schema/settings';

export class SettingsService {
  
  /**
   * Get all settings with optional filtering
   */
  async getSettings(options?: {
    category?: SettingCategory;
    active?: boolean;
    type?: SettingType;
    searchTerm?: string;
  }): Promise<SystemSetting[]> {
    let query = db.select().from(systemSettings);
    
    const conditions = [];
    
    if (options?.category) {
      conditions.push(eq(systemSettings.category, options.category));
    }
    
    if (options?.active !== undefined) {
      conditions.push(eq(systemSettings.active, options.active));
    }
    
    if (options?.type) {
      conditions.push(eq(systemSettings.type, options.type));
    }
    
    if (options?.searchTerm) {
      conditions.push(
        like(systemSettings.label, `%${options.searchTerm}%`)
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(asc(systemSettings.category), asc(systemSettings.sortOrder))
      .execute();
  }

  /**
   * Get settings grouped by category
   */
  async getSettingsByCategory(activeOnly: boolean = true): Promise<Record<string, SystemSetting[]>> {
    const settings = await this.getSettings({ active: activeOnly });
    
    const grouped: Record<string, SystemSetting[]> = {};
    
    settings.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });
    
    return grouped;
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<SystemSetting | null> {
    const results = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1)
      .execute();
    
    return results[0] || null;
  }

  /**
   * Get typed setting value with parsing
   */
  async getTypedSetting<T = any>(key: string): Promise<T | null> {
    const setting = await this.getSetting(key);
    if (!setting) return null;
    
    return this.parseSettingValue<T>(setting);
  }

  /**
   * Create or update a setting (upsert)
   */
  async upsertSetting(settingData: NewSystemSetting): Promise<SystemSetting> {
    const existing = await this.getSetting(settingData.key);
    
    if (existing) {
      // Update existing setting
      const updated = await db
        .update(systemSettings)
        .set({
          ...settingData,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.key, settingData.key))
        .returning()
        .execute();
      
      return updated[0];
    } else {
      // Create new setting
      const created = await db
        .insert(systemSettings)
        .values(settingData)
        .returning()
        .execute();
      
      return created[0];
    }
  }

  /**
   * Update an existing setting
   */
  async updateSetting(key: string, updates: UpdateSystemSetting): Promise<SystemSetting | null> {
    const updated = await db
      .update(systemSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(systemSettings.key, key))
      .returning()
      .execute();
    
    return updated[0] || null;
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string): Promise<boolean> {
    const deleted = await db
      .delete(systemSettings)
      .where(eq(systemSettings.key, key))
      .returning()
      .execute();
    
    return deleted.length > 0;
  }

  /**
   * Soft delete (set active = false)
   */
  async deactivateSetting(key: string): Promise<boolean> {
    const updated = await this.updateSetting(key, { active: false });
    return updated !== null;
  }

  /**
   * Set a typed value for a setting
   */
  async setTypedValue<T>(key: string, value: T, type: SettingType): Promise<SystemSetting> {
    const serializedValue = this.serializeValue(value, type);
    
    return await this.upsertSetting({
      key,
      value: serializedValue,
      type,
      label: key, // Default label, should be provided
      category: SettingCategories.SYSTEM // Default category
    });
  }

  /**
   * Get all categories with their metadata
   */
  getCategories(): Array<{ key: SettingCategory; info: typeof SETTING_CATEGORY_INFO[SettingCategory] }> {
    return Object.entries(SETTING_CATEGORY_INFO).map(([key, info]) => ({
      key: key as SettingCategory,
      info
    }));
  }

  /**
   * Initialize default food service settings
   */
  async initializeDefaultSettings(): Promise<void> {
    console.log('🔧 Initializing default food service settings...');
    
    for (const settingData of DEFAULT_FOOD_SERVICE_SETTINGS) {
      try {
        await this.upsertSetting(settingData);
      } catch (error) {
        console.error(`Failed to initialize setting ${settingData.key}:`, error);
      }
    }
    
    console.log(`✅ Initialized ${DEFAULT_FOOD_SERVICE_SETTINGS.length} default settings`);
  }

  /**
   * Validate setting value based on type
   */
  validateSettingValue(value: string, type: SettingType): { valid: boolean; error?: string } {
    switch (type) {
      case SettingTypes.NUMBER:
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Must be a valid number' };
        }
        break;
        
      case SettingTypes.BOOLEAN:
        if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
          return { valid: false, error: 'Must be true/false or 1/0' };
        }
        break;
        
      case SettingTypes.JSON:
        try {
          JSON.parse(value);
        } catch {
          return { valid: false, error: 'Must be valid JSON' };
        }
        break;
        
      case SettingTypes.COLOR:
        if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return { valid: false, error: 'Must be a valid hex color (e.g., #FF0000)' };
        }
        break;
        
      case SettingTypes.EMAIL:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, error: 'Must be a valid email address' };
        }
        break;
        
      case SettingTypes.URL:
        try {
          new URL(value);
        } catch {
          return { valid: false, error: 'Must be a valid URL' };
        }
        break;
    }
    
    return { valid: true };
  }

  /**
   * Parse setting value based on type
   */
  private parseSettingValue<T>(setting: SystemSetting): T {
    switch (setting.type) {
      case SettingTypes.NUMBER:
        return Number(setting.value) as T;
        
      case SettingTypes.BOOLEAN:
        return (['true', '1'].includes(setting.value.toLowerCase())) as T;
        
      case SettingTypes.JSON:
        try {
          return JSON.parse(setting.value) as T;
        } catch {
          return setting.value as T;
        }
        
      default:
        return setting.value as T;
    }
  }

  /**
   * Serialize value for storage
   */
  private serializeValue<T>(value: T, type: SettingType): string {
    switch (type) {
      case SettingTypes.JSON:
        return JSON.stringify(value);
        
      case SettingTypes.BOOLEAN:
        return Boolean(value).toString();
        
      case SettingTypes.NUMBER:
        return Number(value).toString();
        
      default:
        return String(value);
    }
  }

  /**
   * Bulk update multiple settings
   */
  async bulkUpdateSettings(updates: Array<{ key: string; updates: UpdateSystemSetting }>): Promise<SystemSetting[]> {
    const results: SystemSetting[] = [];
    
    for (const { key, updates } of updates) {
      try {
        const updated = await this.updateSetting(key, updates);
        if (updated) {
          results.push(updated);
        }
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Export settings for backup or migration
   */
  async exportSettings(): Promise<SystemSetting[]> {
    return await this.getSettings();
  }

  /**
   * Import settings from backup or migration
   */
  async importSettings(settings: NewSystemSetting[]): Promise<void> {
    console.log(`🔄 Importing ${settings.length} settings...`);
    
    for (const setting of settings) {
      try {
        await this.upsertSetting(setting);
      } catch (error) {
        console.error(`Failed to import setting ${setting.key}:`, error);
      }
    }
    
    console.log('✅ Settings import completed');
  }

  /**
   * Get settings for API response (with category info)
   */
  async getSettingsWithMetadata(): Promise<Array<TypedSetting & { categoryInfo: typeof SETTING_CATEGORY_INFO[SettingCategory] }>> {
    const settings = await this.getSettings({ active: true });
    
    return settings.map(setting => ({
      ...setting,
      parsedValue: this.parseSettingValue(setting),
      categoryInfo: SETTING_CATEGORY_INFO[setting.category as SettingCategory]
    }));
  }
}

// Singleton instance
export const settingsService = new SettingsService();