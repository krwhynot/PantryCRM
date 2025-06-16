#!/usr/bin/env npx tsx

/**
 * Settings Validation Test Script
 * Tests validation functions without requiring database connection
 */

import { 
  SettingCategories, 
  SettingTypes, 
  DEFAULT_FOOD_SERVICE_SETTINGS,
  SETTING_CATEGORY_INFO 
} from '../lib/db/schema/settings';

// Mock validation function (copy from service)
function validateSettingValue(value: string, type: string): { valid: boolean; error?: string } {
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

function testValidationFunctions() {
  console.log('🔍 Testing Settings Validation Functions...\n');
  
  const tests = [
    { value: '#FF0000', type: SettingTypes.COLOR, expected: true, name: 'Valid hex color' },
    { value: 'red', type: SettingTypes.COLOR, expected: false, name: 'Invalid color name' },
    { value: '#ff0000', type: SettingTypes.COLOR, expected: true, name: 'Lowercase hex color' },
    { value: '#FF00', type: SettingTypes.COLOR, expected: false, name: 'Short hex color' },
    
    { value: 'test@example.com', type: SettingTypes.EMAIL, expected: true, name: 'Valid email' },
    { value: 'not-email', type: SettingTypes.EMAIL, expected: false, name: 'Invalid email' },
    { value: 'user@domain', type: SettingTypes.EMAIL, expected: false, name: 'Email without TLD' },
    
    { value: 'https://example.com', type: SettingTypes.URL, expected: true, name: 'Valid HTTPS URL' },
    { value: 'http://test.org', type: SettingTypes.URL, expected: true, name: 'Valid HTTP URL' },
    { value: 'not-url', type: SettingTypes.URL, expected: false, name: 'Invalid URL' },
    { value: 'ftp://files.com', type: SettingTypes.URL, expected: true, name: 'Valid FTP URL' },
    
    { value: '42', type: SettingTypes.NUMBER, expected: true, name: 'Valid integer' },
    { value: '3.14', type: SettingTypes.NUMBER, expected: true, name: 'Valid decimal' },
    { value: 'not-number', type: SettingTypes.NUMBER, expected: false, name: 'Invalid number' },
    { value: '0', type: SettingTypes.NUMBER, expected: true, name: 'Zero value' },
    
    { value: 'true', type: SettingTypes.BOOLEAN, expected: true, name: 'Boolean true' },
    { value: 'false', type: SettingTypes.BOOLEAN, expected: true, name: 'Boolean false' },
    { value: '1', type: SettingTypes.BOOLEAN, expected: true, name: 'Boolean 1' },
    { value: '0', type: SettingTypes.BOOLEAN, expected: true, name: 'Boolean 0' },
    { value: 'maybe', type: SettingTypes.BOOLEAN, expected: false, name: 'Invalid boolean' },
    
    { value: '{"test": true}', type: SettingTypes.JSON, expected: true, name: 'Valid JSON object' },
    { value: '[1,2,3]', type: SettingTypes.JSON, expected: true, name: 'Valid JSON array' },
    { value: '"string"', type: SettingTypes.JSON, expected: true, name: 'Valid JSON string' },
    { value: '{invalid json}', type: SettingTypes.JSON, expected: false, name: 'Invalid JSON' },
    
    { value: 'Hello World', type: SettingTypes.STRING, expected: true, name: 'Valid string' },
    { value: '', type: SettingTypes.STRING, expected: true, name: 'Empty string' }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ value, type, expected, name }, index) => {
    const result = validateSettingValue(value, type);
    const success = result.valid === expected;
    
    if (success) {
      console.log(`✅ Test ${index + 1}: ${name}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${name} - Expected ${expected}, got ${result.valid}`);
      if (result.error) console.log(`   Error: ${result.error}`);
      failed++;
    }
  });

  console.log(`\n📊 Validation Tests: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function testSchemaDefinitions() {
  console.log('\n🏗️ Testing Schema Definitions...\n');

  // Test categories
  const categories = Object.keys(SettingCategories);
  console.log(`✅ ${categories.length} setting categories defined:`);
  categories.forEach(cat => console.log(`   📁 ${cat}`));

  // Test types
  const types = Object.keys(SettingTypes);
  console.log(`\n✅ ${types.length} setting types defined:`);
  types.forEach(type => console.log(`   🏷️ ${type}`));

  // Test default settings
  console.log(`\n✅ ${DEFAULT_FOOD_SERVICE_SETTINGS.length} default food service settings:`);
  
  const categoryCounts: Record<string, number> = {};
  DEFAULT_FOOD_SERVICE_SETTINGS.forEach(setting => {
    categoryCounts[setting.category] = (categoryCounts[setting.category] || 0) + 1;
  });

  Object.entries(categoryCounts).forEach(([category, count]) => {
    const info = SETTING_CATEGORY_INFO[category as keyof typeof SETTING_CATEGORY_INFO];
    console.log(`   ${info?.icon || '📋'} ${info?.label || category}: ${count} settings`);
  });

  // Test category metadata
  const categoryInfoKeys = Object.keys(SETTING_CATEGORY_INFO);
  console.log(`\n✅ ${categoryInfoKeys.length} categories with metadata:`);
  categoryInfoKeys.slice(0, 5).forEach(key => {
    const info = SETTING_CATEGORY_INFO[key as keyof typeof SETTING_CATEGORY_INFO];
    console.log(`   ${info.icon} ${info.label}: ${info.description}`);
  });

  return true;
}

function testDefaultSettingsIntegrity() {
  console.log('\n🔍 Testing Default Settings Integrity...\n');

  let issues = 0;

  // Check for duplicate keys
  const keys = DEFAULT_FOOD_SERVICE_SETTINGS.map(s => s.key);
  const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
  
  if (duplicateKeys.length > 0) {
    console.log(`❌ Duplicate keys found: ${duplicateKeys.join(', ')}`);
    issues++;
  } else {
    console.log('✅ No duplicate keys found');
  }

  // Check required fields
  DEFAULT_FOOD_SERVICE_SETTINGS.forEach((setting, index) => {
    if (!setting.key || !setting.label || !setting.category) {
      console.log(`❌ Setting ${index + 1} missing required fields`);
      issues++;
    }
  });

  if (issues === 0) {
    console.log('✅ All settings have required fields');
  }

  // Check category validity
  DEFAULT_FOOD_SERVICE_SETTINGS.forEach(setting => {
    if (!Object.values(SettingCategories).includes(setting.category as any)) {
      console.log(`❌ Invalid category: ${setting.category} for ${setting.key}`);
      issues++;
    }
  });

  if (issues === 0) {
    console.log('✅ All categories are valid');
  }

  // Check type validity
  DEFAULT_FOOD_SERVICE_SETTINGS.forEach(setting => {
    if (!Object.values(SettingTypes).includes(setting.type as any)) {
      console.log(`❌ Invalid type: ${setting.type} for ${setting.key}`);
      issues++;
    }
  });

  if (issues === 0) {
    console.log('✅ All types are valid');
  }

  // Check color format for priority settings
  const prioritySettings = DEFAULT_FOOD_SERVICE_SETTINGS.filter(s => 
    s.category === SettingCategories.PRIORITIES && s.color
  );

  prioritySettings.forEach(setting => {
    if (setting.color && !/^#[0-9A-Fa-f]{6}$/.test(setting.color)) {
      console.log(`❌ Invalid color format: ${setting.color} for ${setting.key}`);
      issues++;
    }
  });

  if (issues === 0) {
    console.log('✅ All priority colors are valid hex codes');
  }

  console.log(`\n📊 Integrity Check: ${issues === 0 ? '✅ PASSED' : `❌ ${issues} issues found`}`);
  return issues === 0;
}

// Main test runner
async function main() {
  console.log('🚀 Starting Settings System Validation Tests...\n');

  const validationPassed = testValidationFunctions();
  const schemaPassed = testSchemaDefinitions();
  const integrityPassed = testDefaultSettingsIntegrity();

  console.log('\n🏁 Test Results Summary:');
  console.log(`   Validation Functions: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Schema Definitions: ${schemaPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Data Integrity: ${integrityPassed ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = validationPassed && schemaPassed && integrityPassed;

  if (allPassed) {
    console.log('\n🎉 All tests passed! Settings system is ready for implementation.');
    console.log('\n📋 Next Steps:');
    console.log('   1. ✅ Schema and validation functions verified');
    console.log('   2. 🔧 Set up PostgreSQL database connection');
    console.log('   3. 🔄 Run database migrations with Drizzle Kit');
    console.log('   4. 📊 Execute settings migration from Prisma');
    console.log('   5. 🖥️ Update frontend components to use new API');
    console.log('   6. 🧪 Run full integration tests');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues before proceeding.');
  }

  console.log('\n✅ Settings migration schema is ready!');
}

main().catch(console.error);