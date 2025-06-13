export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'unique' | 'reference' | 'custom';
  condition: (value: any, record?: any) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  statistics: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DataIntegrityReport {
  duplicates: {
    field: string;
    values: any[];
    rowNumbers: number[];
  }[];
  missingRequired: {
    field: string;
    rowNumbers: number[];
  }[];
  invalidFormats: {
    field: string;
    format: string;
    invalidValues: { value: any; row: number }[];
  }[];
  referentialIntegrity: {
    sourceField: string;
    targetTable: string;
    missingReferences: { value: any; row: number }[];
  }[];
}

export class ValidationEngine {
  private validationRules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules for common CRM fields
   */
  private initializeDefaultRules() {
    // Organization rules
    this.addRule('Organization', {
      field: 'name',
      type: 'required',
      condition: (value) => value != null && value !== '',
      message: 'Organization name is required',
      severity: 'error'
    });

    this.addRule('Organization', {
      field: 'priority',
      type: 'format',
      condition: (value) => !value || /^[A-D]$/i.test(String(value)),
      message: 'Priority must be A, B, C, or D',
      severity: 'error'
    });

    this.addRule('Organization', {
      field: 'email',
      type: 'format',
      condition: (value) => !value || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(value)),
      message: 'Invalid email format',
      severity: 'warning'
    });

    this.addRule('Organization', {
      field: 'phone',
      type: 'format',
      condition: (value) => !value || String(value).replace(/\D/g, '').length >= 10,
      message: 'Phone number should have at least 10 digits',
      severity: 'warning'
    });

    this.addRule('Organization', {
      field: 'zipCode',
      type: 'format',
      condition: (value) => !value || /^\d{5}(-\d{4})?$/.test(String(value)),
      message: 'Invalid ZIP code format',
      severity: 'warning'
    });

    this.addRule('Organization', {
      field: 'estimatedRevenue',
      type: 'range',
      condition: (value) => !value || (Number(value) >= 0 && Number(value) < 1000000000),
      message: 'Estimated revenue must be between 0 and 1 billion',
      severity: 'warning'
    });

    // Contact rules
    this.addRule('Contact', {
      field: 'firstName',
      type: 'required',
      condition: (value) => value != null && value !== '',
      message: 'First name is required',
      severity: 'error'
    });

    this.addRule('Contact', {
      field: 'lastName',
      type: 'required',
      condition: (value) => value != null && value !== '',
      message: 'Last name is required',
      severity: 'error'
    });

