import { stringSimilarity } from './utils/string-similarity';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  reasons: string[];
  dataTypeMatch: boolean;
  semanticMatch: boolean;
  patternMatch: boolean;
  businessRuleMatch: boolean;
}

export interface ConfidenceScore {
  overall: number;
  components: {
    semantic: number;
    dataType: number;
    pattern: number;
    businessRule: number;
    dataQuality: number;
  };
  flags: string[];
  recommendations: string[];
}

export class ConfidenceEngine {
  // Common field name synonyms and variations
  private readonly fieldSynonyms: Record<string, string[]> = {
    organization: ['company', 'business', 'account', 'org', 'firm', 'enterprise', 'client'],
    contact: ['person', 'individual', 'lead', 'customer', 'client'],
    firstName: ['first_name', 'fname', 'given_name', 'forename'],
    lastName: ['last_name', 'lname', 'surname', 'family_name'],
    email: ['email_address', 'e-mail', 'mail', 'email_id'],
    phone: ['telephone', 'phone_number', 'tel', 'mobile', 'cell'],
    address: ['street', 'street_address', 'location', 'addr'],
    city: ['town', 'municipality', 'locality'],
    state: ['province', 'region', 'state_province'],
    zipCode: ['zip', 'postal_code', 'postcode', 'zip_code'],
    notes: ['description', 'comments', 'remarks', 'memo'],
    status: ['stage', 'phase', 'state', 'condition'],
    type: ['category', 'kind', 'classification'],
    value: ['amount', 'price', 'cost', 'revenue'],
    date: ['datetime', 'timestamp', 'when', 'created', 'updated'],
    priority: ['importance', 'urgency', 'rank', 'level'],
    segment: ['sector', 'industry', 'market', 'division']
  };

