import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { fieldMappingConfig, transformRow, validateRow } from './field-mapping-config';
import { MigrationCoordinator } from './migration-coordinator';
import { DataTransformer } from './data-transformer';
import { ValidationEngine } from './validation-engine';
import { RollbackManager } from './rollback-manager';
import { ValidationService, BatchValidationOptions } from './validation/validation-service';
import { DataQualityMonitor } from './validation/data-quality-monitor';
import EventEmitter from 'events';
import path from 'path';
import * as fs from 'fs/promises';

// Dynamic import for SSE broadcasting only in Next.js context
let broadcastProgress: ((event: string, data: any) => void) | null = null;
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const progressModule = require('@/app/api/migration/progress/route');
    broadcastProgress = progressModule.broadcastProgress;
  } catch (e) {
    // Not in Next.js context, continue without broadcasting
  }
}

export interface MigrationProgress {
  entity: string;
  total: number;
  processed: number;
  errors: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface MigrationError {
  entity: string;
  row: number;
  field: string;
  message: string;
  data?: any;
}

export interface MigrationResult {
  success: boolean;
  entities: MigrationProgress[];
  errors: MigrationError[];
  startTime: Date;
  endTime: Date;
  rollbackAvailable: boolean;
}

export class MigrationExecutor extends EventEmitter {
  private prisma: PrismaClient;
  private coordinator: MigrationCoordinator;
  private transformer: DataTransformer;
  private validator: ValidationEngine;
  private rollbackManager: RollbackManager;
  private validationService: ValidationService;
  private qualityMonitor: DataQualityMonitor;
  private abortController: AbortController;
  private validationOptions: BatchValidationOptions;
  
  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.coordinator = new MigrationCoordinator();
    this.transformer = new DataTransformer();
    this.validator = new ValidationEngine();
    this.rollbackManager = new RollbackManager();
    this.validationService = new ValidationService(prisma);
    this.qualityMonitor = new DataQualityMonitor(prisma);
    this.abortController = new AbortController();
    
    // Default validation options
    this.validationOptions = {
      batchSize: 100,
      stopOnError: false,
      validateReferences: true,
      checkDuplicates: true,
      calculateQuality: true
    };
    
    // Set up event forwarding to SSE if available
    if (broadcastProgress) {
      this.on('migration:start', (data) => broadcastProgress('migration:start', data));
      this.on('migration:complete', (data) => broadcastProgress('migration:complete', data));
      this.on('migration:error', (data) => broadcastProgress('migration:error', data));
      this.on('entity:start', (data) => broadcastProgress('entity:start', data));
      this.on('entity:progress', (data) => broadcastProgress('entity:progress', data));
      this.on('entity:complete', (data) => broadcastProgress('entity:complete', data));
      this.on('status', (message) => broadcastProgress('status', { message }));
    }
  }

  async executeMigration(excelPath: string): Promise<MigrationResult> {
    const startTime = new Date();
    const errors: MigrationError[] = [];
    const entities: MigrationProgress[] = [
      { entity: 'Organizations', total: 0, processed: 0, errors: 0, status: 'pending' },
      { entity: 'Contacts', total: 0, processed: 0, errors: 0, status: 'pending' },
      { entity: 'Opportunities', total: 0, processed: 0, errors: 0, status: 'pending' },
      { entity: 'Interactions', total: 0, processed: 0, errors: 0, status: 'pending' }
    ];

    try {
      // Emit start event
      this.emit('migration:start', { entities });

      // Read Excel file
      this.emit('status', 'Reading Excel file...');
      const workbook = XLSX.readFile(excelPath);

      // Create rollback point
      await this.rollbackManager.createCheckpoint('pre-migration');

      // Process entities in order
      for (const entityProgress of entities) {
        if (this.abortController.signal.aborted) {
          throw new Error('Migration aborted by user');
        }

        await this.processEntity(
          workbook,
          entityProgress,
          errors
        );
      }

      // Emit completion
      this.emit('migration:complete', {
        entities,
        errors,
        duration: Date.now() - startTime.getTime()
      });

      return {
        success: errors.length === 0,
        entities,
        errors,
        startTime,
        endTime: new Date(),
        rollbackAvailable: true
      };

    } catch (error) {
      // Emit error
      this.emit('migration:error', error);

      // Attempt rollback
      if (await this.rollbackManager.hasCheckpoint('pre-migration')) {
        await this.rollbackManager.rollback('pre-migration');
      }

      return {
        success: false,
        entities,
        errors: [...errors, {
          entity: 'System',
          row: 0,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error'
        }],
        startTime,
        endTime: new Date(),
        rollbackAvailable: false
      };
    }
  }

