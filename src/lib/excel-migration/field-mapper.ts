import * as XLSX from 'xlsx';
import { ConfidenceEngine, FieldMapping } from './confidence-engine';

export interface TableMapping {
  sourceSheet: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  confidence: number;
  unmappedSourceFields: string[];
  unmappedTargetFields: string[];
}

export interface MappingResult {
  tableMappings: TableMapping[];
  lowConfidenceMappings: FieldMapping[];
  requiresHumanReview: boolean;
  summary: {
    totalMappings: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}

// Target database schema structure
const targetSchema = {
  Organization: {
    fields: {
      name: 'string',
      priority: 'string',
      segment: 'string',
      type: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zipCode: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      notes: 'string',
      estimatedRevenue: 'number',
      employeeCount: 'number',
      primaryContact: 'string',
      lastContactDate: 'date',
      nextFollowUpDate: 'date',
      status: 'string'
    }
  },
  Contact: {
    fields: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      phone: 'string',
      position: 'string',
      isPrimary: 'boolean',
      notes: 'string',
      organizationId: 'string'
    }
  },
  Interaction: {
    fields: {
      type: 'string',
      subject: 'string',
      description: 'string',
      date: 'date',
      duration: 'number',
      outcome: 'string',
      nextAction: 'string',
      organizationId: 'string',
      contactId: 'string'
    }
  },
  Opportunity: {
    fields: {
      name: 'string',
      organizationId: 'string',
      contactId: 'string',
      value: 'number',
      stage: 'string',
      probability: 'number',
      expectedCloseDate: 'date',
      notes: 'string',
      reason: 'string',
      isActive: 'boolean'
    }
  }
};

export class FieldMapper {
  private confidenceEngine: ConfidenceEngine;
  
  constructor() {
    this.confidenceEngine = new ConfidenceEngine();
  }

  /**
   * Analyze Excel workbook and map to target schema
   */
  async mapWorkbookToSchema(workbookPath: string): Promise<MappingResult> {
    const workbook = XLSX.readFile(workbookPath);
    const tableMappings: TableMapping[] = [];
    const lowConfidenceMappings: FieldMapping[] = [];
    
    // Analyze each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (sheetData.length < 2) continue; // Skip empty sheets
      
      // Determine which target table this sheet maps to
      const targetTable = this.identifyTargetTable(sheetName, sheetData);
      if (!targetTable) continue;
      
      // Extract headers and sample data
      const headers = this.extractHeaders(sheetData);
      const sampleData = this.extractSampleData(sheetData, headers);
      
      // Map fields
      const fieldMappings = this.mapFields(headers, targetTable, sampleData);
      
      // Calculate overall confidence
      const avgConfidence = fieldMappings.length > 0
        ? fieldMappings.reduce((sum, m) => sum + m.confidence, 0) / fieldMappings.length
        : 0;
      
      // Identify unmapped fields
      const mappedSourceFields = new Set(fieldMappings.map(m => m.sourceField));
      const mappedTargetFields = new Set(fieldMappings.map(m => m.targetField));
      
      const unmappedSourceFields = headers.filter(h => !mappedSourceFields.has(h));
      const unmappedTargetFields = Object.keys(targetSchema[targetTable as keyof typeof targetSchema].fields)
        .filter(f => !mappedTargetFields.has(f));
      
      tableMappings.push({
        sourceSheet: sheetName,
        targetTable,
        fieldMappings,
        confidence: avgConfidence,
        unmappedSourceFields,
        unmappedTargetFields
      });
      
      // Collect low confidence mappings
      lowConfidenceMappings.push(...fieldMappings.filter(m => m.confidence < 5));
    }
    
    // Calculate summary
    const allMappings = tableMappings.flatMap(t => t.fieldMappings);
    const summary = {
      totalMappings: allMappings.length,
      highConfidence: allMappings.filter(m => m.confidence >= 8).length,
      mediumConfidence: allMappings.filter(m => m.confidence >= 5 && m.confidence < 8).length,
      lowConfidence: allMappings.filter(m => m.confidence < 5).length
    };
    
