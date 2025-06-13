import { PrismaClient } from '@prisma/client';
import { ExcelAnalyzer, WorkbookAnalysis } from './excel-analyzer';
import { DataTransformer, TableMapping } from './data-transformer';
import fs from 'fs/promises';
import path from 'path';

export interface MigrationConfig {
  sourceFile: string;
  mappings: TableMapping[];
  analysisReportPath?: string;
  enableRollback?: boolean;
  dryRun?: boolean;
  progressCallback?: (progress: MigrationProgress) => void;
}

export interface MigrationProgress {
  phase: 'analysis' | 'validation' | 'transformation' | 'verification' | 'complete';
  percentComplete: number;
  currentOperation: string;
  stats: {
    totalRecords: number;
    processedRecords: number;
    errorCount: number;
  };
}

export interface MigrationResult {
  success: boolean;
  analysis: WorkbookAnalysis;
  recordsProcessed: number;
  errors: string[];
  rollbackAvailable: boolean;
  duration: number;
}

export class MigrationCoordinator {
  private prisma: PrismaClient;
  private config: MigrationConfig;
  private rollbackData: Map<string, any[]> = new Map();

  constructor(prisma: PrismaClient, config: MigrationConfig) {
    this.prisma = prisma;
    this.config = config;
  }

  async executeMigration(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let analysis: WorkbookAnalysis;
    let recordsProcessed = 0;

    try {
      // Phase 1: Analysis
      this.reportProgress({
        phase: 'analysis',
        percentComplete: 10,
        currentOperation: 'Analyzing Excel workbook structure',
        stats: { totalRecords: 0, processedRecords: 0, errorCount: 0 }
      });

      const analyzer = new ExcelAnalyzer(this.config.sourceFile);
      analysis = await analyzer.analyzeWorkbook();

      // Save analysis report if requested
      if (this.config.analysisReportPath) {
        const report = await analyzer.generateAnalysisReport(analysis);
        await fs.writeFile(this.config.analysisReportPath, report);
      }

      // Phase 2: Validation
      this.reportProgress({
        phase: 'validation',
        percentComplete: 25,
        currentOperation: 'Validating data mappings',
        stats: { 
          totalRecords: analysis.totalRows, 
          processedRecords: 0, 
          errorCount: 0 
        }
      });

      const validationErrors = await this.validateMappings(analysis);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        if (this.config.dryRun) {
          return {
            success: false,
            analysis,
            recordsProcessed: 0,
            errors,
            rollbackAvailable: false,
            duration: Date.now() - startTime
          };
        }
      }

      // Phase 3: Backup for rollback (if enabled)
      if (this.config.enableRollback && !this.config.dryRun) {
        await this.createBackup();
      }

      // Phase 4: Transformation
      this.reportProgress({
        phase: 'transformation',
        percentComplete: 50,
        currentOperation: 'Transforming and loading data',
        stats: { 
          totalRecords: analysis.totalRows, 
          processedRecords: 0, 
          errorCount: errors.length 
        }
      });

      if (!this.config.dryRun) {
        const transformer = new DataTransformer(this.prisma);
        
        // Add all mappings to transformer
        for (const mapping of this.config.mappings) {
          transformer.addMapping(mapping);
        }

        // Execute transformation
        await transformer.transformWorkbook(this.config.sourceFile);
        recordsProcessed = analysis.totalRows;
      } else {
        console.log('Dry run mode: Skipping actual data transformation');
        recordsProcessed = analysis.totalRows;
      }

      // Phase 5: Verification
      this.reportProgress({
        phase: 'verification',
        percentComplete: 90,
        currentOperation: 'Verifying migrated data',
        stats: { 
          totalRecords: analysis.totalRows, 
          processedRecords: recordsProcessed, 
          errorCount: errors.length 
        }
      });

      if (!this.config.dryRun) {
        const verificationErrors = await this.verifyMigration(analysis);
        errors.push(...verificationErrors);
      }

      // Complete
      this.reportProgress({
        phase: 'complete',
        percentComplete: 100,
        currentOperation: 'Migration complete',
        stats: { 
          totalRecords: analysis.totalRows, 
          processedRecords: recordsProcessed, 
          errorCount: errors.length 
        }
      });

      return {
        success: errors.length === 0,
        analysis,
        recordsProcessed,
        errors,
        rollbackAvailable: this.config.enableRollback && !this.config.dryRun,
        duration: Date.now() - startTime
      };

    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
      
      if (this.config.enableRollback && !this.config.dryRun) {
        console.log('Attempting rollback due to error...');
        await this.rollback();
      }

      return {
        success: false,
        analysis: analysis!,
        recordsProcessed,
        errors,
        rollbackAvailable: false,
        duration: Date.now() - startTime
      };
    }
  }

  private async validateMappings(analysis: WorkbookAnalysis): Promise<string[]> {
    const errors: string[] = [];

    for (const mapping of this.config.mappings) {
      // Check if worksheet exists
      const worksheet = analysis.worksheets.find(ws => ws.name === mapping.worksheetName);
      if (!worksheet) {
        errors.push(`Worksheet "${mapping.worksheetName}" not found in workbook`);
        continue;
      }

      // Validate required columns exist
      for (const rule of mapping.rules) {
        if (!worksheet.headers.includes(rule.sourceColumn)) {
          if (rule.required && rule.defaultValue === undefined) {
            errors.push(`Required column "${rule.sourceColumn}" not found in worksheet "${mapping.worksheetName}"`);
          }
        }
      }

      // Check for data type compatibility
      for (const rule of mapping.rules) {
        if (worksheet.headers.includes(rule.sourceColumn)) {
          const dataTypes = worksheet.dataTypes[rule.sourceColumn];
          if (dataTypes && dataTypes.size > 0) {
            // Add specific validation based on target field type
            // This would require schema introspection
          }
        }
      }
    }

    return errors;
  }

  private async createBackup(): Promise<void> {
    console.log('Creating backup for rollback...');
    
    for (const mapping of this.config.mappings) {
      const tableName = mapping.tableName as any;
      const existingData = await (this.prisma[tableName] as any).findMany();
      this.rollbackData.set(tableName, existingData);
    }
  }

  private async rollback(): Promise<void> {
    console.log('Performing rollback...');
    
    for (const [tableName, data] of this.rollbackData) {
      try {
        // Delete all records
        await (this.prisma[tableName as any] as any).deleteMany();
        
        // Restore backup data
        if (data.length > 0) {
          await (this.prisma[tableName as any] as any).createMany({
            data,
            skipDuplicates: true
          });
        }
        
        console.log(`Rolled back ${tableName}: restored ${data.length} records`);
      } catch (error) {
        console.error(`Rollback failed for ${tableName}:`, error);
      }
    }
  }

  private async verifyMigration(analysis: WorkbookAnalysis): Promise<string[]> {
    const errors: string[] = [];

    for (const mapping of this.config.mappings) {
      const worksheet = analysis.worksheets.find(ws => ws.name === mapping.worksheetName);
      if (!worksheet) continue;

      const tableName = mapping.tableName as any;
      const count = await (this.prisma[tableName] as any).count();
      
      // Basic verification - check if record counts are reasonable
      if (count === 0 && worksheet.rowCount > 0) {
        errors.push(`No records found in ${tableName} after migration`);
      } else if (count < worksheet.rowCount * 0.9) {
        // Allow for some skipped records, but warn if too many
        errors.push(`Only ${count} of ${worksheet.rowCount} records migrated to ${tableName}`);
      }
    }

    return errors;
  }

  private reportProgress(progress: MigrationProgress): void {
    if (this.config.progressCallback) {
      this.config.progressCallback(progress);
    } else {
      console.log(`[${progress.phase.toUpperCase()}] ${progress.currentOperation} - ${progress.percentComplete}%`);
    }
  }

  // Helper method to generate default mappings based on analysis
  static generateDefaultMappings(
    analysis: WorkbookAnalysis,
    tableNameMap: Record<string, string>
  ): TableMapping[] {
    const mappings: TableMapping[] = [];

    for (const worksheet of analysis.worksheets) {
      const tableName = tableNameMap[worksheet.name];
      if (!tableName) continue;

      const rules = worksheet.headers.map(header => ({
        sourceColumn: header,
        targetField: this.camelCase(header),
        transform: this.guessTransform(worksheet.dataTypes[header])
      }));

      mappings.push({
        worksheetName: worksheet.name,
        tableName,
        rules,
        batchSize: worksheet.rowCount > 10000 ? 5000 : 1000
      });
    }

    return mappings;
  }

  private static camelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(word => word.length > 0)
      .map((word, index) => 
        index === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
  }

  private static guessTransform(dataTypes: Set<string> | undefined): ((value: any) => any) | undefined {
    if (!dataTypes || dataTypes.size === 0) return undefined;

    const types = Array.from(dataTypes);
    
    if (types.includes('date') || types.includes('date-string')) {
      return DataTransformer.transforms.toDate;
    }
    
    if (types.includes('number') || types.includes('numeric-string')) {
      return DataTransformer.transforms.toNumber;
    }
    
    if (types.includes('boolean')) {
      return DataTransformer.transforms.toBoolean;
    }
    
    if (types.includes('email')) {
      return DataTransformer.transforms.parseEmail;
    }
    
    if (types.includes('phone')) {
      return DataTransformer.transforms.parsePhone;
    }

    return DataTransformer.transforms.trim;
  }
}