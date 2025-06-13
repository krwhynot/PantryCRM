import { PrismaClient } from '@prisma/client';
import { MigrationCoordinator, TableMapping, DataTransformer } from './index';
import path from 'path';

// Example migration script for PantryCRM Excel data
async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    // Define mappings for key CRM data
    const mappings: TableMapping[] = [
      // Organizations mapping
      {
        worksheetName: 'Organizations',
        tableName: 'organization',
        rules: [
          {
            sourceColumn: 'Column2',
            targetField: 'name',
            transform: DataTransformer.transforms.trim,
            required: true
          },
          {
            sourceColumn: 'Column3',
            targetField: 'type',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column4',
            targetField: 'industry',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column5',
            targetField: 'website',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column6',
            targetField: 'phone',
            transform: DataTransformer.transforms.parsePhone
          },
          {
            sourceColumn: 'Column7',
            targetField: 'address',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column8',
            targetField: 'city',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column9',
            targetField: 'state',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column10',
            targetField: 'zipCode',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column11',
            targetField: 'notes',
            transform: DataTransformer.transforms.trim
          }
        ],
        batchSize: 500,
        preProcess: (data) => {
          // Skip header rows and empty entries
          return data.filter(row => 
            row.name && 
            row.name !== 'Column2' && 
            row.name !== 'Instructions:'
          );
        }
      },
      
      // Contacts mapping
      {
        worksheetName: 'ContactsData',
        tableName: 'contact',
        rules: [
          {
            sourceColumn: 'FULL NAME',
            targetField: 'name',
            transform: DataTransformer.transforms.trim,
            required: true
          },
          {
            sourceColumn: 'Column4',
            targetField: 'email',
            transform: DataTransformer.transforms.parseEmail
          },
          {
            sourceColumn: 'Column5',
            targetField: 'phone',
            transform: DataTransformer.transforms.parsePhone
          },
          {
            sourceColumn: 'Column6',
            targetField: 'title',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column7',
            targetField: 'department',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Operator',
            targetField: 'organizationName',
            transform: DataTransformer.transforms.trim
          }
        ],
        batchSize: 500,
        preProcess: (data) => {
          // Filter out empty or header rows
          return data.filter(row => 
            row.name && 
            row.name !== 'FULL NAME' &&
            row.name !== 'You want the filtered results to appear in column C.'
          );
        }
      },
      
      // Opportunities mapping
      {
        worksheetName: 'Opportunities',
        tableName: 'opportunity',
        rules: [
          {
            sourceColumn: 'Column2',
            targetField: 'name',
            transform: DataTransformer.transforms.trim,
            required: true
          },
          {
            sourceColumn: 'Column3',
            targetField: 'stage',
            transform: DataTransformer.transforms.trim,
            defaultValue: 'Lead'
          },
          {
            sourceColumn: 'Column4',
            targetField: 'status',
            transform: DataTransformer.transforms.trim,
            defaultValue: 'Active'
          },
          {
            sourceColumn: 'Column5',
            targetField: 'closeDate',
            transform: DataTransformer.transforms.toDate
          },
          {
            sourceColumn: 'Column6',
            targetField: 'value',
            transform: DataTransformer.transforms.toNumber
          },
          {
            sourceColumn: 'Column7',
            targetField: 'probability',
            transform: (value) => {
              const num = DataTransformer.transforms.toNumber(value);
              return num ? num / 100 : 0.5; // Convert percentage to decimal
            }
          },
          {
            sourceColumn: 'Column8',
            targetField: 'organizationName',
            transform: DataTransformer.transforms.trim
          }
        ],
        batchSize: 500,
        preProcess: (data) => {
          return data.filter(row => 
            row.name && 
            row.name !== 'Column2' &&
            row.name !== '         Opportunities'
          );
        }
      },
      
      // Interactions mapping
      {
        worksheetName: 'Interactions',
        tableName: 'interaction',
        rules: [
          {
            sourceColumn: 'Column2',
            targetField: 'type',
            transform: DataTransformer.transforms.trim,
            defaultValue: 'Note'
          },
          {
            sourceColumn: 'Column3',
            targetField: 'date',
            transform: DataTransformer.transforms.toDate,
            required: true
          },
          {
            sourceColumn: 'Column4',
            targetField: 'nextActionDate',
            transform: DataTransformer.transforms.toDate
          },
          {
            sourceColumn: 'Column5',
            targetField: 'subject',
            transform: DataTransformer.transforms.trim,
            required: true
          },
          {
            sourceColumn: 'Column6',
            targetField: 'notes',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column7',
            targetField: 'contactName',
            transform: DataTransformer.transforms.trim
          },
          {
            sourceColumn: 'Column8',
            targetField: 'opportunityName',
            transform: DataTransformer.transforms.trim
          }
        ],
        batchSize: 1000,
        preProcess: (data) => {
          return data.filter(row => 
            row.date && 
            row.subject &&
            row.subject !== '         Interactions'
          );
        }
      }
    ];
    
    // Create migration coordinator
    const coordinator = new MigrationCoordinator(prisma, {
      sourceFile: path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx'),
      mappings,
      analysisReportPath: path.join(process.cwd(), 'excel', 'migration-report.md'),
      enableRollback: true,
      dryRun: false, // Set to true for testing
      progressCallback: (progress) => {
        console.log(`[${progress.phase}] ${progress.percentComplete}% - ${progress.currentOperation}`);
        if (progress.stats.errorCount > 0) {
          console.log(`  Errors: ${progress.stats.errorCount}`);
        }
      }
    });
    
    // Execute migration
    console.log('Starting CRM data migration...\n');
    const result = await coordinator.executeMigration();
    
    // Display results
    console.log('\n=== MIGRATION RESULTS ===');
    console.log(`Success: ${result.success}`);
    console.log(`Records Processed: ${result.recordsProcessed.toLocaleString()}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
    console.log(`Rollback Available: ${result.rollbackAvailable}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }
    
    // Display summary of migrated data
    if (result.success) {
      console.log('\n=== DATA SUMMARY ===');
      const orgCount = await prisma.organization.count();
      const contactCount = await prisma.contact.count();
      const oppCount = await prisma.opportunity.count();
      const interactionCount = await prisma.interaction.count();
      
      console.log(`Organizations: ${orgCount.toLocaleString()}`);
      console.log(`Contacts: ${contactCount.toLocaleString()}`);
      console.log(`Opportunities: ${oppCount.toLocaleString()}`);
      console.log(`Interactions: ${interactionCount.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}