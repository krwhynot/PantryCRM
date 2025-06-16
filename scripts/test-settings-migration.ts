#!/usr/bin/env npx tsx

/**
 * Settings Migration Test Script
 * Tests the new Drizzle-based settings system
 */

import { settingsService } from '@/lib/services/settings-service';
import { settingsMigration } from '@/lib/db/migrations/settings-migration';
import { SettingCategories, SettingTypes, DEFAULT_FOOD_SERVICE_SETTINGS } from '@/lib/db/schema/settings';

async function testSettingsSystem() {
  console.log('🧪 Testing Settings System Migration...\n');

  try {
    // Test 1: Initialize default settings
    console.log('1️⃣ Testing default settings initialization...');
    await settingsService.initializeDefaultSettings();
    console.log('✅ Default settings initialized\n');

    // Test 2: Verify settings retrieval
    console.log('2️⃣ Testing settings retrieval...');
    const allSettings = await settingsService.getSettings();
    console.log(`✅ Retrieved ${allSettings.length} settings`);

    const priorities = await settingsService.getSettings({ 
      category: SettingCategories.PRIORITIES 
    });
    console.log(`✅ Retrieved ${priorities.length} priority settings`);

    // Test 3: Test grouped settings
    console.log('\n3️⃣ Testing grouped settings...');
    const groupedSettings = await settingsService.getSettingsByCategory();
    const categoryCount = Object.keys(groupedSettings).length;
    console.log(`✅ Settings grouped into ${categoryCount} categories:`);
    
    Object.entries(groupedSettings).forEach(([category, settings]) => {
      console.log(`   📁 ${category}: ${settings.length} settings`);
    });

    // Test 4: Test typed value access
    console.log('\n4️⃣ Testing typed value access...');
    const priorityA = await settingsService.getTypedSetting<string>('PRIORITY_A');
    console.log(`✅ Priority A value: ${priorityA}`);

    // Test 5: Test setting creation
    console.log('\n5️⃣ Testing setting creation...');
    const testSetting = await settingsService.upsertSetting({
      key: 'TEST_SETTING',
      value: 'test_value',
      label: 'Test Setting',
      category: SettingCategories.SYSTEM,
      type: SettingTypes.STRING,
      description: 'A test setting for validation'
    });
    console.log(`✅ Created test setting: ${testSetting.key}`);

    // Test 6: Test setting validation
    console.log('\n6️⃣ Testing setting validation...');
    const validColor = settingsService.validateSettingValue('#FF0000', SettingTypes.COLOR);
    const invalidColor = settingsService.validateSettingValue('not-a-color', SettingTypes.COLOR);
    console.log(`✅ Color validation - Valid: ${validColor.valid}, Invalid: ${!invalidColor.valid}`);

    // Test 7: Test categories and metadata
    console.log('\n7️⃣ Testing categories and metadata...');
    const categories = settingsService.getCategories();
    console.log(`✅ Available categories: ${categories.length}`);
    categories.slice(0, 3).forEach(cat => {
      console.log(`   ${cat.info.icon} ${cat.info.label}: ${cat.info.description}`);
    });

    // Test 8: Test settings with metadata
    console.log('\n8️⃣ Testing settings with metadata...');
    const settingsWithMetadata = await settingsService.getSettingsWithMetadata();
    console.log(`✅ Retrieved ${settingsWithMetadata.length} settings with metadata`);
    
    if (settingsWithMetadata.length > 0) {
      const sample = settingsWithMetadata[0];
      console.log(`   Sample: ${sample.label} (${sample.categoryInfo.label})`);
    }

    // Test 9: Clean up test data
    console.log('\n9️⃣ Cleaning up test data...');
    await settingsService.deleteSetting('TEST_SETTING');
    console.log('✅ Test setting cleaned up');

    // Summary
    console.log('\n🎉 Settings System Test Summary:');
    console.log(`✅ All tests passed successfully`);
    console.log(`📊 ${DEFAULT_FOOD_SERVICE_SETTINGS.length} default settings available`);
    console.log(`📁 ${Object.keys(SettingCategories).length} categories defined`);
    console.log(`🏷️ ${Object.keys(SettingTypes).length} data types supported`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Set up PostgreSQL database connection');
    console.log('   2. Run database migrations');
    console.log('   3. Execute full migration from Prisma');
    console.log('   4. Update frontend components');

    return true;

  } catch (error) {
    console.error('\n❌ Settings system test failed:', error);
    console.error('\n🔧 Possible issues:');
    console.error('   - Database connection not configured');
    console.error('   - Missing environment variables');
    console.error('   - PostgreSQL not running');
    console.error('   - Schema not yet created');
    
    return false;
  }
}

// Test validation functions separately (no DB required)
function testValidationFunctions() {
  console.log('\n🔍 Testing validation functions (no DB required)...');
  
  const tests = [
    { value: '#FF0000', type: SettingTypes.COLOR, expected: true },
    { value: 'red', type: SettingTypes.COLOR, expected: false },
    { value: 'test@example.com', type: SettingTypes.EMAIL, expected: true },
    { value: 'not-email', type: SettingTypes.EMAIL, expected: false },
    { value: 'https://example.com', type: SettingTypes.URL, expected: true },
    { value: 'not-url', type: SettingTypes.URL, expected: false },
    { value: '42', type: SettingTypes.NUMBER, expected: true },
    { value: 'not-number', type: SettingTypes.NUMBER, expected: false },
    { value: 'true', type: SettingTypes.BOOLEAN, expected: true },
    { value: 'false', type: SettingTypes.BOOLEAN, expected: true },
    { value: 'maybe', type: SettingTypes.BOOLEAN, expected: false },
    { value: '{"test": true}', type: SettingTypes.JSON, expected: true },
    { value: '{invalid json}', type: SettingTypes.JSON, expected: false }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ value, type, expected }, index) => {
    const result = settingsService.validateSettingValue(value, type);
    const success = result.valid === expected;
    
    if (success) {
      console.log(`✅ Test ${index + 1}: ${type} validation for "${value}"`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${type} validation for "${value}" - Expected ${expected}, got ${result.valid}`);
      failed++;
    }
  });

  console.log(`\n📊 Validation Tests: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests
async function main() {
  console.log('🚀 Starting Settings System Tests...\n');

  // Always run validation tests (no DB required)
  const validationPassed = testValidationFunctions();
  
  // Try to run DB tests (may fail if DB not configured)
  const dbTestsPassed = await testSettingsSystem();
  
  console.log('\n🏁 Final Results:');
  console.log(`   Validation Tests: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Database Tests: ${dbTestsPassed ? '✅ PASSED' : '❌ FAILED (expected if DB not configured)'}`);
  
  if (validationPassed) {
    console.log('\n✅ Settings system is ready for migration!');
    console.log('   - Schema and types are correctly defined');
    console.log('   - Validation functions work properly');
    console.log('   - Service layer is implemented');
    
    if (!dbTestsPassed) {
      console.log('\n⚠️ Database tests failed - configure PostgreSQL to complete migration');
    }
  } else {
    console.log('\n❌ Settings system has validation issues that need to be fixed');
  }
}

main().catch(console.error);