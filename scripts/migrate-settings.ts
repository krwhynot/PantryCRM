/**
 * Settings Migration Script
 * Migrates settings data from Prisma to Drizzle PostgreSQL
 */

import { db } from '../lib/db/index';
import { systemSettings, DEFAULT_FOOD_SERVICE_SETTINGS } from '../lib/db/schema/settings';

async function migrateSettings() {
  console.log('🚀 Starting Settings Migration to PostgreSQL...\n');

  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const connectionTest = await db.select().from(systemSettings).limit(1);
    console.log('✅ Database connection successful\n');

    // Check if settings already exist
    console.log('🔍 Checking for existing settings...');
    const existingSettings = await db.select().from(systemSettings);
    
    if (existingSettings.length > 0) {
      console.log(`⚠️  Found ${existingSettings.length} existing settings`);
      console.log('   Migration will update existing and add new settings\n');
    } else {
      console.log('✅ No existing settings found - clean migration\n');
    }

    // Insert/update default settings
    console.log('📊 Migrating default settings...');
    
    for (const setting of DEFAULT_FOOD_SERVICE_SETTINGS) {
      try {
        // Try to insert, update if exists
        await db.insert(systemSettings)
          .values(setting)
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value: setting.value,
              label: setting.label,
              category: setting.category,
              type: setting.type,
              sortOrder: setting.sortOrder,
              color: setting.color,
              active: setting.active,
              description: setting.description,
              updatedAt: new Date(),
            }
          });
        
        console.log(`✅ Migrated: ${setting.key} (${setting.category})`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${setting.key}:`, error);
      }
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const finalSettings = await db.select().from(systemSettings);
    console.log(`✅ Total settings in database: ${finalSettings.length}`);

    // Show summary by category
    const categoryCounts = finalSettings.reduce((acc, setting) => {
      acc[setting.category] = (acc[setting.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Settings by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   📁 ${category}: ${count} settings`);
    });

    console.log('\n🎉 Settings migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test API endpoints with new PostgreSQL data');
    console.log('   2. Update frontend components if needed');
    console.log('   3. Run integration tests');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSettings };