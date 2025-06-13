import { PrismaClient } from '@prisma/client';
import { MigrationExecutor } from './migration-executor';
import { fieldMappingConfig, validateRow, transformRow } from './field-mapping-config';
import * as XLSX from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function testFieldMappings() {
  console.log('🧪 Testing field mappings...\n');
  
  // Test data samples
  const testData = {
    Organizations: {
      'ORGANIZATIONS': 'Test Company Inc',
      'PRIORITY-FOCUS (A-D) A-highest \r\n(DropDown)': 'B',
      'SEGMENT\r\n(DROPDOWN)': 'Technology',
      'PHONE': '(555) 123-4567',
      'CITY': 'San Francisco',
      'STATE\r\n(DROPDOWN)': 'ca',
      'ZIP CODE': '94105'
    },
    Contacts: {
      'FULL NAME (FIRST, LAST)': 'John, Doe',
      'Organizations (DropDown)': 'Test Company Inc',
      'EMAIL': 'JOHN.DOE@TEST.COM',
      'PHONE': '555-987-6543'
    }
  };

  for (const [entity, data] of Object.entries(testData)) {
    console.log(`Testing ${entity}:`);
    
    // Validate
    const validation = validateRow(entity, data);
    console.log(`  Validation: ${validation.isValid ? '✅' : '❌'}`);
    if (!validation.isValid) {
      console.log(`  Errors: ${validation.errors.join(', ')}`);
    }
    
    // Transform
    const transformed = transformRow(entity, data);
    console.log('  Transformed:', JSON.stringify(transformed, null, 2));
    console.log('');
  }
}

async function testSampleMigration() {
  console.log('🚀 Testing sample migration...\n');
  
  try {
    // Read Excel file
    const excelPath = path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    // Test with first 5 rows of Organizations
    const orgSheet = workbook.Sheets['Organizations'];
    if (!orgSheet) {
      console.error('Organizations sheet not found!');
      return;
    }
    
    const data = XLSX.utils.sheet_to_json(orgSheet, { header: 1, range: 'A3:P8' }) as any[][];
    console.log(`Found ${data.length} rows to test`);
    
    const headers = data[0];
    const sampleRows = data.slice(1, 6);
    
    console.log('Headers:', headers);
    console.log(`Processing ${sampleRows.length} sample rows...\n`);
    
    for (let i = 0; i < sampleRows.length; i++) {
      const row = sampleRows[i];
      const rowData: Record<string, any> = {};
      
      headers.forEach((header: string, index: number) => {
        if (header && row[index] !== undefined) {
          rowData[header] = row[index];
        }
      });
      
      console.log(`Row ${i + 1}:`, rowData['ORGANIZATIONS'] || 'No name');
      
      const validation = validateRow('Organizations', rowData);
      if (validation.isValid) {
        const transformed = transformRow('Organizations', rowData);
        console.log('  ✅ Valid - Priority:', transformed.priority);
      } else {
        console.log('  ❌ Invalid:', validation.errors.join(', '));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function checkDatabaseCounts() {
  console.log('\n📊 Current database counts:');
  
  try {
    const counts = await prisma.$transaction([
      prisma.organization.count(),
      prisma.contact.count(),
      prisma.opportunity.count(),
      prisma.interaction.count()
    ]);
    
    console.log(`  Organizations: ${counts[0]}`);
    console.log(`  Contacts: ${counts[1]}`);
    console.log(`  Opportunities: ${counts[2]}`);
    console.log(`  Interactions: ${counts[3]}`);
    console.log(`  Total: ${counts.reduce((a, b) => a + b, 0)}`);
  } catch (error) {
    console.error('Failed to get counts:', error);
  }
}

async function testMigrationExecutor() {
  console.log('\n🔧 Testing Migration Executor...\n');
  
  const executor = new MigrationExecutor(prisma);
  
  // Listen to events
  executor.on('status', (message) => {
    console.log(`[STATUS] ${message}`);
  });
  
  executor.on('entity:start', (data) => {
    console.log(`[START] Processing ${data.entity}...`);
  });
  
  executor.on('entity:progress', (data) => {
    console.log(`[PROGRESS] ${data.entity}: ${data.processed}/${data.total} (${data.errors} errors)`);
  });
  
  executor.on('entity:complete', (data) => {
    console.log(`[COMPLETE] ${data.entity}: ${data.status}`);
  });
  
  // Note: Uncomment to run actual migration
  // const result = await executor.executeMigration(
  //   path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx')
  // );
  // console.log('Migration result:', result);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Excel Migration Test Suite');
  console.log('='.repeat(60));
  
  await testFieldMappings();
  await testSampleMigration();
  await checkDatabaseCounts();
  await testMigrationExecutor();
  
  console.log('\n✨ All tests completed!');
  
  await prisma.$disconnect();
}

// Run tests
main().catch(console.error);