  // Data type patterns
  private readonly dataTypePatterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\d\s\-\(\)\+\.]+$/,
    date: /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/,
    url: /^https?:\/\//,
    zipCode: /^\d{5}(-\d{4})?$/,
    numeric: /^-?\d+(\.\d+)?$/,
    integer: /^-?\d+$/,
    boolean: /^(true|false|yes|no|1|0|y|n)$/i,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  };

  // Business rules for specific fields
  private readonly businessRules: Record<string, (value: any) => boolean> = {
    priority: (value) => /^[A-D]$/i.test(String(value)),
    probability: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    employeeCount: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num < 1000000;
    },
    revenue: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    }
  };

  /**
   * Calculate overall confidence score for a field mapping
   */
  calculateFieldMappingConfidence(
    sourceField: string,
    targetField: string,
    sampleData: any[],
    targetDataType: string
  ): FieldMapping {
    const semanticScore = this.calculateSemanticSimilarity(sourceField, targetField);
    const dataTypeScore = this.calculateDataTypeCompatibility(sampleData, targetDataType);
    const patternScore = this.calculatePatternMatch(sampleData, targetField);
    const businessRuleScore = this.calculateBusinessRuleMatch(sampleData, targetField);

    // Weighted average of all scores
    const weights = {
      semantic: 0.3,
      dataType: 0.3,
      pattern: 0.2,
      businessRule: 0.2
    };

    const overallConfidence = 
      semanticScore * weights.semantic +
      dataTypeScore * weights.dataType +
      patternScore * weights.pattern +
      businessRuleScore * weights.businessRule;

    const reasons = this.generateMappingReasons(
      semanticScore,
      dataTypeScore,
      patternScore,
      businessRuleScore
    );

    return {
      sourceField,
      targetField,
      confidence: Math.round(overallConfidence * 10) / 10, // Round to 1 decimal
      reasons,
      dataTypeMatch: dataTypeScore >= 0.7,
      semanticMatch: semanticScore >= 0.7,
      patternMatch: patternScore >= 0.7,
      businessRuleMatch: businessRuleScore >= 0.7
    };
  }

  /**
   * Calculate semantic similarity between field names
   */
  private calculateSemanticSimilarity(sourceField: string, targetField: string): number {
    const source = this.normalizeFieldName(sourceField);
    const target = this.normalizeFieldName(targetField);

    // Direct match
    if (source === target) return 1.0;

    // Check synonyms
    for (const [key, synonyms] of Object.entries(this.fieldSynonyms)) {
      if (target.includes(key) || key.includes(target)) {
        for (const synonym of synonyms) {
          if (source.includes(synonym) || synonym.includes(source)) {
            return 0.9;
          }
        }
      }
    }

    // Use string similarity algorithm
    return stringSimilarity(source, target);
  }

  /**
   * Calculate data type compatibility
   */
  private calculateDataTypeCompatibility(sampleData: any[], targetDataType: string): number {
    if (!sampleData || sampleData.length === 0) return 0.5; // Neutral score for no data

    const validSamples = sampleData.filter(val => val != null && val !== '');
    if (validSamples.length === 0) return 0.5;

    let compatibleCount = 0;
    
    for (const value of validSamples) {
      if (this.isDataTypeCompatible(value, targetDataType)) {
        compatibleCount++;
      }
    }

    return compatibleCount / validSamples.length;
  }

  /**
   * Check if a value is compatible with target data type
   */
  private isDataTypeCompatible(value: any, targetDataType: string): boolean {
    const stringValue = String(value);

    switch (targetDataType.toLowerCase()) {
      case 'string':
      case 'text':
        return true; // Everything can be a string

      case 'number':
      case 'int':
      case 'integer':
      case 'float':
      case 'decimal':
        return this.dataTypePatterns.numeric.test(stringValue);

      case 'boolean':
      case 'bool':
        return this.dataTypePatterns.boolean.test(stringValue);

      case 'date':
      case 'datetime':
      case 'timestamp':
        return this.dataTypePatterns.date.test(stringValue) || !isNaN(Date.parse(stringValue));

      case 'email':
        return this.dataTypePatterns.email.test(stringValue);

      case 'phone':
        return this.dataTypePatterns.phone.test(stringValue) && stringValue.replace(/\D/g, '').length >= 10;

      default:
        return true; // Unknown type, assume compatible
    }
  }

  /**
   * Calculate pattern match score
   */
  private calculatePatternMatch(sampleData: any[], targetField: string): number {
    const validSamples = sampleData?.filter(val => val != null && val !== '') || [];
    if (validSamples.length === 0) return 0.5;

    const fieldLower = targetField.toLowerCase();
    let patternKey: keyof typeof this.dataTypePatterns | null = null;

    // Map field names to pattern types
    if (fieldLower.includes('email')) patternKey = 'email';
    else if (fieldLower.includes('phone') || fieldLower.includes('tel')) patternKey = 'phone';
    else if (fieldLower.includes('zip') || fieldLower.includes('postal')) patternKey = 'zipCode';
    else if (fieldLower.includes('date') || fieldLower.includes('time')) patternKey = 'date';
    else if (fieldLower.includes('url') || fieldLower.includes('website')) patternKey = 'url';
    else if (fieldLower.includes('id') && !fieldLower.includes('email')) patternKey = 'uuid';

    if (!patternKey) return 0.7; // No specific pattern expected

    const pattern = this.dataTypePatterns[patternKey];
    let matchCount = 0;

    for (const value of validSamples) {
      if (pattern.test(String(value))) {
        matchCount++;
      }
    }

    return matchCount / validSamples.length;
  }

  /**
   * Calculate business rule match score
   */
  private calculateBusinessRuleMatch(sampleData: any[], targetField: string): number {
    const fieldLower = targetField.toLowerCase();
    const rule = Object.entries(this.businessRules).find(([key]) => 
      fieldLower.includes(key.toLowerCase())
    );

    if (!rule) return 0.8; // No specific business rule

    const [, validator] = rule;
    const validSamples = sampleData?.filter(val => val != null && val !== '') || [];
    
    if (validSamples.length === 0) return 0.5;

    let validCount = 0;
    for (const value of validSamples) {
      if (validator(value)) {
        validCount++;
      }
    }

    return validCount / validSamples.length;
  }

  /**
   * Generate human-readable reasons for mapping confidence
   */
  private generateMappingReasons(
    semanticScore: number,
    dataTypeScore: number,
    patternScore: number,
    businessRuleScore: number
  ): string[] {
    const reasons: string[] = [];

    if (semanticScore >= 0.9) reasons.push('Field names are very similar');
    else if (semanticScore >= 0.7) reasons.push('Field names are somewhat similar');
    else if (semanticScore < 0.5) reasons.push('Field names are quite different');

    if (dataTypeScore >= 0.9) reasons.push('Data types are fully compatible');
    else if (dataTypeScore >= 0.7) reasons.push('Data types are mostly compatible');
    else if (dataTypeScore < 0.5) reasons.push('Data type compatibility issues detected');

    if (patternScore >= 0.9) reasons.push('Data patterns match expected format');
    else if (patternScore < 0.5) reasons.push('Data patterns do not match expected format');

    if (businessRuleScore >= 0.9) reasons.push('Business rules are satisfied');
    else if (businessRuleScore < 0.5) reasons.push('Business rule violations detected');

    return reasons;
  }

  /**
   * Normalize field names for comparison
   */
  private normalizeFieldName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[_\-\s]+/g, '') // Remove separators
      .replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric
  }

  /**
   * Calculate overall migration confidence for a sheet
   */
  calculateSheetMigrationConfidence(mappings: FieldMapping[]): ConfidenceScore {
    if (mappings.length === 0) {
      return {
        overall: 0,
        components: {
          semantic: 0,
          dataType: 0,
          pattern: 0,
          businessRule: 0,
          dataQuality: 0
        },
        flags: ['No field mappings found'],
        recommendations: ['Manual mapping required']
      };
    }

    // Calculate component scores
    const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
    const highConfidenceMappings = mappings.filter(m => m.confidence >= 8).length;
    const lowConfidenceMappings = mappings.filter(m => m.confidence < 5).length;
    
    const components = {
      semantic: mappings.filter(m => m.semanticMatch).length / mappings.length,
      dataType: mappings.filter(m => m.dataTypeMatch).length / mappings.length,
      pattern: mappings.filter(m => m.patternMatch).length / mappings.length,
      businessRule: mappings.filter(m => m.businessRuleMatch).length / mappings.length,
      dataQuality: highConfidenceMappings / mappings.length
    };

    const flags: string[] = [];
    const recommendations: string[] = [];

    // Generate flags and recommendations
    if (lowConfidenceMappings > mappings.length * 0.3) {
      flags.push('Many low-confidence mappings detected');
      recommendations.push('Review and manually verify low-confidence mappings');
    }

    if (components.dataType < 0.7) {
      flags.push('Data type compatibility issues');
      recommendations.push('Create data transformation rules for incompatible types');
    }

    if (components.pattern < 0.7) {
      flags.push('Pattern matching issues');
      recommendations.push('Implement data cleaning and normalization');
    }

    if (avgConfidence < 6) {
      flags.push('Overall low confidence');
      recommendations.push('Consider manual review of all mappings');
    }

    return {
      overall: Math.round(avgConfidence * 10) / 10,
      components,
      flags,
      recommendations
    };
  }
}

// Utility function for string similarity (Levenshtein distance based)
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}