  private async processEntity(
    workbook: XLSX.WorkBook,
    entityProgress: MigrationProgress,
    errors: MigrationError[]
  ): Promise<void> {
    const sheetName = entityProgress.entity;
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      entityProgress.status = 'error';
      errors.push({
        entity: sheetName,
        row: 0,
        field: 'sheet',
        message: `Worksheet "${sheetName}" not found`
      });
      return;
    }

    // Update status
    entityProgress.status = 'processing';
    this.emit('entity:start', entityProgress);

    // Get data as JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    
    // Find header row (based on our analysis)
    const headerRowIndex = this.findHeaderRow(jsonData, sheetName);
    const headers = jsonData[headerRowIndex] || [];
    const dataStartRow = headerRowIndex + 1;
    
    entityProgress.total = jsonData.length - dataStartRow;

    // Process in batches
    const BATCH_SIZE = 100;
    const batches = Math.ceil(entityProgress.total / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      if (this.abortController.signal.aborted) {
        entityProgress.status = 'error';
        break;
      }

      const startIdx = dataStartRow + (batchIndex * BATCH_SIZE);
      const endIdx = Math.min(startIdx + BATCH_SIZE, jsonData.length);
      
      await this.processBatch(
        sheetName,
        headers,
        jsonData.slice(startIdx, endIdx),
        startIdx,
        entityProgress,
        errors
      );

      // Emit progress
      this.emit('entity:progress', entityProgress);
    }

