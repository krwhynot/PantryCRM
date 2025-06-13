import { FieldMapper, MappingResult } from './field-mapper';
import { ValidationEngine, ValidationResult } from './validation-engine';
import { RollbackManager, RollbackStrategy } from './rollback-manager';
import { ConfidenceEngine } from './confidence-engine';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

export interface MigrationConfig {
  workbookPath: string;
  batchSize: number;
  confidenceThreshold: number;
  enableAutoRollback: boolean;
  checkpointFrequency: number;
}

export interface MigrationProgress {
  phase: 'mapping' | 'validation' | 'transformation' | 'loading' | 'complete';
  currentTable?: string;
  processedRecords: number;
  totalRecords: number;
  confidence: number;
  errors: number;
  warnings: number;
}

export interface MigrationResult {
  success: boolean;
  recordsProcessed: number;
  tablesProcessed: string[];
  errors: any[];
  warnings: any[];
  rollbackExecuted: boolean;
  duration: number;
  report: string;
}

export class MigrationOrchestrator {
  private fieldMapper: FieldMapper;
  private validationEngine: ValidationEngine;
  private rollbackManager: RollbackManager;
  private confidenceEngine: ConfidenceEngine;
  private prisma: PrismaClient;
  private progressCallback?: (progress: MigrationProgress) => void;

  constructor(
    prisma: PrismaClient,
    stateDirectory?: string,
    progressCallback?: (progress: MigrationProgress) => void
  ) {
    this.fieldMapper = new FieldMapper();
    this.validationEngine = new ValidationEngine();
    this.rollbackManager = new RollbackManager(stateDirectory);
    this.confidenceEngine = new ConfidenceEngine();
    this.prisma = prisma;
    this.progressCallback = progressCallback;
  }

  /**
   * Execute the complete migration process
   */
  async executeMigration(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    const migrationId = `migration_${Date.now()}`;
    
    try {
      // Initialize migration state
      await this.rollbackManager.initializeMigration(migrationId);
      
      // Phase 1: Mapping
      this.updateProgress('mapping', undefined, 0, 0, 0, 0, 0);
      const mappingResult = await this.fieldMapper.mapWorkbookToSchema(config.workbookPath);
      
      // Check if human review is required
      if (mappingResult.requiresHumanReview) {
        return {
          success: false,
          recordsProcessed: 0,
          tablesProcessed: [],
          errors: [{
            phase: 'mapping',
            message: 'Human review required for low-confidence mappings',
            mappingResult
          }],
          warnings: [],
          rollbackExecuted: false,
          duration: Date.now() - startTime,
          report: this.generateMappingReport(mappingResult)
        };
      }
      
      // Phase 2: Validation
      this.updateProgress('validation', undefined, 0, 0, 0, 0, 0);
      const validationResults = await this.validateAllData(config.workbookPath, mappingResult);
      
      // Check validation results
      const hasErrors = Array.from(validationResults.values()).some(r => !r.valid);
      if (hasErrors) {
        const rollbackStrategy = this.rollbackManager.determineRollbackStrategy(
          this.extractErrors(validationResults),
          mappingResult.summary.highConfidence / mappingResult.summary.totalMappings * 10,
          mappingResult.tableMappings.map(tm => tm.targetTable)
        );
        
        if (config.enableAutoRollback && rollbackStrategy.confidence > 0.7) {
          // No data loaded yet, just report validation failures
          return {
            success: false,
            recordsProcessed: 0,
            tablesProcessed: [],
            errors: this.extractErrors(validationResults),
            warnings: this.extractWarnings(validationResults),
            rollbackExecuted: false,
            duration: Date.now() - startTime,
            report: this.validationEngine.generateValidationSummary(validationResults)
          };
        }
      }
      
      // Phase 3: Transformation and Loading
      this.updateProgress('transformation', undefined, 0, 0, 0, 0, 0);
      const loadingResult = await this.loadData(config, mappingResult, validationResults);
      
      // Phase 4: Post-migration validation
      this.updateProgress('loading', undefined, loadingResult.recordsProcessed, loadingResult.totalRecords, 0, 0, 0);
      
      // Check if rollback is needed
      if (loadingResult.errors.length > 0 && config.enableAutoRollback) {
        const rollbackStrategy = this.rollbackManager.determineRollbackStrategy(
          loadingResult.errors,
          loadingResult.averageConfidence,
          loadingResult.tablesProcessed
        );
        
        if (rollbackStrategy.confidence > 0.5) {
          const rollbackResult = await this.rollbackManager.executeRollback(rollbackStrategy);
          return {
            success: false,
            recordsProcessed: loadingResult.recordsProcessed,
            tablesProcessed: loadingResult.tablesProcessed,
            errors: loadingResult.errors,
            warnings: loadingResult.warnings,
            rollbackExecuted: true,
            duration: Date.now() - startTime,
            report: await this.rollbackManager.generateRollbackReport(rollbackResult)
          };
        }
      }
      
      // Success
      this.updateProgress('complete', undefined, loadingResult.recordsProcessed, loadingResult.totalRecords, loadingResult.averageConfidence, 0, 0);
      
      return {
        success: true,
        recordsProcessed: loadingResult.recordsProcessed,
        tablesProcessed: loadingResult.tablesProcessed,
        errors: loadingResult.errors,
        warnings: loadingResult.warnings,
        rollbackExecuted: false,
        duration: Date.now() - startTime,
        report: this.generateSuccessReport(loadingResult, mappingResult, validationResults)
      };
      
    } catch (error) {
      await this.rollbackManager.logError(
        'migration',
        error instanceof Error ? error.message : String(error),
        'critical'
      );
      
      throw error;
    }
  }

