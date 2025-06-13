#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { MigrationExecutor } from '../src/lib/excel-migration/migration-executor';
import path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const prisma = new PrismaClient();

program
  .name('migrate-excel')
  .description('Migrate data from Excel workbook to PantryCRM database')
  .option('-f, --file <path>', 'Path to Excel file', 'excel/CRM-WORKBOOK.xlsx')
  .option('-d, --dry-run', 'Run migration without saving to database')
  .option('-v, --verbose', 'Show detailed progress')
  .option('-r, --rollback', 'Rollback last migration')
  .parse();

const options = program.opts();

async function runMigration() {
  console.log(chalk.blue('🚀 PantryCRM Excel Migration Tool\n'));
  
  const spinner = ora('Initializing migration...').start();
  
  try {
    // Check file exists
    const filePath = path.isAbsolute(options.file) 
      ? options.file 
      : path.join(process.cwd(), options.file);
      
    spinner.text = `Reading Excel file: ${filePath}`;
    
    const executor = new MigrationExecutor(prisma);
    
    // Set up event listeners
    executor.on('status', (message) => {
      spinner.text = message;
    });
    
    executor.on('entity:start', (data) => {
      spinner.text = `Processing ${data.entity}...`;
    });
    
    let lastProgress: Record<string, any> = {};
    executor.on('entity:progress', (data) => {
      lastProgress[data.entity] = data;
      const total = Object.values(lastProgress).reduce((sum: number, e: any) => sum + (e.processed || 0), 0);
      spinner.text = `Migrating: ${total} records processed`;
    });
    
    executor.on('entity:complete', (data) => {
      if (data.status === 'completed') {
        spinner.succeed(`${data.entity}: ${data.processed} records migrated`);
      } else {
        spinner.fail(`${data.entity}: Failed with ${data.errors} errors`);
      }
      spinner.start('Processing next entity...');
    });
    
    // Run migration
    const result = await executor.executeMigration(filePath);
    
    spinner.stop();
    
    // Print summary
    console.log('\n' + chalk.bold('Migration Summary:'));
    console.log('─'.repeat(50));
    
    for (const entity of result.entities) {
      const icon = entity.status === 'completed' ? '✅' : '❌';
      const color = entity.status === 'completed' ? chalk.green : chalk.red;
      console.log(
        `${icon} ${entity.entity.padEnd(15)} ${color(entity.processed + '/' + entity.total)} records` +
        (entity.errors > 0 ? chalk.red(` (${entity.errors} errors)`) : '')
      );
    }
    
    console.log('─'.repeat(50));
    
    const totalProcessed = result.entities.reduce((sum, e) => sum + e.processed, 0);
    const totalErrors = result.entities.reduce((sum, e) => sum + e.errors, 0);
    const duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
    
    console.log(`Total: ${chalk.bold(totalProcessed)} records in ${duration.toFixed(1)}s`);
    
    if (totalErrors > 0) {
      console.log(chalk.red(`\n⚠️  ${totalErrors} errors encountered`));
      
      if (options.verbose && result.errors.length > 0) {
        console.log('\nError Details:');
        result.errors.slice(0, 10).forEach(error => {
          console.log(chalk.red(`  - ${error.entity} row ${error.row}: ${error.message}`));
        });
        if (result.errors.length > 10) {
          console.log(chalk.gray(`  ... and ${result.errors.length - 10} more errors`));
        }
      }
    }
    
    if (result.success) {
      console.log(chalk.green('\n✨ Migration completed successfully!'));
    } else {
      console.log(chalk.red('\n❌ Migration completed with errors'));
      
      if (result.rollbackAvailable) {
        console.log(chalk.yellow('\n💡 Tip: Use --rollback to undo this migration'));
      }
    }
    
  } catch (error) {
    spinner.fail('Migration failed');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function runRollback() {
  console.log(chalk.blue('🔄 Rolling back migration...\n'));
  
  const spinner = ora('Checking for rollback points...').start();
  
  try {
    const executor = new MigrationExecutor(prisma);
    const success = await executor.rollback();
    
    if (success) {
      spinner.succeed('Migration rolled back successfully');
    } else {
      spinner.fail('No rollback point found');
    }
  } catch (error) {
    spinner.fail('Rollback failed');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (options.rollback) {
  runRollback();
} else {
  runMigration();
}