    // Update final status
    entityProgress.status = entityProgress.errors > 0 ? 'error' : 'completed';
    this.emit('entity:complete', entityProgress);
  }

  private async processBatch(
    entityName: string,
    headers: any[],
    rows: any[][],
    startRowIndex: number,
    progress: MigrationProgress,
    errors: MigrationError[]
  ): Promise<void> {
    const mappings = fieldMappingConfig[entityName];
    if (!mappings) return;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = startRowIndex + i + 1; // Excel rows are 1-indexed
      
      try {
        // Convert array to object using headers
        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (header && row[index] !== null && row[index] !== undefined) {
            rowData[header] = row[index];
          }
        });

        // Validate row
        const validation = validateRow(entityName, rowData);
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push({
              entity: entityName,
              row: rowNumber,
              field: 'validation',
              message: error,
              data: rowData
            });
          });
          progress.errors++;
          continue;
        }

        // Transform row
        const transformed = transformRow(entityName, rowData);

        // Save to database
        await this.saveEntity(entityName, transformed, rowData);
        
        progress.processed++;
        
      } catch (error) {
        errors.push({
          entity: entityName,
          row: rowNumber,
          field: 'processing',
          message: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
        progress.errors++;
      }
    }
  }

  private async saveEntity(
    entityName: string,
    transformed: Record<string, any>,
    original: Record<string, any>
  ): Promise<void> {
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

  private async saveOrganization(data: Record<string, any>) {
    // Check if organization already exists
    const existing = await this.prisma.organization.findFirst({
      where: { name: data.name }
    });

    if (existing) {
      // Update existing
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
          notes: data.notes || existing.notes,
          metadata: {
            ...existing.metadata as any,
            distributor: data.distributor,
            accountManager: data.accountManager,
            importedAt: new Date().toISOString()
          }
        }
      });
    } else {
      // Create new
      await this.prisma.organization.create({
        data: {
          name: data.name,
          priority: data.priority || 'NONE',
          segment: data.segment,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          notes: data.notes,
          metadata: {
            distributor: data.distributor,
            accountManager: data.accountManager,
            importedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  private async saveContact(data: Record<string, any>, original: Record<string, any>) {
    // Split full name if needed
    let firstName = data.firstName;
    let lastName = data.lastName;
    
    if (data.fullName && (!firstName || !lastName)) {
      const nameParts = data.fullName.split(/[,\s]+/).filter(Boolean);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Find organization
    const organization = await this.prisma.organization.findFirst({
      where: { name: original['Organizations (DropDown)'] }
    });

    if (!organization) {
      throw new Error(`Organization not found: ${original['Organizations (DropDown)']}`);
    }

    // Check if contact exists
    const existing = await this.prisma.contact.findFirst({
      where: {
        AND: [
          { firstName },
          { lastName },
          { organizationId: organization.id }
        ]
      }
    });

    if (existing) {
      // Update existing
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          email: data.email || existing.email,
          phone: data.phone || existing.phone,
          title: data.title || existing.title,
          metadata: {
            ...existing.metadata as any,
            accountManager: data.accountManager,
            notes: data.notes,
            importedAt: new Date().toISOString()
          }
        }
      });
    } else {
      // Create new
      await this.prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          title: data.title,
          organizationId: organization.id,
          metadata: {
            accountManager: data.accountManager,
            notes: data.notes,
            importedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  private async saveOpportunity(data: Record<string, any>, original: Record<string, any>) {
    // Find organization
    const organization = await this.prisma.organization.findFirst({
      where: { name: original['Organizations\r\n(DropDown)'] }
    });

    if (!organization) {
      throw new Error(`Organization not found: ${original['Organizations\r\n(DropDown)']}`);
    }

    // Create opportunity
    await this.prisma.opportunity.create({
      data: {
        name: data.name,
        stage: data.stage || 'LEAD',
        status: data.status || 'OPEN',
        value: data.value || 0,
        probability: data.probability || 0,
        expectedCloseDate: data.expectedCloseDate,
        organizationId: organization.id,
        metadata: {
          principal: data.principal,
          product: data.product,
          owner: data.ownerName,
          startDate: data.createdAt,
          notes: data.notes,
          importedAt: new Date().toISOString()
        }
      }
    });
  }

  private async saveInteraction(data: Record<string, any>, original: Record<string, any>) {
    // Find organization
    const organization = await this.prisma.organization.findFirst({
      where: { name: original['Organizations\r\n(Formula)'] }
    });

    let contactId = null;
    let opportunityId = null;

    // Find contact if specified
    if (original['CONTACT \r\n(Dropdown)']) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          OR: [
            { firstName: { contains: original['CONTACT \r\n(Dropdown)'] } },
            { lastName: { contains: original['CONTACT \r\n(Dropdown)'] } }
          ]
        }
      });
      contactId = contact?.id || null;
    }

    // Find opportunity if specified
    if (original['OPPORTUNITY']) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: { name: original['OPPORTUNITY'] }
      });
      opportunityId = opportunity?.id || null;
    }

    // Create interaction
    await this.prisma.interaction.create({
      data: {
        type: data.type || 'OTHER',
        date: new Date(data.date),
        notes: data.notes,
        organizationId: organization?.id || null,
        contactId,
        opportunityId,
        metadata: {
          principal: data.principal,
          accountManager: data.accountManager,
          importedAt: new Date().toISOString()
        }
      }
    });
  }

  private findHeaderRow(data: any[][], sheetName: string): number {
    // Based on our analysis
    const headerRows: Record<string, number> = {
      'Organizations': 2,
      'Contacts': 1,
      'Opportunities': 2,
      'Interactions': 3
    };
    
    return headerRows[sheetName] || 0;
  }

  abort() {
    this.abortController.abort();
  }

  async rollback() {
    if (await this.rollbackManager.hasCheckpoint('pre-migration')) {
      await this.rollbackManager.rollback('pre-migration');
      return true;
    }
    return false;
  }
}