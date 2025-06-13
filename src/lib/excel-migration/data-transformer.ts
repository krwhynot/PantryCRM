import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parser';
import * as fs from 'fs';
import { Readable } from 'stream';

export interface TransformationRule {
  sourceColumn: string;
  targetField: string;
  transform?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

export interface TableMapping {
  worksheetName: string;
  tableName: string;
  rules: TransformationRule[];
  batchSize?: number;
  preProcess?: (data: any[]) => any[];
  postProcess?: (data: any[]) => Promise<void>;
}

export class DataTransformer {
  private prisma: PrismaClient;
  private mappings: Map<string, TableMapping>;
  private stats: {
    processed: number;
    errors: number;
    skipped: number;
    startTime: Date;
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.mappings = new Map();
    this.stats = {
      processed: 0,
      errors: 0,
      skipped: 0,
      startTime: new Date()
    };
  }

  addMapping(mapping: TableMapping): void {
    this.mappings.set(mapping.worksheetName, mapping);
  }

  async transformWorkbook(filePath: string): Promise<void> {
    console.log('Starting data transformation...');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    for (const worksheet of workbook.worksheets) {
      const mapping = this.mappings.get(worksheet.name);
      if (!mapping) {
        console.log(`No mapping found for worksheet: ${worksheet.name}, skipping...`);
        continue;
      }
      
      await this.transformWorksheet(worksheet, mapping);
    }
    
    this.printStats();
  }

  private async transformWorksheet(
    worksheet: ExcelJS.Worksheet,
    mapping: TableMapping
  ): Promise<void> {
    console.log(`Transforming worksheet: ${worksheet.name} -> ${mapping.tableName}`);
    
    const batchSize = mapping.batchSize || 1000;
    const batch: any[] = [];
    const headers: string[] = [];
    
    // Extract headers from first row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });
    
    // Process data rows
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const transformedData = this.transformRow(row, headers, mapping.rules);
      
      if (transformedData) {
        batch.push(transformedData);
        
        if (batch.length >= batchSize) {
          await this.processBatch(batch, mapping);
          batch.length = 0;
        }
      } else {
        this.stats.skipped++;
      }
    }
    
    // Process remaining batch
    if (batch.length > 0) {
      await this.processBatch(batch, mapping);
    }
  }

  private transformRow(
    row: ExcelJS.Row,
    headers: string[],
    rules: TransformationRule[]
  ): any | null {
    const transformed: any = {};
    
    for (const rule of rules) {
      const columnIndex = headers.indexOf(rule.sourceColumn);
      if (columnIndex === -1) {
        if (rule.required && rule.defaultValue === undefined) {
          console.error(`Required column not found: ${rule.sourceColumn}`);
          return null;
        }
        transformed[rule.targetField] = rule.defaultValue;
        continue;
      }
      
      const cell = row.getCell(columnIndex + 1);
      let value = cell.value;
      
      // Apply transformation if defined
      if (rule.transform) {
        try {
          value = rule.transform(value);
        } catch (error) {
          console.error(`Transform error for ${rule.sourceColumn}: ${error}`);
          if (rule.required) return null;
          value = rule.defaultValue;
        }
      }
      
      // Check required fields
      if (rule.required && (value === null || value === undefined || value === '')) {
        if (rule.defaultValue !== undefined) {
          value = rule.defaultValue;
        } else {
          return null;
        }
      }
      
      transformed[rule.targetField] = value;
    }
    
    return transformed;
  }

  private async processBatch(
    batch: any[],
    mapping: TableMapping
  ): Promise<void> {
    try {
      // Apply pre-processing if defined
      let processedBatch = batch;
      if (mapping.preProcess) {
        processedBatch = mapping.preProcess(batch);
      }
      
      // Insert data into database
      const tableName = mapping.tableName as any;
      await (this.prisma[tableName] as any).createMany({
        data: processedBatch,
        skipDuplicates: true
      });
      
      this.stats.processed += processedBatch.length;
      
      // Apply post-processing if defined
      if (mapping.postProcess) {
        await mapping.postProcess(processedBatch);
      }
      
      console.log(`Processed batch of ${processedBatch.length} records for ${mapping.tableName}`);
    } catch (error) {
      console.error(`Error processing batch for ${mapping.tableName}:`, error);
      this.stats.errors += batch.length;
    }
  }

  async transformCSV(filePath: string, mapping: TableMapping): Promise<void> {
    console.log(`Transforming CSV: ${filePath} -> ${mapping.tableName}`);
    
    const batchSize = mapping.batchSize || 1000;
    const batch: any[] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true }))
        .on('data', async (row) => {
          const transformed = this.transformCSVRow(row, mapping.rules);
          
          if (transformed) {
            batch.push(transformed);
            
            if (batch.length >= batchSize) {
              await this.processBatch(batch, mapping);
              batch.length = 0;
            }
          } else {
            this.stats.skipped++;
          }
        })
        .on('end', async () => {
          if (batch.length > 0) {
            await this.processBatch(batch, mapping);
          }
          this.printStats();
          resolve();
        })
        .on('error', reject);
    });
  }

  private transformCSVRow(row: any, rules: TransformationRule[]): any | null {
    const transformed: any = {};
    
    for (const rule of rules) {
      let value = row[rule.sourceColumn];
      
      if (rule.transform) {
        try {
          value = rule.transform(value);
        } catch (error) {
          console.error(`Transform error for ${rule.sourceColumn}: ${error}`);
          if (rule.required) return null;
          value = rule.defaultValue;
        }
      }
      
      if (rule.required && (value === null || value === undefined || value === '')) {
        if (rule.defaultValue !== undefined) {
          value = rule.defaultValue;
        } else {
          return null;
        }
      }
      
      transformed[rule.targetField] = value;
    }
    
    return transformed;
  }

  private printStats(): void {
    const duration = (Date.now() - this.stats.startTime.getTime()) / 1000;
    console.log(`
Transformation Complete:
- Processed: ${this.stats.processed.toLocaleString()} records
- Errors: ${this.stats.errors.toLocaleString()} records
- Skipped: ${this.stats.skipped.toLocaleString()} records
- Duration: ${duration.toFixed(2)} seconds
- Rate: ${(this.stats.processed / duration).toFixed(0)} records/second
`);
  }

  // Common transformation functions
  static readonly transforms = {
    toDate: (value: any): Date | null => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },
    
    toNumber: (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    },
    
    toBoolean: (value: any): boolean => {
      return value === true || value === 'true' || value === '1' || value === 'yes';
    },
    
    toLowerCase: (value: any): string => {
      return value?.toString().toLowerCase() || '';
    },
    
    toUpperCase: (value: any): string => {
      return value?.toString().toUpperCase() || '';
    },
    
    trim: (value: any): string => {
      return value?.toString().trim() || '';
    },
    
    parseJSON: (value: any): any => {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return null;
      }
    },
    
    parsePhone: (value: any): string | null => {
      if (!value) return null;
      const cleaned = value.toString().replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return `+${cleaned}`;
      }
      return cleaned;
    },
    
    parseEmail: (value: any): string | null => {
      if (!value) return null;
      const email = value.toString().toLowerCase().trim();
      return email.match(/^[\w._%+-]+@[\w.-]+\.[A-Z]{2,}$/i) ? email : null;
    }
  };
}