  /**
   * Validate all data according to mappings
   */
  private async validateAllData(
    workbookPath: string,
    mappingResult: MappingResult
  ): Promise<Map<string, ValidationResult>> {
    const workbook = XLSX.readFile(workbookPath);
    const results = new Map<string, ValidationResult>();
    
    for (const tableMapping of mappingResult.tableMappings) {
      const worksheet = workbook.Sheets[tableMapping.sourceSheet];
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      // Transform data according to mappings
      const transformedData = this.transformData(rawData, tableMapping);
      
      // Validate
      const validationResult = this.validationEngine.validateData(
        tableMapping.targetTable,
        transformedData
      );
      
      results.set(tableMapping.targetTable, validationResult);
    }
    
    return results;
  }

  /**
   * Transform data according to field mappings
   */
  private transformData(rawData: any[], tableMapping: any): any[] {
    return rawData.map(row => {
      const transformed: any = {};
      
      for (const mapping of tableMapping.fieldMappings) {
        const sourceValue = row[mapping.sourceField];
        transformed[mapping.targetField] = this.transformValue(
          sourceValue,
          mapping.targetField,
          tableMapping.targetTable
        );
      }
      
      return transformed;
    });
  }

  /**
   * Transform individual values based on target field requirements
   */
  private transformValue(value: any, targetField: string, targetTable: string): any {
    if (value == null || value === '') return null;
    
    // Special transformations based on field type
    const fieldLower = targetField.toLowerCase();
    
    if (fieldLower.includes('date')) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    if (fieldLower.includes('phone')) {
      return String(value).replace(/\D/g, '');
    }
    
    if (fieldLower.includes('email')) {
      return String(value).toLowerCase().trim();
    }
    
    if (targetField === 'priority' && targetTable === 'Organization') {
      return String(value).toUpperCase();
    }
    
    if (targetField === 'probability' && targetTable === 'Opportunity') {
      const num = Number(value);
      return isNaN(num) ? 50 : Math.min(100, Math.max(0, num));
    }
    
    return value;
  }