    this.addRule('Contact', {
      field: 'email',
      type: 'format',
      condition: (value) => !value || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(value)),
      message: 'Invalid email format',
      severity: 'warning'
    });

    // Opportunity rules
    this.addRule('Opportunity', {
      field: 'name',
      type: 'required',
      condition: (value) => value != null && value !== '',
      message: 'Opportunity name is required',
      severity: 'error'
    });

    this.addRule('Opportunity', {
      field: 'probability',
      type: 'range',
      condition: (value) => !value || (Number(value) >= 0 && Number(value) <= 100),
      message: 'Probability must be between 0 and 100',
      severity: 'error'
    });

    this.addRule('Opportunity', {
      field: 'stage',
      type: 'format',
      condition: (value) => !value || ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'].includes(String(value).toUpperCase()),
      message: 'Invalid opportunity stage',
      severity: 'warning'
    });

    // Interaction rules
    this.addRule('Interaction', {
      field: 'type',
      type: 'required',
      condition: (value) => value != null && value !== '',
      message: 'Interaction type is required',
      severity: 'error'
    });

    this.addRule('Interaction', {
      field: 'date',
      type: 'required',
      condition: (value) => value != null && !isNaN(Date.parse(String(value))),
      message: 'Valid date is required',
      severity: 'error'
    });

    this.addRule('Interaction', {
      field: 'duration',
      type: 'range',
      condition: (value) => !value || (Number(value) >= 0 && Number(value) <= 480),
      message: 'Duration should be between 0 and 480 minutes (8 hours)',
      severity: 'warning'
    });
  }

  /**
   * Add a validation rule
   */
  addRule(table: string, rule: ValidationRule) {
    if (!this.validationRules.has(table)) {
      this.validationRules.set(table, []);
    }
    this.validationRules.get(table)!.push(rule);
  }

  /**
   * Validate data against rules
   */
  validateData(table: string, data: any[]): ValidationResult {
    const rules = this.validationRules.get(table) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];
    const invalidRows = new Set<number>();

    // Validate each record
    data.forEach((record, rowIndex) => {
      rules.forEach(rule => {
        const value = record[rule.field];
        if (!rule.condition(value, record)) {
          const error: ValidationError = {
            row: rowIndex + 1,
            field: rule.field,
            value,
            rule: rule.type,
            message: rule.message,
            severity: rule.severity
          };

          switch (rule.severity) {
            case 'error':
              errors.push(error);
              invalidRows.add(rowIndex);
              break;
            case 'warning':
              warnings.push(error);
              break;
            case 'info':
              info.push(error);
              break;
          }
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      statistics: {
        totalRecords: data.length,
        validRecords: data.length - invalidRows.size,
        invalidRecords: invalidRows.size,
        errorCount: errors.length,
        warningCount: warnings.length
      }
    };
  }

  /**
   * Check data integrity
   */
  checkDataIntegrity(table: string, data: any[], references?: Map<string, Set<any>>): DataIntegrityReport {
    const report: DataIntegrityReport = {
      duplicates: [],
      missingRequired: [],
      invalidFormats: [],
      referentialIntegrity: []
    };

    // Check for duplicates
    const fieldValues = new Map<string, Map<any, number[]>>();
    data.forEach((record, index) => {
      Object.entries(record).forEach(([field, value]) => {
        if (value != null && value !== '') {
          if (!fieldValues.has(field)) {
            fieldValues.set(field, new Map());
          }
          const valueMap = fieldValues.get(field)!;
          if (!valueMap.has(value)) {
            valueMap.set(value, []);
          }
          valueMap.get(value)!.push(index + 1);
        }
      });
    });

    // Find duplicate values
    fieldValues.forEach((valueMap, field) => {
      valueMap.forEach((rows, value) => {
        if (rows.length > 1) {
          const existing = report.duplicates.find(d => d.field === field);
          if (existing) {
            existing.values.push(value);
            existing.rowNumbers.push(...rows);
          } else {
            report.duplicates.push({
              field,
              values: [value],
              rowNumbers: rows
            });
          }
        }
      });
    });

    // Check missing required fields
    const rules = this.validationRules.get(table) || [];
    const requiredFields = rules.filter(r => r.type === 'required').map(r => r.field);
    
    requiredFields.forEach(field => {
      const missingRows: number[] = [];
      data.forEach((record, index) => {
        if (!record[field] || record[field] === '') {
          missingRows.push(index + 1);
        }
      });
      
      if (missingRows.length > 0) {
        report.missingRequired.push({ field, rowNumbers: missingRows });
      }
    });

    // Check format violations
    const formatRules = rules.filter(r => r.type === 'format');
    formatRules.forEach(rule => {
      const invalidValues: { value: any; row: number }[] = [];
      data.forEach((record, index) => {
        const value = record[rule.field];
        if (value && !rule.condition(value, record)) {
          invalidValues.push({ value, row: index + 1 });
        }
      });
      
      if (invalidValues.length > 0) {
        report.invalidFormats.push({
          field: rule.field,
          format: rule.message,
          invalidValues
        });
      }
    });

    // Check referential integrity if references provided
    if (references) {
      // Example: Check if organizationId exists in Organizations
      if (table === 'Contact' && references.has('Organization')) {
        const orgIds = references.get('Organization')!;
        const missingRefs: { value: any; row: number }[] = [];
        
        data.forEach((record, index) => {
          if (record.organizationId && !orgIds.has(record.organizationId)) {
            missingRefs.push({ value: record.organizationId, row: index + 1 });
          }
        });
        
        if (missingRefs.length > 0) {
          report.referentialIntegrity.push({
            sourceField: 'organizationId',
            targetTable: 'Organization',
            missingReferences: missingRefs
          });
        }
      }
    }

    return report;
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(results: Map<string, ValidationResult>): string {
    const lines: string[] = ['# Data Validation Summary\n'];
    
    results.forEach((result, table) => {
      lines.push(`## ${table}`);
      lines.push(`- Total Records: ${result.statistics.totalRecords}`);
      lines.push(`- Valid Records: ${result.statistics.validRecords}`);
      lines.push(`- Invalid Records: ${result.statistics.invalidRecords}`);
      lines.push(`- Errors: ${result.statistics.errorCount}`);
      lines.push(`- Warnings: ${result.statistics.warningCount}`);
      
      if (result.errors.length > 0) {
        lines.push('\n### Top Errors:');
        const errorSummary = this.summarizeErrors(result.errors);
        errorSummary.forEach(summary => {
          lines.push(`- ${summary.field}: ${summary.message} (${summary.count} occurrences)`);
        });
      }
      
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * Summarize errors by field and message
   */
  private summarizeErrors(errors: ValidationError[]): { field: string; message: string; count: number }[] {
    const summary = new Map<string, number>();
    
    errors.forEach(error => {
      const key = `${error.field}:${error.message}`;
      summary.set(key, (summary.get(key) || 0) + 1);
    });
    
    return Array.from(summary.entries())
      .map(([key, count]) => {
        const [field, ...messageParts] = key.split(':');
        return { field, message: messageParts.join(':'), count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 errors
  }

  /**
   * Clean and normalize data
   */
  cleanData(data: any[]): any[] {
    return data.map(record => {
      const cleaned: any = {};
      
      Object.entries(record).forEach(([field, value]) => {
        // Trim strings
        if (typeof value === 'string') {
          cleaned[field] = value.trim();
        } else {
          cleaned[field] = value;
        }
        
        // Normalize phone numbers
        if (field.toLowerCase().includes('phone') && cleaned[field]) {
          cleaned[field] = this.normalizePhone(cleaned[field]);
        }
        
        // Normalize emails
        if (field.toLowerCase().includes('email') && cleaned[field]) {
          cleaned[field] = cleaned[field].toLowerCase();
        }
        
        // Normalize dates
        if (field.toLowerCase().includes('date') && cleaned[field]) {
          cleaned[field] = this.normalizeDate(cleaned[field]);
        }
      });
      
      return cleaned;
    });
  }

  /**
   * Normalize phone numbers
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    return phone; // Return original if not a standard format
  }

  /**
   * Normalize dates to ISO format
   */
  private normalizeDate(date: any): string {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return date; // Return original if not parseable
  }
}