    return {
      tableMappings,
      lowConfidenceMappings,
      requiresHumanReview: lowConfidenceMappings.length > 0 || summary.lowConfidence > summary.highConfidence * 0.2,
      summary
    };
  }

  /**
   * Identify which target table a sheet maps to
   */
  private identifyTargetTable(sheetName: string, sheetData: any[][]): string | null {
    const sheetNameLower = sheetName.toLowerCase();
    
    // Direct name matching
    if (sheetNameLower.includes('organization') || sheetNameLower.includes('company')) {
      return 'Organization';
    }
    if (sheetNameLower.includes('contact') && !sheetNameLower.includes('interaction')) {
      return 'Contact';
    }
    if (sheetNameLower.includes('interaction')) {
      return 'Interaction';
    }
    if (sheetNameLower.includes('opportunit')) {
      return 'Opportunity';
    }
    
    // Analyze content to determine table
    const headers = this.extractHeaders(sheetData);
    const headerString = headers.join(' ').toLowerCase();
    
    if (headerString.includes('organization') || headerString.includes('company')) {
      return 'Organization';
    }
    if (headerString.includes('first') && headerString.includes('last') && 
        (headerString.includes('name') || headerString.includes('contact'))) {
      return 'Contact';
    }
    if (headerString.includes('interaction') || headerString.includes('activity')) {
      return 'Interaction';
    }
    if (headerString.includes('opportunity') || headerString.includes('deal')) {
      return 'Opportunity';
    }
    
    return null;
  }

  /**
   * Extract headers from sheet data
   */
  private extractHeaders(sheetData: any[][]): string[] {
    // Look for the first row with multiple non-empty values
    for (let i = 0; i < Math.min(10, sheetData.length); i++) {
      const row = sheetData[i];
      const nonEmptyValues = row.filter(val => val != null && val !== '');
      
      if (nonEmptyValues.length >= 3) {
        // This is likely the header row
        return row
          .map((val, index) => val || `Column${index + 1}`)
          .filter(val => val !== null && val !== undefined);
      }
    }
    
    return [];
  }

  /**
   * Extract sample data for analysis
   */
  private extractSampleData(sheetData: any[][], headers: string[]): Record<string, any[]> {
    const sampleData: Record<string, any[]> = {};
    const headerRowIndex = this.findHeaderRowIndex(sheetData, headers);
    
    if (headerRowIndex === -1) return sampleData;
    
    // Initialize sample data arrays
    headers.forEach(header => {
      sampleData[header] = [];
    });
    
    // Collect up to 20 sample values for each column
    for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 21, sheetData.length); i++) {
      const row = sheetData[i];
      headers.forEach((header, colIndex) => {
        if (row[colIndex] != null && row[colIndex] !== '') {
          sampleData[header].push(row[colIndex]);
        }
      });
    }
    
    return sampleData;
  }

  /**
   * Find the index of the header row
   */
  private findHeaderRowIndex(sheetData: any[][], headers: string[]): number {
    for (let i = 0; i < Math.min(10, sheetData.length); i++) {
      const row = sheetData[i];
      if (row.some(val => headers.includes(val))) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Map source fields to target fields
   */
  private mapFields(
    sourceHeaders: string[],
    targetTable: string,
    sampleData: Record<string, any[]>
  ): FieldMapping[] {
    const targetFields = targetSchema[targetTable as keyof typeof targetSchema].fields;
    const mappings: FieldMapping[] = [];
    const usedTargetFields = new Set<string>();
    
    // For each source field, find the best matching target field
    for (const sourceField of sourceHeaders) {
      if (!sourceField || sourceField.startsWith('Column')) continue;
      
      let bestMapping: FieldMapping | null = null;
      let bestConfidence = 0;
      
      for (const [targetField, targetType] of Object.entries(targetFields)) {
        if (usedTargetFields.has(targetField)) continue;
        
        const mapping = this.confidenceEngine.calculateFieldMappingConfidence(
          sourceField,
          targetField,
          sampleData[sourceField] || [],
          targetType
        );
        
        if (mapping.confidence > bestConfidence && mapping.confidence >= 3) {
          bestMapping = mapping;
          bestConfidence = mapping.confidence;
        }
      }
      
      if (bestMapping) {
        mappings.push(bestMapping);
        usedTargetFields.add(bestMapping.targetField);
      }
    }
    
    return mappings;
  }

  /**
   * Get mapping suggestions for a specific field
   */
  getMappingSuggestions(
    sourceField: string,
    sampleData: any[],
    targetTable: string
  ): FieldMapping[] {
    const targetFields = targetSchema[targetTable as keyof typeof targetSchema].fields;
    const suggestions: FieldMapping[] = [];
    
    for (const [targetField, targetType] of Object.entries(targetFields)) {
      const mapping = this.confidenceEngine.calculateFieldMappingConfidence(
        sourceField,
        targetField,
        sampleData,
        targetType
      );
      
      if (mapping.confidence >= 3) {
        suggestions.push(mapping);
      }
    }
    
    // Sort by confidence descending
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Accept a manual mapping override
   */
  acceptManualMapping(
    sourceSheet: string,
    sourceField: string,
    targetTable: string,
    targetField: string,
    confidence: number = 10
  ): FieldMapping {
    return {
      sourceField,
      targetField,
      confidence,
      reasons: ['Manual mapping by user'],
      dataTypeMatch: true,
      semanticMatch: true,
      patternMatch: true,
      businessRuleMatch: true
    };
  }
}