  /**
   * Load data into the database
   */
  private async loadData(
    config: MigrationConfig,
    mappingResult: MappingResult,
    validationResults: Map<string, ValidationResult>
  ): Promise<any> {
    const workbook = XLSX.readFile(config.workbookPath);
    let totalProcessed = 0;
    let totalRecords = 0;
    const tablesProcessed: string[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];
    let totalConfidence = 0;
    
    // Calculate total records
    for (const tableMapping of mappingResult.tableMappings) {
      const worksheet = workbook.Sheets[tableMapping.sourceSheet];
      const data = XLSX.utils.sheet_to_json(worksheet);
      totalRecords += data.length;
    }
    
    // Load data table by table
    for (const tableMapping of mappingResult.tableMappings) {
      try {
        await this.rollbackManager.updateTableStatus(tableMapping.targetTable, 'processing');
        
        const worksheet = workbook.Sheets[tableMapping.sourceSheet];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        const transformedData = this.transformData(rawData, tableMapping);
        
        // Clean data
        const cleanedData = this.validationEngine.cleanData(transformedData);
        
        // Load in batches
        for (let i = 0; i < cleanedData.length; i += config.batchSize) {
          const batch = cleanedData.slice(i, i + config.batchSize);
          
          try {
            await this.loadBatch(tableMapping.targetTable, batch);
            totalProcessed += batch.length;
            
            // Create checkpoint if needed
            if (totalProcessed % config.checkpointFrequency === 0) {
              await this.rollbackManager.createCheckpoint(
                'loading',
                tableMapping.targetTable,
                totalProcessed,
                tableMapping.confidence,
                { batchIndex: i }
              );
            }
            
            this.updateProgress(
              'loading',
              tableMapping.targetTable,
              totalProcessed,
              totalRecords,
              tableMapping.confidence,
              errors.length,
              warnings.length
            );
            
          } catch (error) {
            errors.push({
              table: tableMapping.targetTable,
              batch: i,
              error: error instanceof Error ? error.message : String(error)
            });
            
            await this.rollbackManager.logError(
              'loading',
              error instanceof Error ? error.message : String(error),
              'high',
              tableMapping.targetTable
            );
          }
        }
        
        await this.rollbackManager.updateTableStatus(
          tableMapping.targetTable,
          'completed',
          cleanedData.length,
          tableMapping.confidence
        );
        
        tablesProcessed.push(tableMapping.targetTable);
        totalConfidence += tableMapping.confidence;
        
      } catch (error) {
        await this.rollbackManager.updateTableStatus(tableMapping.targetTable, 'failed');
        errors.push({
          table: tableMapping.targetTable,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      recordsProcessed: totalProcessed,
      totalRecords,
      tablesProcessed,
      errors,
      warnings,
      averageConfidence: tablesProcessed.length > 0 ? totalConfidence / tablesProcessed.length : 0
    };
  }

  /**
   * Load a batch of records into the database
   */
  private async loadBatch(table: string, records: any[]): Promise<void> {
    switch (table) {
      case 'Organization':
        await this.prisma.organization.createMany({
          data: records,
          skipDuplicates: true
        });
        break;
        
      case 'Contact':
        await this.prisma.contact.createMany({
          data: records,
          skipDuplicates: true
        });
        break;
        
      case 'Interaction':
        await this.prisma.interaction.createMany({
          data: records,
          skipDuplicates: true
        });
        break;
        
      case 'Opportunity':
        await this.prisma.opportunity.createMany({
          data: records,
          skipDuplicates: true
        });
        break;
        
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  /**
   * Update progress
   */
  private updateProgress(
    phase: MigrationProgress['phase'],
    currentTable: string | undefined,
    processedRecords: number,
    totalRecords: number,
    confidence: number,
    errors: number,
    warnings: number
  ) {
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        currentTable,
        processedRecords,
        totalRecords,
        confidence,
        errors,
        warnings
      });
    }
  }

  /**
   * Extract errors from validation results
   */
  private extractErrors(validationResults: Map<string, ValidationResult>): any[] {
    const errors: any[] = [];
    
    validationResults.forEach((result, table) => {
      result.errors.forEach(error => {
        errors.push({
          table,
          ...error,
          severity: 'high'
        });
      });
    });
    
    return errors;
  }

  /**
   * Extract warnings from validation results
   */
  private extractWarnings(validationResults: Map<string, ValidationResult>): any[] {
    const warnings: any[] = [];
    
    validationResults.forEach((result, table) => {
      result.warnings.forEach(warning => {
        warnings.push({
          table,
          ...warning,
          severity: 'medium'
        });
      });
    });
    
    return warnings;
  }

  /**
   * Generate mapping report
   */
  private generateMappingReport(mappingResult: MappingResult): string {
    const lines = [
      '# Excel Migration Mapping Report',
      '',
      '## Summary',
      `- Total Mappings: ${mappingResult.summary.totalMappings}`,
      `- High Confidence: ${mappingResult.summary.highConfidence}`,
      `- Medium Confidence: ${mappingResult.summary.mediumConfidence}`,
      `- Low Confidence: ${mappingResult.summary.lowConfidence}`,
      `- Requires Human Review: ${mappingResult.requiresHumanReview ? 'Yes' : 'No'}`,
      '',
      '## Table Mappings',
    ];
    
    mappingResult.tableMappings.forEach(tm => {
      lines.push(`### ${tm.sourceSheet} → ${tm.targetTable}`);
      lines.push(`- Confidence: ${tm.confidence.toFixed(1)}/10`);
      lines.push(`- Mapped Fields: ${tm.fieldMappings.length}`);
      lines.push(`- Unmapped Source: ${tm.unmappedSourceFields.length}`);
      lines.push(`- Unmapped Target: ${tm.unmappedTargetFields.length}`);
      lines.push('');
    });
    
    if (mappingResult.lowConfidenceMappings.length > 0) {
      lines.push('## Low Confidence Mappings');
      mappingResult.lowConfidenceMappings.forEach(m => {
        lines.push(`- ${m.sourceField} → ${m.targetField} (${m.confidence}/10)`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Generate success report
   */
  private generateSuccessReport(
    loadingResult: any,
    mappingResult: MappingResult,
    validationResults: Map<string, ValidationResult>
  ): string {
    const lines = [
      '# Migration Success Report',
      '',
      `## Overview`,
      `- Records Processed: ${loadingResult.recordsProcessed.toLocaleString()}`,
      `- Tables Processed: ${loadingResult.tablesProcessed.join(', ')}`,
      `- Average Confidence: ${loadingResult.averageConfidence.toFixed(1)}/10`,
      `- Errors: ${loadingResult.errors.length}`,
      `- Warnings: ${loadingResult.warnings.length}`,
      '',
      '## Table Details'
    ];
    
    mappingResult.tableMappings.forEach(tm => {
      const validation = validationResults.get(tm.targetTable);
      lines.push(`### ${tm.targetTable}`);
      lines.push(`- Source: ${tm.sourceSheet}`);
      lines.push(`- Confidence: ${tm.confidence.toFixed(1)}/10`);
      if (validation) {
        lines.push(`- Valid Records: ${validation.statistics.validRecords}`);
        lines.push(`- Invalid Records: ${validation.statistics.invalidRecords}`);
      }
      lines.push('');
    });
    
    return lines.join('\n');
  }
}