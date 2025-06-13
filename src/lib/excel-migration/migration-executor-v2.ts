/**
 * Enhanced Migration Executor with Integrated Data Validation
 * Implements comprehensive validation before data persistence
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { fieldMappingConfig, transformRow } from './field-mapping-config';
import { ValidationService, BatchValidationOptions, ValidationResult } from './validation/validation-service';
import { DataQualityMonitor } from './validation/data-quality-monitor';
import { RollbackManager } from './rollback-manager';
import EventEmitter from 'events';
import * as fs from 'fs/promises';
import path from 'path';

// Import validation rules for enhanced processing
import { 
  CrossEntityValidations,
  calculateDataQualityScore 
} from './validation/data-validation-rules';

// Dynamic SSE broadcasting
let broadcastProgress: ((event: string, data: any) => void) | null = null;
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const progressModule = require('@/app/api/migration/progress/route');
    broadcastProgress = progressModule.broadcastProgress;
  } catch (e) {
    // Not in Next.js context
  }
}

export interface MigrationConfig {
  validateBeforeSave: boolean;
  stopOnCriticalErrors: boolean;
  minQualityScore: number;
  saveValidationReport: boolean;
  enableRollback: boolean;
  dryRun: boolean;
}

export interface EnhancedMigrationResult {
  success: boolean;
  entities: EntityMigrationResult[];
  validationReports: Map<string, ValidationResult>;
  qualityMetrics: any[];
  startTime: Date;
  endTime: Date;
  rollbackAvailable: boolean;
  reportPath?: string;
}

export interface EntityMigrationResult {
  entity: string;
  total: number;
  processed: number;
  saved: number;
  errors: number;
  warnings: number;
  skipped: number;
  averageQualityScore: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'aborted';
}

export class EnhancedMigrationExecutor extends EventEmitter {
  private prisma: PrismaClient;
  private validationService: ValidationService;
  private qualityMonitor: DataQualityMonitor;
  private rollbackManager: RollbackManager;
  private abortController: AbortController;
  private config: MigrationConfig;
  private entityCache: Map<string, Map<string, any>>;
  
  constructor(prisma: PrismaClient, config?: Partial<MigrationConfig>) {
    super();
    this.prisma = prisma;
    this.validationService = new ValidationService(prisma);
    this.qualityMonitor = new DataQualityMonitor(prisma);
    this.rollbackManager = new RollbackManager();
    this.abortController = new AbortController();
    this.entityCache = new Map();
    
    // Default configuration
    this.config = {
      validateBeforeSave: true,
      stopOnCriticalErrors: true,
      minQualityScore: 70,
      saveValidationReport: true,
      enableRollback: true,
      dryRun: false,
      ...config
    };
    
    // Set up event forwarding
    this.setupEventForwarding();
    
    // Set up quality monitoring listeners
    this.setupQualityMonitoring();
  }

  private setupEventForwarding(): void {
    if (broadcastProgress) {
      this.on('migration:start', (data) => broadcastProgress('migration:start', data));
      this.on('migration:complete', (data) => broadcastProgress('migration:complete', data));
      this.on('migration:error', (data) => broadcastProgress('migration:error', data));
      this.on('entity:start', (data) => broadcastProgress('entity:start', data));
      this.on('entity:progress', (data) => broadcastProgress('entity:progress', data));
      this.on('entity:complete', (data) => broadcastProgress('entity:complete', data));
      this.on('validation:start', (data) => broadcastProgress('validation:start', data));
      this.on('validation:complete', (data) => broadcastProgress('validation:complete', data));
      this.on('quality:alert', (data) => broadcastProgress('quality:alert', data));
    }
  }

  private setupQualityMonitoring(): void {
    this.qualityMonitor.on('metrics:recorded', (metrics) => {
      this.emit('quality:metrics', metrics);
    });
    
    this.qualityMonitor.on('alert:triggered', (alert) => {
      this.emit('quality:alert', alert);
      
      // Stop migration on critical alerts if configured
      if (alert.severity === 'CRITICAL' && this.config.stopOnCriticalErrors) {
        this.abort();
      }
    });
  }

  async executeMigration(excelPath: string): Promise<EnhancedMigrationResult> {
    const startTime = new Date();
    const validationReports = new Map<string, ValidationResult>();
    const qualityMetrics: any[] = [];
    const entities: EntityMigrationResult[] = [
      this.createEntityResult('Organizations'),
      this.createEntityResult('Contacts'),
      this.createEntityResult('Opportunities'),
      this.createEntityResult('Interactions')
    ];

    try {
      // Emit start event
      this.emit('migration:start', { 
        entities,
        config: this.config,
        timestamp: startTime
      });

      // Read Excel file
      this.emit('status', 'Reading Excel file...');
      const workbook = XLSX.readFile(excelPath);

      // Create rollback point if enabled
      if (this.config.enableRollback && !this.config.dryRun) {
        await this.rollbackManager.createCheckpoint('pre-migration');
      }

      // Pre-migration validation phase
      if (this.config.validateBeforeSave) {
        this.emit('status', 'Running pre-migration validation...');
        const preValidationPassed = await this.runPreMigrationValidation(
          workbook,
          entities,
          validationReports
        );
        
        if (!preValidationPassed && this.config.stopOnCriticalErrors) {
          throw new Error('Pre-migration validation failed with critical errors');
        }
      }

      // Process entities in dependency order
      for (const entityResult of entities) {
        if (this.abortController.signal.aborted) {
          entityResult.status = 'aborted';
          break;
        }

        await this.processEntityWithValidation(
          workbook,
          entityResult,
          validationReports,
          qualityMetrics
        );
      }

      // Generate final report
      let reportPath: string | undefined;
      if (this.config.saveValidationReport) {
        reportPath = await this.generateFinalReport(
          validationReports,
          qualityMetrics,
          entities
        );
      }

      // Emit completion
      const endTime = new Date();
      this.emit('migration:complete', {
        entities,
        duration: endTime.getTime() - startTime.getTime(),
        totalProcessed: entities.reduce((sum, e) => sum + e.processed, 0),
        totalSaved: entities.reduce((sum, e) => sum + e.saved, 0),
        totalErrors: entities.reduce((sum, e) => sum + e.errors, 0)
      });

      return {
        success: entities.every(e => e.status === 'completed'),
        entities,
        validationReports,
        qualityMetrics,
        startTime,
        endTime,
        rollbackAvailable: this.config.enableRollback && !this.config.dryRun,
        reportPath
      };

    } catch (error) {
      // Emit error
      this.emit('migration:error', error);

      // Attempt rollback if enabled
      if (this.config.enableRollback && !this.config.dryRun) {
        try {
          await this.rollbackManager.rollback('pre-migration');
          this.emit('status', 'Migration rolled back successfully');
        } catch (rollbackError) {
          this.emit('status', 'Rollback failed: ' + rollbackError);
        }
      }

      return {
        success: false,
        entities,
        validationReports,
        qualityMetrics,
        startTime,
        endTime: new Date(),
        rollbackAvailable: false
      };
    }
  }

  private async processEntityWithValidation(
    workbook: XLSX.WorkBook,
    entityResult: EntityMigrationResult,
    validationReports: Map<string, ValidationResult>,
    qualityMetrics: any[]
  ): Promise<void> {
    const sheetName = entityResult.entity;
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      entityResult.status = 'error';
      entityResult.errors++;
      this.emit('entity:error', {
        entity: sheetName,
        error: `Worksheet "${sheetName}" not found`
      });
      return;
    }

    // Update status
    entityResult.status = 'processing';
    this.emit('entity:start', entityResult);

    // Get and prepare data
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    const headerRowIndex = this.findHeaderRow(jsonData, sheetName);
    const headers = jsonData[headerRowIndex] || [];
    const dataStartRow = headerRowIndex + 1;
    
    entityResult.total = jsonData.length - dataStartRow;

    // Convert to objects for validation
    const records = this.convertToRecords(
      jsonData.slice(dataStartRow),
      headers,
      sheetName
    );

    // Validation phase
    this.emit('validation:start', { entity: sheetName, total: records.length });
    const validationStartTime = Date.now();
    
    const validationResult = await this.validateEntity(sheetName, records);
    validationReports.set(sheetName, validationResult);
    
    const validationDuration = Date.now() - validationStartTime;
    this.emit('validation:complete', {
      entity: sheetName,
      result: validationResult,
      duration: validationDuration
    });

    // Record quality metrics
    const metrics = await this.qualityMonitor.recordMetrics(
      sheetName,
      validationResult,
      validationDuration
    );
    qualityMetrics.push(metrics);

    // Check if we should proceed with saving
    if (validationResult.dataQualityScore < this.config.minQualityScore) {
      entityResult.status = 'error';
      this.emit('entity:error', {
        entity: sheetName,
        error: `Data quality score ${validationResult.dataQualityScore}% is below minimum ${this.config.minQualityScore}%`
      });
      return;
    }

    // Process valid records
    if (!this.config.dryRun) {
      await this.saveValidRecords(
        sheetName,
        records,
        validationResult,
        entityResult
      );
    } else {
      // In dry run, just update counts
      entityResult.processed = validationResult.processedCount;
      entityResult.saved = validationResult.processedCount - validationResult.errorCount;
      entityResult.errors = validationResult.errorCount;
      entityResult.warnings = validationResult.warningCount;
    }

    entityResult.averageQualityScore = validationResult.dataQualityScore;
    entityResult.status = entityResult.errors > 0 ? 'error' : 'completed';
    
    this.emit('entity:complete', entityResult);
  }

  private async validateEntity(
    entityName: string,
    records: any[]
  ): Promise<ValidationResult> {
    const validationOptions: BatchValidationOptions = {
      batchSize: 100,
      stopOnError: false,
      validateReferences: true,
      checkDuplicates: true,
      calculateQuality: true
    };

    switch (entityName) {
      case 'Organizations':
        return await this.validationService.validateOrganizations(records, validationOptions);
      
      case 'Contacts':
        return await this.validationService.validateContacts(records, validationOptions);
      
      case 'Opportunities':
        return await this.validationService.validateOpportunities(records, validationOptions);
      
      case 'Interactions':
        return await this.validationService.validateInteractions(records, validationOptions);
      
      default:
        throw new Error(`Unknown entity type: ${entityName}`);
    }
  }

  private async saveValidRecords(
    entityName: string,
    records: any[],
    validationResult: ValidationResult,
    entityResult: EntityMigrationResult
  ): Promise<void> {
    // Get error row numbers for skipping
    const errorRows = new Set(validationResult.errors.map(e => e.row));
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 1;
      
      // Skip rows with errors
      if (errorRows.has(rowNumber)) {
        skippedCount++;
        continue;
      }
      
      const record = records[i];
      
      try {
        // Transform the record
        const transformed = transformRow(entityName, record);
        
        // Save to database
        await this.saveEntity(entityName, transformed, record);
        
        savedCount++;
        entityResult.saved++;
        
        // Update progress
        entityResult.processed++;
        
        // Emit progress every 10 records
        if (savedCount % 10 === 0) {
          this.emit('entity:progress', entityResult);
        }
        
      } catch (error) {
        entityResult.errors++;
        this.emit('entity:save:error', {
          entity: entityName,
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    entityResult.skipped = skippedCount;
  }

  private convertToRecords(
    rows: any[][],
    headers: any[],
    entityName: string
  ): any[] {
    return rows.map(row => {
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== null && row[index] !== undefined) {
          record[header] = row[index];
        }
      });
      
      // Add any entity-specific transformations
      if (entityName === 'Organizations' && record['PRIORITY-FOCUS (A-D) A-highest \r\n(DropDown)']) {
        // Map the priority field
        record['priority'] = record['PRIORITY-FOCUS (A-D) A-highest \r\n(DropDown)'];
      }
      
      return record;
    });
  }

  private async runPreMigrationValidation(
    workbook: XLSX.WorkBook,
    entities: EntityMigrationResult[],
    validationReports: Map<string, ValidationResult>
  ): Promise<boolean> {
    let allValid = true;
    
    for (const entityResult of entities) {
      const worksheet = workbook.Sheets[entityResult.entity];
      if (!worksheet) continue;
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
      const headerRowIndex = this.findHeaderRow(jsonData, entityResult.entity);
      const headers = jsonData[headerRowIndex] || [];
      const dataStartRow = headerRowIndex + 1;
      
      // Sample first 100 records for pre-validation
      const sampleSize = Math.min(100, jsonData.length - dataStartRow);
      const sampleRecords = this.convertToRecords(
        jsonData.slice(dataStartRow, dataStartRow + sampleSize),
        headers,
        entityResult.entity
      );
      
      const validationResult = await this.validateEntity(entityResult.entity, sampleRecords);
      
      // Extrapolate error rate
      const errorRate = validationResult.errorCount / validationResult.processedCount;
      const estimatedErrors = Math.round(errorRate * (jsonData.length - dataStartRow));
      
      if (errorRate > 0.1) { // More than 10% error rate
        allValid = false;
        this.emit('validation:warning', {
          entity: entityResult.entity,
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}% (estimated ${estimatedErrors} errors)`,
          severity: errorRate > 0.25 ? 'critical' : 'high'
        });
      }
      
      validationReports.set(`${entityResult.entity}_sample`, validationResult);
    }
    
    return allValid;
  }

  private async generateFinalReport(
    validationReports: Map<string, ValidationResult>,
    qualityMetrics: any[],
    entities: EntityMigrationResult[]
  ): Promise<string> {
    const reportDir = path.join(process.cwd(), 'migration-reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `migration-report-${timestamp}.md`);
    
    // Generate comprehensive report
    const report = this.validationService.generateReport(validationReports);
    
    // Add migration summary
    let enhancedReport = `# Migration Report\n\n`;
    enhancedReport += `**Date**: ${new Date().toISOString()}\n`;
    enhancedReport += `**Mode**: ${this.config.dryRun ? 'Dry Run' : 'Production'}\n\n`;
    
    enhancedReport += `## Summary\n\n`;
    enhancedReport += `| Entity | Total | Processed | Saved | Errors | Warnings | Skipped | Quality |\n`;
    enhancedReport += `|--------|-------|-----------|-------|--------|----------|---------|--------|\n`;
    
    entities.forEach(entity => {
      enhancedReport += `| ${entity.entity} `;
      enhancedReport += `| ${entity.total} `;
      enhancedReport += `| ${entity.processed} `;
      enhancedReport += `| ${entity.saved} `;
      enhancedReport += `| ${entity.errors} `;
      enhancedReport += `| ${entity.warnings} `;
      enhancedReport += `| ${entity.skipped} `;
      enhancedReport += `| ${entity.averageQualityScore}% |\n`;
    });
    
    enhancedReport += `\n${report}`;
    
    // Add quality metrics summary
    if (qualityMetrics.length > 0) {
      enhancedReport += `\n## Quality Metrics\n\n`;
      qualityMetrics.forEach(metric => {
        enhancedReport += `### ${metric.entityType}\n`;
        enhancedReport += `- Validation Speed: ${metric.performanceMetrics.recordsPerSecond.toFixed(0)} records/sec\n`;
        enhancedReport += `- Common Errors:\n`;
        metric.commonErrors.slice(0, 5).forEach((error: any) => {
          enhancedReport += `  - ${error.field}: ${error.errorType} (${error.percentage.toFixed(1)}%)\n`;
        });
        enhancedReport += '\n';
      });
    }
    
    await fs.writeFile(reportPath, enhancedReport);
    
    return reportPath;
  }

  private createEntityResult(entity: string): EntityMigrationResult {
    return {
      entity,
      total: 0,
      processed: 0,
      saved: 0,
      errors: 0,
      warnings: 0,
      skipped: 0,
      averageQualityScore: 0,
      status: 'pending'
    };
  }

  private findHeaderRow(data: any[][], sheetName: string): number {
    const headerRows: Record<string, number> = {
      'Organizations': 2,
      'Contacts': 1,
      'Opportunities': 2,
      'Interactions': 3
    };
    
    return headerRows[sheetName] || 0;
  }

  private async saveEntity(
    entityName: string,
    transformed: Record<string, any>,
    original: Record<string, any>
  ): Promise<void> {
    // Use existing save methods from original migration executor
    switch (entityName) {
      case 'Organizations':
        await this.saveOrganization(transformed);
        break;
      case 'Contacts':
        await this.saveContact(transformed, original);
        break;
      case 'Opportunities':
        await this.saveOpportunity(transformed, original);
        break;
      case 'Interactions':
        await this.saveInteraction(transformed, original);
        break;
    }
  }

  // Include the save methods from the original executor
  private async saveOrganization(data: Record<string, any>) {
    const existing = await this.prisma.organization.findFirst({
      where: { name: data.name }
    });

    if (existing) {
      await this.prisma.organization.update({
        where: { id: existing.id },
        data: {
          priority: data.priority || existing.priority,
          segment: data.segment || existing.segment,
          phone: data.phone || existing.phone,
          address: data.address || existing.address,
          city: data.city || existing.city,
          state: data.state || existing.state,
          zipCode: data.zipCode || existing.zipCode,
          notes: data.notes || existing.notes
        }
      });
      
      // Cache for reference validation
      this.cacheEntity('organizations', existing.id, data.name);
    } else {
      const created = await this.prisma.organization.create({
        data: {
          name: data.name,
          priority: data.priority || 'NONE',
          segment: data.segment,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          notes: data.notes
        }
      });
      
      // Cache for reference validation
      this.cacheEntity('organizations', created.id, data.name);
    }
  }

  private async saveContact(data: Record<string, any>, original: Record<string, any>) {
    let firstName = data.firstName;
    let lastName = data.lastName;
    
    if (data.fullName && (!firstName || !lastName)) {
      const nameParts = data.fullName.split(/[,\s]+/).filter(Boolean);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    const organizationId = await this.resolveOrganizationId(original['Organizations (DropDown)']);
    if (!organizationId) {
      throw new Error(`Organization not found: ${original['Organizations (DropDown)']}`);
    }

    const existing = await this.prisma.contact.findFirst({
      where: {
        AND: [
          { firstName },
          { lastName },
          { organizationId }
        ]
      }
    });

    if (existing) {
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          email: data.email || existing.email,
          phone: data.phone || existing.phone,
          position: data.position || existing.position
        }
      });
      
      this.cacheEntity('contacts', existing.id, `${firstName} ${lastName}`);
    } else {
      const created = await this.prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          position: data.position,
          organizationId,
          isPrimary: data.isPrimary || false
        }
      });
      
      this.cacheEntity('contacts', created.id, `${firstName} ${lastName}`);
    }
  }

  private async saveOpportunity(data: Record<string, any>, original: Record<string, any>) {
    const organizationId = await this.resolveOrganizationId(original['Organizations\r\n(DropDown)']);
    if (!organizationId) {
      throw new Error(`Organization not found: ${original['Organizations\r\n(DropDown)']}`);
    }

    let contactId = null;
    if (original['CONTACT \r\n(Dropdown)']) {
      contactId = await this.resolveContactId(original['CONTACT \r\n(Dropdown)']);
    }

    await this.prisma.opportunity.create({
      data: {
        name: data.name,
        stage: data.stage || 'PROSPECT',
        value: data.value || 0,
        probability: data.probability || 0,
        expectedCloseDate: data.expectedCloseDate,
        organizationId,
        contactId,
        isActive: true
      }
    });
  }

  private async saveInteraction(data: Record<string, any>, original: Record<string, any>) {
    const organizationId = await this.resolveOrganizationId(original['Organizations\r\n(Formula)']);

    let contactId = null;
    if (original['CONTACT \r\n(Dropdown)']) {
      contactId = await this.resolveContactId(original['CONTACT \r\n(Dropdown)']);
    }

    await this.prisma.interaction.create({
      data: {
        type: data.type || 'OTHER',
        subject: data.subject || 'Imported interaction',
        date: new Date(data.date),
        description: data.description || data.notes,
        organizationId: organizationId || undefined,
        contactId
      }
    });
  }

  // Helper methods for entity resolution
  private async resolveOrganizationId(name: string): Promise<string | null> {
    if (!name) return null;
    
    // Check cache first
    const cached = this.entityCache.get('organizations');
    if (cached) {
      for (const [id, cachedName] of cached) {
        if (cachedName === name) return id;
      }
    }
    
    // Query database
    const org = await this.prisma.organization.findFirst({
      where: { name }
    });
    
    return org?.id || null;
  }

  private async resolveContactId(name: string): Promise<string | null> {
    if (!name) return null;
    
    // Check cache first
    const cached = this.entityCache.get('contacts');
    if (cached) {
      for (const [id, cachedName] of cached) {
        if (cachedName === name) return id;
      }
    }
    
    // Query database
    const contact = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { firstName: { contains: name } },
          { lastName: { contains: name } }
        ]
      }
    });
    
    return contact?.id || null;
  }

  private cacheEntity(type: string, id: string, name: string): void {
    if (!this.entityCache.has(type)) {
      this.entityCache.set(type, new Map());
    }
    this.entityCache.get(type)!.set(id, name);
  }

  abort(): void {
    this.abortController.abort();
    this.emit('migration:aborted');
  }

  async rollback(): Promise<boolean> {
    if (await this.rollbackManager.hasCheckpoint('pre-migration')) {
      await this.rollbackManager.rollback('pre-migration');
      return true;
    }
    return false;
  }

  setValidationOptions(options: Partial<BatchValidationOptions>): void {
    Object.assign(this.validationOptions, options);
  }

  setConfig(config: Partial<MigrationConfig>): void {
    Object.assign(this.config, config);
  }
}