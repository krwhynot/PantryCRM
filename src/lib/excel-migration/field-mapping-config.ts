import { z } from 'zod';

// Define the field mapping configuration schema
export const FieldMappingSchema = z.object({
  excelColumn: z.string(),
  dbField: z.string(),
  dbTable: z.string(),
  dataType: z.enum(['string', 'number', 'date', 'boolean', 'email', 'phone', 'enum']),
  required: z.boolean().default(false),
  transform: z.function().args(z.any()).returns(z.any()).optional(),
  validation: z.function().args(z.any()).returns(z.boolean()).optional(),
  enumValues: z.array(z.string()).optional(),
  defaultValue: z.any().optional(),
  notes: z.string().optional()
});

export type FieldMapping = z.infer<typeof FieldMappingSchema>;

// Field mapping configurations for each entity
export const fieldMappingConfig: Record<string, FieldMapping[]> = {
  Organizations: [
    {
      excelColumn: 'ORGANIZATIONS',
      dbField: 'name',
      dbTable: 'Organization',
      dataType: 'string',
      required: true,
      validation: (value: any) => {
        return typeof value === 'string' && value.trim().length > 0;
      },
      notes: 'Organization name is required'
    },
    {
      excelColumn: 'PRIORITY-FOCUS (A-D) A-highest \r\n(DropDown)',
      dbField: 'priority',
      dbTable: 'Organization',
      dataType: 'enum',
      enumValues: ['A', 'B', 'C', 'D'],
      transform: (value: any) => {
        // Map A-D to HIGH, MEDIUM, LOW, NONE
        const mapping: Record<string, string> = {
          'A': 'HIGH',
          'B': 'MEDIUM',
          'C': 'LOW',
          'D': 'NONE'
        };
        return mapping[String(value).toUpperCase()] || 'NONE';
      },
      defaultValue: 'NONE'
    },
    {
      excelColumn: 'SEGMENT\r\n(DROPDOWN)',
      dbField: 'segment',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => String(value).trim()
    },
    {
      excelColumn: 'DISTRIBUTOR \r\n(DROPDOWN)',
      dbField: 'distributor',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => String(value).trim()
    },
    {
      excelColumn: 'PRIMARY ACCT. MANAGER \r\n(DROPDOWN)',
      dbField: 'accountManager',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => String(value).trim()
    },
    {
      excelColumn: 'PHONE',
      dbField: 'phone',
      dbTable: 'Organization',
      dataType: 'phone',
      transform: (value: any) => {
        // Clean phone number
        const cleaned = String(value).replace(/\D/g, '');
        return cleaned.length > 0 ? cleaned : null;
      },
      validation: (value: any) => {
        if (!value) return true;
        const cleaned = String(value).replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
      }
    },
    {
      excelColumn: 'STREET ADDRESS',
      dbField: 'address',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    },
    {
      excelColumn: 'CITY',
      dbField: 'city',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    },
    {
      excelColumn: 'STATE\r\n(DROPDOWN)',
      dbField: 'state',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => value ? String(value).toUpperCase().trim() : null
    },
    {
      excelColumn: 'ZIP CODE',
      dbField: 'zipCode',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null,
      validation: (value: any) => {
        if (!value) return true;
        const zip = String(value).trim();
        return /^\d{5}(-\d{4})?$/.test(zip);
      }
    },
    {
      excelColumn: 'NOTES',
      dbField: 'notes',
      dbTable: 'Organization',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    }
  ],

  Contacts: [
    {
      excelColumn: 'FULL NAME (FIRST, LAST)',
      dbField: 'fullName',
      dbTable: 'Contact',
      dataType: 'string',
      required: true,
      transform: (value: any) => {
        const name = String(value).trim();
        // Will be split into firstName and lastName in the transformer
        return name;
      },
      notes: 'Will be split into firstName and lastName'
    },
    {
      excelColumn: 'Organizations (DropDown)',
      dbField: 'organizationName',
      dbTable: 'Contact',
      dataType: 'string',
      required: true,
      notes: 'Will be resolved to organizationId via lookup'
    },
    {
      excelColumn: 'POSITION\r\n(DropDown)',
      dbField: 'title',
      dbTable: 'Contact',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    },
    {
      excelColumn: 'EMAIL',
      dbField: 'email',
      dbTable: 'Contact',
      dataType: 'email',
      transform: (value: any) => value ? String(value).toLowerCase().trim() : null,
      validation: (value: any) => {
        if (!value) return true;
        const email = String(value).trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
    },
    {
      excelColumn: 'PHONE',
      dbField: 'phone',
      dbTable: 'Contact',
      dataType: 'phone',
      transform: (value: any) => {
        if (!value) return null;
        const cleaned = String(value).replace(/\D/g, '');
        return cleaned.length > 0 ? cleaned : null;
      }
    },
    {
      excelColumn: 'ACCT. MANAGER\r\n(DropDown)',
      dbField: 'accountManager',
      dbTable: 'Contact',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    },
    {
      excelColumn: 'NOTES',
      dbField: 'notes',
      dbTable: 'Contact',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    }
  ],

  Opportunities: [
    {
      excelColumn: 'Organizations\r\n(DropDown)',
      dbField: 'organizationName',
      dbTable: 'Opportunity',
      dataType: 'string',
      required: true,
      notes: 'Will be resolved to organizationId via lookup'
    },
    {
      excelColumn: 'OPPORTUNITY NAME',
      dbField: 'name',
      dbTable: 'Opportunity',
      dataType: 'string',
      required: true,
      transform: (value: any) => String(value).trim()
    },
    {
      excelColumn: 'Start Date',
      dbField: 'createdAt',
      dbTable: 'Opportunity',
      dataType: 'date',
      transform: (value: any) => {
        // Excel serial date to JS Date
        if (typeof value === 'number') {
          const date = new Date((value - 25569) * 86400 * 1000);
          return date.toISOString();
        }
        return new Date(value).toISOString();
      }
    },
    {
      excelColumn: 'STATUS\r\n(DropDown)',
      dbField: 'status',
      dbTable: 'Opportunity',
      dataType: 'enum',
      enumValues: ['OPEN', 'CLOSED_WON', 'CLOSED_LOST'],
      transform: (value: any) => {
        const status = String(value).toUpperCase();
        if (status.includes('OPEN')) return 'OPEN';
        if (status.includes('WON') || status.includes('SOLD')) return 'CLOSED_WON';
        if (status.includes('LOST') || status.includes('CLOSED')) return 'CLOSED_LOST';
        return 'OPEN';
      },
      defaultValue: 'OPEN'
    },
    {
      excelColumn: 'STAGE\r\n(DropDown)',
      dbField: 'stage',
      dbTable: 'Opportunity',
      dataType: 'enum',
      enumValues: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'],
      transform: (value: any) => {
        const stage = String(value).toLowerCase();
        if (stage.includes('lead') || stage.includes('discovery')) return 'LEAD';
        if (stage.includes('contact') || stage.includes('qualified')) return 'QUALIFIED';
        if (stage.includes('proposal') || stage.includes('demo')) return 'PROPOSAL';
        if (stage.includes('negotiation') || stage.includes('follow')) return 'NEGOTIATION';
        if (stage.includes('closed') || stage.includes('sold')) return 'CLOSED';
        return 'LEAD';
      },
      defaultValue: 'LEAD'
    },
    {
      excelColumn: 'EXP. SOLD-7',
      dbField: 'expectedCloseDate',
      dbTable: 'Opportunity',
      dataType: 'date',
      transform: (value: any) => {
        if (!value) return null;
        if (typeof value === 'number') {
          const date = new Date((value - 25569) * 86400 * 1000);
          return date.toISOString();
        }
        return new Date(value).toISOString();
      }
    },
    {
      excelColumn: 'PROBABILITY',
      dbField: 'probability',
      dbTable: 'Opportunity',
      dataType: 'number',
      transform: (value: any) => {
        const prob = parseFloat(String(value));
        if (isNaN(prob)) return 0;
        // Convert to percentage if needed
        return prob > 1 ? prob : prob * 100;
      },
      validation: (value: any) => {
        const prob = parseFloat(String(value));
        return !isNaN(prob) && prob >= 0 && prob <= 100;
      }
    },
    {
      excelColumn: 'CASES \r\nPer Week\r\nVOLUME',
      dbField: 'value',
      dbTable: 'Opportunity',
      dataType: 'number',
      transform: (value: any) => {
        const num = parseFloat(String(value));
        return isNaN(num) ? 0 : num;
      }
    },
    {
      excelColumn: 'PRINCIPAL',
      dbField: 'principal',
      dbTable: 'Opportunity',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null,
      notes: 'Custom field - may need to be stored in metadata'
    },
    {
      excelColumn: 'PRODUCT\r\n(DropDown)',
      dbField: 'product',
      dbTable: 'Opportunity',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null,
      notes: 'Custom field - may need to be stored in metadata'
    },
    {
      excelColumn: 'DEAL OWNER\r\n(DropDown)',
      dbField: 'ownerName',
      dbTable: 'Opportunity',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null,
      notes: 'Will be resolved to userId via lookup'
    },
    {
      excelColumn: 'Notes',
      dbField: 'notes',
      dbTable: 'Opportunity',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    }
  ],

  Interactions: [
    {
      excelColumn: 'DATE',
      dbField: 'date',
      dbTable: 'Interaction',
      dataType: 'date',
      required: true,
      transform: (value: any) => {
        if (typeof value === 'number') {
          // Excel serial date
          const date = new Date((value - 25569) * 86400 * 1000);
          return date.toISOString();
        }
        return new Date(value).toISOString();
      }
    },
    {
      excelColumn: 'INTERACTION \r\n(Dropdown)',
      dbField: 'type',
      dbTable: 'Interaction',
      dataType: 'enum',
      enumValues: ['CALL', 'EMAIL', 'MEETING', 'OTHER'],
      required: true,
      transform: (value: any) => {
        const type = String(value).toLowerCase();
        if (type.includes('call') || type.includes('phone')) return 'CALL';
        if (type.includes('email')) return 'EMAIL';
        if (type.includes('meeting') || type.includes('person') || type.includes('visit')) return 'MEETING';
        return 'OTHER';
      }
    },
    {
      excelColumn: 'Organizations\r\n(Formula)',
      dbField: 'organizationName',
      dbTable: 'Interaction',
      dataType: 'string',
      required: true,
      notes: 'Will be resolved to organizationId via lookup'
    },
    {
      excelColumn: 'CONTACT \r\n(Dropdown)',
      dbField: 'contactName',
      dbTable: 'Interaction',
      dataType: 'string',
      notes: 'Will be resolved to contactId via lookup'
    },
    {
      excelColumn: 'ACCT.    MANAGER \r\n(Dropdown)',
      dbField: 'accountManager',
      dbTable: 'Interaction',
      dataType: 'string',
      notes: 'Will be resolved to userId via lookup'
    },
    {
      excelColumn: 'OPPORTUNITY',
      dbField: 'opportunityName',
      dbTable: 'Interaction',
      dataType: 'string',
      notes: 'Will be resolved to opportunityId via lookup'
    },
    {
      excelColumn: 'PRINCIPAL',
      dbField: 'principal',
      dbTable: 'Interaction',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null,
      notes: 'Custom field - may need to be stored in metadata'
    },
    {
      excelColumn: 'NOTES',
      dbField: 'notes',
      dbTable: 'Interaction',
      dataType: 'string',
      transform: (value: any) => value ? String(value).trim() : null
    }
  ]
};

// Helper function to get mapping for a specific sheet and column
export function getFieldMapping(sheetName: string, columnName: string): FieldMapping | undefined {
  const sheetMappings = fieldMappingConfig[sheetName];
  if (!sheetMappings) return undefined;
  
  return sheetMappings.find(mapping => 
    mapping.excelColumn === columnName || 
    mapping.excelColumn.replace(/\r\n/g, ' ') === columnName
  );
}

// Helper function to validate a row of data
export function validateRow(sheetName: string, rowData: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const sheetMappings = fieldMappingConfig[sheetName];
  if (!sheetMappings) {
    return { isValid: false, errors: ['Unknown sheet'] };
  }
  
  const errors: string[] = [];
  
  for (const mapping of sheetMappings) {
    const value = rowData[mapping.excelColumn];
    
    // Check required fields
    if (mapping.required && (value === null || value === undefined || value === '')) {
      errors.push(`${mapping.excelColumn} is required`);
    }
    
    // Run validation if provided
    if (mapping.validation && value !== null && value !== undefined) {
      if (!mapping.validation(value)) {
        errors.push(`${mapping.excelColumn} has invalid value: ${value}`);
      }
    }
    
    // Check enum values
    if (mapping.enumValues && value) {
      const transformedValue = mapping.transform ? mapping.transform(value) : value;
      if (!mapping.enumValues.includes(transformedValue)) {
        errors.push(`${mapping.excelColumn} must be one of: ${mapping.enumValues.join(', ')}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to transform a row of data
export function transformRow(sheetName: string, rowData: Record<string, any>): Record<string, any> {
  const sheetMappings = fieldMappingConfig[sheetName];
  if (!sheetMappings) return {};
  
  const transformed: Record<string, any> = {};
  
  for (const mapping of sheetMappings) {
    const value = rowData[mapping.excelColumn];
    
    if (value === null || value === undefined || value === '') {
      // Use default value if provided
      if (mapping.defaultValue !== undefined) {
        transformed[mapping.dbField] = mapping.defaultValue;
      }
      continue;
    }
    
    // Apply transformation
    transformed[mapping.dbField] = mapping.transform ? mapping.transform(value) : value;
  }
  
  return transformed;
}

export default fieldMappingConfig;