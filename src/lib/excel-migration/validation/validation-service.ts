/**
 * Validation Service for Excel Migration
 * Implements multi-layer validation with detailed error tracking
 * 
 * Based on:
 * - Entity, Referential, Domain, and Business Rule Integrity
 * - Batch processing for Azure B1 optimization
 * - Detailed error reporting for data quality monitoring
 */

import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  OrganizationValidationSchema,
  ContactValidationSchema,
  InteractionValidationSchema,
  OpportunityValidationSchema,
  CrossEntityValidations,
  calculateDataQualityScore
} from './data-validation-rules';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  dataQualityScore: number;
  processedCount: number;
  errorCount: number;
  warningCount: number;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  errorType: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'REFERENCE' | 'BUSINESS_RULE' | 'DUPLICATE';
  severity: 'ERROR' | 'CRITICAL';
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  suggestion?: string;
}

export interface BatchValidationOptions {
  batchSize: number;
  stopOnError: boolean;
  validateReferences: boolean;
  checkDuplicates: boolean;
  calculateQuality: boolean;
}

export class ValidationService {
  private prisma: PrismaClient;
  private cache: Map<string, Set<string>>;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = new Map();
  }

  /**
   * Validate a batch of organization records
   */
  async validateOrganizations(
    records: any[],
    options: BatchValidationOptions = {
      batchSize: 100,
      stopOnError: false,
      validateReferences: true,
      checkDuplicates: true,
      calculateQuality: true
    }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dataQualityScore: 0,
      processedCount: 0,
      errorCount: 0,
      warningCount: 0
    };

    // Pre-load existing organizations for duplicate checking
    if (options.checkDuplicates) {
      await this.loadOrganizationCache();
    }

    let totalQualityScore = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;
      
      try {
        // Schema validation
        const validated = await OrganizationValidationSchema.parseAsync(record);
        
        // Duplicate checking
        if (options.checkDuplicates) {
          const duplicateError = await this.checkOrganizationDuplicate(
            validated.name,
            validated.email,
            rowNumber
          );
          if (duplicateError) {
            result.errors.push(duplicateError);
            result.errorCount++;
            if (options.stopOnError) break;
          }
        }
        
        // Business rule validations
        const businessRuleErrors = this.validateOrganizationBusinessRules(validated, rowNumber);
        result.errors.push(...businessRuleErrors);
        result.errorCount += businessRuleErrors.length;
        
        // Data quality warnings
        const warnings = this.generateOrganizationWarnings(validated, rowNumber);
        result.warnings.push(...warnings);
        result.warningCount += warnings.length;
        
        // Calculate quality score
        if (options.calculateQuality) {
          const qualityScore = calculateDataQualityScore(validated, 'organization');
          totalQualityScore += qualityScore;
          
          if (qualityScore < 70) {
            result.warnings.push({
              row: rowNumber,
              field: 'overall',
              message: `Low data quality score: ${qualityScore}%`,
              suggestion: 'Consider adding more contact information and keeping data up-to-date'
            });
          }
        }
        
        result.processedCount++;
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push(...this.zodErrorsToValidationErrors(error, rowNumber));
          result.errorCount += error.errors.length;
        } else {
          result.errors.push({
            row: rowNumber,
            field: 'unknown',
            value: record,
            message: error instanceof Error ? error.message : 'Unknown validation error',
            errorType: 'BUSINESS_RULE',
            severity: 'ERROR'
          });
          result.errorCount++;
        }
        
        if (options.stopOnError) break;
      }
    }
    
    // Calculate average quality score
    if (result.processedCount > 0 && options.calculateQuality) {
      result.dataQualityScore = Math.round(totalQualityScore / result.processedCount);
    }
    
    result.isValid = result.errorCount === 0;
    return result;
  }

  /**
   * Validate a batch of contact records
   */
  async validateContacts(
    records: any[],
    options: BatchValidationOptions = {
      batchSize: 100,
      stopOnError: false,
      validateReferences: true,
      checkDuplicates: true,
      calculateQuality: true
    }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dataQualityScore: 0,
      processedCount: 0,
      errorCount: 0,
      warningCount: 0
    };

    // Pre-load organization IDs for reference validation
    if (options.validateReferences) {
      await this.loadOrganizationIdCache();
    }

    let totalQualityScore = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;
      
      try {
        // Schema validation
        const validated = await ContactValidationSchema.parseAsync(record);
        
        // Reference validation
        if (options.validateReferences && validated.organizationId) {
          const refError = await this.validateOrganizationReference(
            validated.organizationId,
            rowNumber
          );
          if (refError) {
            result.errors.push(refError);
            result.errorCount++;
            if (options.stopOnError) break;
          }
        }
        
        // Check for duplicate primary contacts
        if (validated.isPrimary && options.checkDuplicates) {
          const primaryError = await this.checkPrimaryContactDuplicate(
            validated.organizationId,
            rowNumber
          );
          if (primaryError) {
            result.errors.push(primaryError);
            result.errorCount++;
          }
        }
        
        // Business rule validations
        const businessRuleErrors = this.validateContactBusinessRules(validated, rowNumber);
        result.errors.push(...businessRuleErrors);
        result.errorCount += businessRuleErrors.length;
        
        // Data quality warnings
        const warnings = this.generateContactWarnings(validated, rowNumber);
        result.warnings.push(...warnings);
        result.warningCount += warnings.length;
        
        // Calculate quality score
        if (options.calculateQuality) {
          const qualityScore = calculateDataQualityScore(validated, 'contact');
          totalQualityScore += qualityScore;
        }
        
        result.processedCount++;
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push(...this.zodErrorsToValidationErrors(error, rowNumber));
          result.errorCount += error.errors.length;
        } else {
          result.errors.push({
            row: rowNumber,
            field: 'unknown',
            value: record,
            message: error instanceof Error ? error.message : 'Unknown validation error',
            errorType: 'BUSINESS_RULE',
            severity: 'ERROR'
          });
          result.errorCount++;
        }
        
        if (options.stopOnError) break;
      }
    }
    
    // Calculate average quality score
    if (result.processedCount > 0 && options.calculateQuality) {
      result.dataQualityScore = Math.round(totalQualityScore / result.processedCount);
    }
    
    result.isValid = result.errorCount === 0;
    return result;
  }

  /**
   * Validate a batch of interaction records
   */
  async validateInteractions(
    records: any[],
    options: BatchValidationOptions = {
      batchSize: 100,
      stopOnError: false,
      validateReferences: true,
      checkDuplicates: false,
      calculateQuality: true
    }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dataQualityScore: 0,
      processedCount: 0,
      errorCount: 0,
      warningCount: 0
    };

    // Pre-load caches for reference validation
    if (options.validateReferences) {
      await Promise.all([
        this.loadOrganizationIdCache(),
        this.loadContactIdCache()
      ]);
    }

    let totalQualityScore = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;
      
      try {
        // Schema validation
        const validated = await InteractionValidationSchema.parseAsync(record);
        
        // Reference validations
        if (options.validateReferences) {
          const orgError = await this.validateOrganizationReference(
            validated.organizationId,
            rowNumber
          );
          if (orgError) {
            result.errors.push(orgError);
            result.errorCount++;
            if (options.stopOnError) break;
          }
          
          if (validated.contactId) {
            const contactError = await this.validateContactReference(
              validated.contactId,
              rowNumber
            );
            if (contactError) {
              result.errors.push(contactError);
              result.errorCount++;
            }
          }
        }
        
        // Business rule validations
        const businessRuleErrors = this.validateInteractionBusinessRules(validated, rowNumber);
        result.errors.push(...businessRuleErrors);
        result.errorCount += businessRuleErrors.length;
        
        // Data quality warnings
        const warnings = this.generateInteractionWarnings(validated, rowNumber);
        result.warnings.push(...warnings);
        result.warningCount += warnings.length;
        
        // Calculate quality score
        if (options.calculateQuality) {
          const qualityScore = calculateDataQualityScore(validated, 'interaction');
          totalQualityScore += qualityScore;
        }
        
        result.processedCount++;
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push(...this.zodErrorsToValidationErrors(error, rowNumber));
          result.errorCount += error.errors.length;
        } else {
          result.errors.push({
            row: rowNumber,
            field: 'unknown',
            value: record,
            message: error instanceof Error ? error.message : 'Unknown validation error',
            errorType: 'BUSINESS_RULE',
            severity: 'ERROR'
          });
          result.errorCount++;
        }
        
        if (options.stopOnError) break;
      }
    }
    
    // Calculate average quality score
    if (result.processedCount > 0 && options.calculateQuality) {
      result.dataQualityScore = Math.round(totalQualityScore / result.processedCount);
    }
    
    result.isValid = result.errorCount === 0;
    return result;
  }

  /**
   * Validate a batch of opportunity records
   */
  async validateOpportunities(
    records: any[],
    options: BatchValidationOptions = {
      batchSize: 100,
      stopOnError: false,
      validateReferences: true,
      checkDuplicates: false,
      calculateQuality: true
    }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dataQualityScore: 0,
      processedCount: 0,
      errorCount: 0,
      warningCount: 0
    };

    // Pre-load caches for reference validation
    if (options.validateReferences) {
      await Promise.all([
        this.loadOrganizationIdCache(),
        this.loadContactIdCache()
      ]);
    }

    let totalQualityScore = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;
      
      try {
        // Schema validation
        const validated = await OpportunityValidationSchema.parseAsync(record);
        
        // Reference validations
        if (options.validateReferences) {
          const orgError = await this.validateOrganizationReference(
            validated.organizationId,
            rowNumber
          );
          if (orgError) {
            result.errors.push(orgError);
            result.errorCount++;
            if (options.stopOnError) break;
          }
          
          if (validated.contactId) {
            const contactError = await this.validateContactReference(
              validated.contactId,
              rowNumber
            );
            if (contactError) {
              result.errors.push(contactError);
              result.errorCount++;
            }
            
            // Validate contact belongs to organization
            if (!orgError && !contactError) {
              try {
                await CrossEntityValidations.validateContactOrganization(
                  validated.contactId,
                  validated.organizationId,
                  this.prisma
                );
              } catch (error) {
                result.errors.push({
                  row: rowNumber,
                  field: 'contactId',
                  value: validated.contactId,
                  message: 'Contact does not belong to the specified organization',
                  errorType: 'REFERENCE',
                  severity: 'ERROR'
                });
                result.errorCount++;
              }
            }
          }
        }
        
        // Business rule validations
        const businessRuleErrors = this.validateOpportunityBusinessRules(validated, rowNumber);
        result.errors.push(...businessRuleErrors);
        result.errorCount += businessRuleErrors.length;
        
        // Data quality warnings
        const warnings = this.generateOpportunityWarnings(validated, rowNumber);
        result.warnings.push(...warnings);
        result.warningCount += warnings.length;
        
        // Calculate quality score
        if (options.calculateQuality) {
          const qualityScore = calculateDataQualityScore(validated, 'opportunity');
          totalQualityScore += qualityScore;
        }
        
        result.processedCount++;
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.errors.push(...this.zodErrorsToValidationErrors(error, rowNumber));
          result.errorCount += error.errors.length;
        } else {
          result.errors.push({
            row: rowNumber,
            field: 'unknown',
            value: record,
            message: error instanceof Error ? error.message : 'Unknown validation error',
            errorType: 'BUSINESS_RULE',
            severity: 'ERROR'
          });
          result.errorCount++;
        }
        
        if (options.stopOnError) break;
      }
    }
    
    // Calculate average quality score
    if (result.processedCount > 0 && options.calculateQuality) {
      result.dataQualityScore = Math.round(totalQualityScore / result.processedCount);
    }
    
    result.isValid = result.errorCount === 0;
    return result;
  }

  // ===== Private Helper Methods =====

  private zodErrorsToValidationErrors(zodError: z.ZodError, rowNumber: number): ValidationError[] {
    return zodError.errors.map(err => ({
      row: rowNumber,
      field: err.path.join('.'),
      value: err.input,
      message: err.message,
      errorType: this.getErrorType(err),
      severity: this.getErrorSeverity(err)
    }));
  }

  private getErrorType(zodError: z.ZodIssue): ValidationError['errorType'] {
    if (zodError.code === 'invalid_type' && zodError.expected === 'string' && zodError.received === 'undefined') {
      return 'REQUIRED';
    }
    if (zodError.code === 'invalid_string' || zodError.code === 'invalid_enum_value') {
      return 'FORMAT';
    }
    if (zodError.code === 'too_small' || zodError.code === 'too_big') {
      return 'RANGE';
    }
    return 'BUSINESS_RULE';
  }

  private getErrorSeverity(zodError: z.ZodIssue): ValidationError['severity'] {
    // Critical errors that must be fixed
    if (zodError.path.includes('id') || zodError.path.includes('organizationId')) {
      return 'CRITICAL';
    }
    return 'ERROR';
  }

  // ===== Cache Management =====

  private async loadOrganizationCache(): Promise<void> {
    const orgs = await this.prisma.organization.findMany({
      select: { name: true, email: true }
    });
    
    const nameSet = new Set<string>();
    const emailSet = new Set<string>();
    
    orgs.forEach(org => {
      if (org.name) nameSet.add(org.name.toLowerCase());
      if (org.email) emailSet.add(org.email.toLowerCase());
    });
    
    this.cache.set('org_names', nameSet);
    this.cache.set('org_emails', emailSet);
  }

  private async loadOrganizationIdCache(): Promise<void> {
    const orgIds = await this.prisma.organization.findMany({
      select: { id: true }
    });
    
    const idSet = new Set<string>(orgIds.map(o => o.id));
    this.cache.set('org_ids', idSet);
  }

  private async loadContactIdCache(): Promise<void> {
    const contactIds = await this.prisma.contact.findMany({
      select: { id: true }
    });
    
    const idSet = new Set<string>(contactIds.map(c => c.id));
    this.cache.set('contact_ids', idSet);
  }

  // ===== Duplicate Checking =====

  private async checkOrganizationDuplicate(
    name: string,
    email: string | null | undefined,
    rowNumber: number
  ): Promise<ValidationError | null> {
    const nameCache = this.cache.get('org_names');
    const emailCache = this.cache.get('org_emails');
    
    if (nameCache?.has(name.toLowerCase())) {
      return {
        row: rowNumber,
        field: 'name',
        value: name,
        message: `Organization with name "${name}" already exists`,
        errorType: 'DUPLICATE',
        severity: 'ERROR'
      };
    }
    
    if (email && emailCache?.has(email.toLowerCase())) {
      return {
        row: rowNumber,
        field: 'email',
        value: email,
        message: `Organization with email "${email}" already exists`,
        errorType: 'DUPLICATE',
        severity: 'ERROR'
      };
    }
    
    return null;
  }

  private async checkPrimaryContactDuplicate(
    organizationId: string,
    rowNumber: number
  ): Promise<ValidationError | null> {
    const existing = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        isPrimary: true
      }
    });
    
    if (existing) {
      return {
        row: rowNumber,
        field: 'isPrimary',
        value: true,
        message: `Organization already has a primary contact`,
        errorType: 'DUPLICATE',
        severity: 'ERROR'
      };
    }
    
    return null;
  }

  // ===== Reference Validation =====

  private async validateOrganizationReference(
    organizationId: string,
    rowNumber: number
  ): Promise<ValidationError | null> {
    const cache = this.cache.get('org_ids');
    if (cache && !cache.has(organizationId)) {
      return {
        row: rowNumber,
        field: 'organizationId',
        value: organizationId,
        message: `Organization with ID "${organizationId}" not found`,
        errorType: 'REFERENCE',
        severity: 'CRITICAL'
      };
    }
    return null;
  }

  private async validateContactReference(
    contactId: string,
    rowNumber: number
  ): Promise<ValidationError | null> {
    const cache = this.cache.get('contact_ids');
    if (cache && !cache.has(contactId)) {
      return {
        row: rowNumber,
        field: 'contactId',
        value: contactId,
        message: `Contact with ID "${contactId}" not found`,
        errorType: 'REFERENCE',
        severity: 'ERROR'
      };
    }
    return null;
  }

  // ===== Business Rule Validations =====

  private validateOrganizationBusinessRules(org: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // High priority organizations should have complete data
    if (org.priority === 'HIGH') {
      if (!org.phone && !org.email) {
        errors.push({
          row: rowNumber,
          field: 'contact',
          value: null,
          message: 'High priority organizations must have phone or email',
          errorType: 'BUSINESS_RULE',
          severity: 'ERROR'
        });
      }
      
      if (!org.estimatedRevenue) {
        errors.push({
          row: rowNumber,
          field: 'estimatedRevenue',
          value: null,
          message: 'High priority organizations should have estimated revenue',
          errorType: 'BUSINESS_RULE',
          severity: 'ERROR'
        });
      }
    }
    
    // Inactive organizations should have a reason
    if (org.status === 'INACTIVE' && !org.notes) {
      errors.push({
        row: rowNumber,
        field: 'notes',
        value: null,
        message: 'Inactive organizations should have notes explaining the reason',
        errorType: 'BUSINESS_RULE',
        severity: 'ERROR'
      });
    }
    
    return errors;
  }

  private validateContactBusinessRules(contact: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Food service specific: Key positions should have complete contact info
    const keyPositions = ['OWNER', 'GENERAL MANAGER', 'EXECUTIVE CHEF', 'FOOD BUYER'];
    if (contact.position && keyPositions.includes(contact.position.toUpperCase())) {
      if (!contact.email && !contact.phone) {
        errors.push({
          row: rowNumber,
          field: 'contact',
          value: null,
          message: `${contact.position} should have email or phone number`,
          errorType: 'BUSINESS_RULE',
          severity: 'ERROR'
        });
      }
    }
    
    return errors;
  }

  private validateInteractionBusinessRules(interaction: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Validate business hours
    if (interaction.date && interaction.type) {
      const isValidTime = CrossEntityValidations.validateBusinessHours(
        new Date(interaction.date),
        interaction.type
      );
      
      if (!isValidTime) {
        errors.push({
          row: rowNumber,
          field: 'date',
          value: interaction.date,
          message: `${interaction.type} interactions should not occur during typical service hours`,
          errorType: 'BUSINESS_RULE',
          severity: 'ERROR'
        });
      }
    }
    
    // Follow-up needed requires next action
    if (interaction.outcome === 'FOLLOW_UP_NEEDED' && !interaction.nextAction) {
      errors.push({
        row: rowNumber,
        field: 'nextAction',
        value: null,
        message: 'Interactions requiring follow-up must specify next action',
        errorType: 'BUSINESS_RULE',
        severity: 'ERROR'
      });
    }
    
    return errors;
  }

  private validateOpportunityBusinessRules(opportunity: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Stage-probability alignment
    const stageProbabilityRules: Record<string, { min: number; max: number }> = {
      'PROSPECT': { min: 0, max: 25 },
      'QUALIFIED': { min: 20, max: 50 },
      'PROPOSAL': { min: 40, max: 75 },
      'NEGOTIATION': { min: 60, max: 90 },
      'CLOSED_WON': { min: 100, max: 100 },
      'CLOSED_LOST': { min: 0, max: 0 }
    };
    
    const rule = stageProbabilityRules[opportunity.stage];
    if (rule && (opportunity.probability < rule.min || opportunity.probability > rule.max)) {
      errors.push({
        row: rowNumber,
        field: 'probability',
        value: opportunity.probability,
        message: `Probability ${opportunity.probability}% is unusual for stage ${opportunity.stage} (expected ${rule.min}-${rule.max}%)`,
        errorType: 'BUSINESS_RULE',
        severity: 'ERROR'
      });
    }
    
    // Closed opportunities should have a reason
    if (['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage) && !opportunity.reason) {
      errors.push({
        row: rowNumber,
        field: 'reason',
        value: null,
        message: 'Closed opportunities should have a reason',
        errorType: 'BUSINESS_RULE',
        severity: 'ERROR'
      });
    }
    
    // High-value opportunities should have contact
    if (opportunity.value && opportunity.value > 10000 && !opportunity.contactId) {
      errors.push({
        row: rowNumber,
        field: 'contactId',
        value: null,
        message: 'High-value opportunities (>$10k) should have a contact person',
        errorType: 'BUSINESS_RULE',
        severity: 'ERROR'
      });
    }
    
    return errors;
  }

  // ===== Warning Generation =====

  private generateOrganizationWarnings(org: any, rowNumber: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (!org.segment) {
      warnings.push({
        row: rowNumber,
        field: 'segment',
        message: 'Missing segment classification',
        suggestion: 'Add segment (e.g., FINE_DINING, CASUAL_DINING) for better categorization'
      });
    }
    
    if (!org.lastContactDate) {
      warnings.push({
        row: rowNumber,
        field: 'lastContactDate',
        message: 'No contact history recorded',
        suggestion: 'Update after first interaction'
      });
    } else {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(org.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceContact > 90 && daysSinceContact <= 180) {
        warnings.push({
          row: rowNumber,
          field: 'lastContactDate',
          message: `No contact in ${daysSinceContact} days`,
          suggestion: 'Consider scheduling a follow-up'
        });
      }
    }
    
    if (!org.estimatedRevenue && org.type === 'CUSTOMER') {
      warnings.push({
        row: rowNumber,
        field: 'estimatedRevenue',
        message: 'Customer without revenue estimate',
        suggestion: 'Add estimated annual revenue for better opportunity scoring'
      });
    }
    
    return warnings;
  }

  private generateContactWarnings(contact: any, rowNumber: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (!contact.position) {
      warnings.push({
        row: rowNumber,
        field: 'position',
        message: 'Missing position/title',
        suggestion: 'Add position for better contact management'
      });
    }
    
    if (!contact.email && !contact.phone) {
      warnings.push({
        row: rowNumber,
        field: 'contact',
        message: 'No contact method available',
        suggestion: 'Add email or phone number'
      });
    }
    
    return warnings;
  }

  private generateInteractionWarnings(interaction: any, rowNumber: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (!interaction.description) {
      warnings.push({
        row: rowNumber,
        field: 'description',
        message: 'Missing interaction details',
        suggestion: 'Add description for better history tracking'
      });
    }
    
    if (!interaction.outcome) {
      warnings.push({
        row: rowNumber,
        field: 'outcome',
        message: 'No outcome recorded',
        suggestion: 'Specify outcome (POSITIVE, NEUTRAL, NEGATIVE, FOLLOW_UP_NEEDED)'
      });
    }
    
    if (interaction.type === 'MEETING' && !interaction.duration) {
      warnings.push({
        row: rowNumber,
        field: 'duration',
        message: 'Meeting without duration',
        suggestion: 'Add meeting duration for time tracking'
      });
    }
    
    return warnings;
  }

  private generateOpportunityWarnings(opportunity: any, rowNumber: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (!opportunity.expectedCloseDate && opportunity.stage !== 'PROSPECT') {
      warnings.push({
        row: rowNumber,
        field: 'expectedCloseDate',
        message: 'No expected close date',
        suggestion: 'Add expected close date for pipeline forecasting'
      });
    }
    
    if (!opportunity.value) {
      warnings.push({
        row: rowNumber,
        field: 'value',
        message: 'No opportunity value specified',
        suggestion: 'Add estimated value for revenue forecasting'
      });
    }
    
    if (!opportunity.contactId) {
      warnings.push({
        row: rowNumber,
        field: 'contactId',
        message: 'No contact person assigned',
        suggestion: 'Assign a contact for better relationship management'
      });
    }
    
    return warnings;
  }

  /**
   * Generate a validation report
   */
  generateReport(results: Map<string, ValidationResult>): string {
    let report = '# Data Validation Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    
    for (const [entity, result] of results) {
      totalProcessed += result.processedCount;
      totalErrors += result.errorCount;
      totalWarnings += result.warningCount;
      
      report += `## ${entity}\n`;
      report += `- Records Processed: ${result.processedCount}\n`;
      report += `- Errors: ${result.errorCount}\n`;
      report += `- Warnings: ${result.warningCount}\n`;
      report += `- Data Quality Score: ${result.dataQualityScore}%\n`;
      report += `- Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
      
      if (result.errors.length > 0) {
        report += '### Errors\n';
        const errorsByType = this.groupErrorsByType(result.errors);
        for (const [type, errors] of Object.entries(errorsByType)) {
          report += `\n#### ${type} (${errors.length})\n`;
          errors.slice(0, 5).forEach(err => {
            report += `- Row ${err.row}: ${err.field} - ${err.message}\n`;
          });
          if (errors.length > 5) {
            report += `- ... and ${errors.length - 5} more\n`;
          }
        }
      }
      
      if (result.warnings.length > 0) {
        report += '\n### Warnings\n';
        result.warnings.slice(0, 10).forEach(warn => {
          report += `- Row ${warn.row}: ${warn.field} - ${warn.message}\n`;
          if (warn.suggestion) {
            report += `  💡 ${warn.suggestion}\n`;
          }
        });
        if (result.warnings.length > 10) {
          report += `- ... and ${result.warnings.length - 10} more warnings\n`;
        }
      }
      
      report += '\n---\n\n';
    }
    
    report += '## Summary\n';
    report += `- Total Records: ${totalProcessed}\n`;
    report += `- Total Errors: ${totalErrors}\n`;
    report += `- Total Warnings: ${totalWarnings}\n`;
    report += `- Overall Status: ${totalErrors === 0 ? '✅ READY FOR MIGRATION' : '❌ REQUIRES FIXES'}\n`;
    
    return report;
  }

  private groupErrorsByType(errors: ValidationError[]): Record<string, ValidationError[]> {
    const grouped: Record<string, ValidationError[]> = {};
    
    errors.forEach(error => {
      if (!grouped[error.errorType]) {
        grouped[error.errorType] = [];
      }
      grouped[error.errorType].push(error);
    });
    
    return grouped;
  }
}