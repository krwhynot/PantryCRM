/**
 * Automated Validation Testing Suite
 * Tests comprehensive data validation rules for Excel migration
 * 
 * Test Categories:
 * 1. Schema validation (domain integrity)
 * 2. Business rule validation
 * 3. Referential integrity
 * 4. Data quality scoring
 * 5. Performance testing
 * 6. Edge cases
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ValidationService } from '../validation-service';
import {
  OrganizationValidationSchema,
  ContactValidationSchema,
  InteractionValidationSchema,
  OpportunityValidationSchema,
  calculateDataQualityScore,
  CrossEntityValidations
} from '../data-validation-rules';

// Mock Prisma
const mockPrisma = {
  organization: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn()
  },
  contact: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn()
  },
  interaction: {
    findMany: jest.fn()
  },
  opportunity: {
    findMany: jest.fn()
  }
} as unknown as PrismaClient;

describe('Data Validation Rules', () => {
  describe('Organization Validation', () => {
    test('should validate valid organization', async () => {
      const validOrg = {
        name: 'Test Restaurant',
        priority: 'HIGH',
        segment: 'FINE_DINING',
        type: 'PROSPECT',
        email: 'contact@testrestaurant.com',
        phone: '(555) 123-4567',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        estimatedRevenue: 1000000,
        employeeCount: 50,
        status: 'ACTIVE'
      };

      const result = await OrganizationValidationSchema.parseAsync(validOrg);
      expect(result.name).toBe('Test Restaurant');
      expect(result.priority).toBe('HIGH');
    });

    test('should reject invalid priority', async () => {
      const invalidOrg = {
        name: 'Test Restaurant',
        priority: 'INVALID',
        segment: 'FINE_DINING'
      };

      await expect(OrganizationValidationSchema.parseAsync(invalidOrg))
        .rejects.toThrow('Priority must be HIGH, MEDIUM, LOW, or NONE');
    });

    test('should reject invalid email format', async () => {
      const invalidOrg = {
        name: 'Test Restaurant',
        priority: 'HIGH',
        email: 'invalid-email'
      };

      await expect(OrganizationValidationSchema.parseAsync(invalidOrg))
        .rejects.toThrow('Invalid email format');
    });

    test('should reject invalid phone format', async () => {
      const invalidOrg = {
        name: 'Test Restaurant',
        priority: 'HIGH',
        phone: '123' // Too short
      };

      await expect(OrganizationValidationSchema.parseAsync(invalidOrg))
        .rejects.toThrow('Phone number must have at least 10 digits');
    });

    test('should reject invalid state code', async () => {
      const invalidOrg = {
        name: 'Test Restaurant',
        priority: 'HIGH',
        state: 'NEW YORK' // Should be 2-letter code
      };

      await expect(OrganizationValidationSchema.parseAsync(invalidOrg))
        .rejects.toThrow('State must be 2-letter code');
    });

    test('should reject negative revenue', async () => {
      const invalidOrg = {
        name: 'Test Restaurant',
        priority: 'HIGH',
        estimatedRevenue: -1000
      };

      await expect(OrganizationValidationSchema.parseAsync(invalidOrg))
        .rejects.toThrow('Revenue cannot be negative');
    });

    test('should validate food service segments', async () => {
      const validSegments = [
        'FINE_DINING', 'FAST_FOOD', 'CASUAL_DINING', 'CAFETERIA',
        'FOOD_TRUCK', 'CATERING', 'BAKERY', 'BREWERY'
      ];

      for (const segment of validSegments) {
        const org = {
          name: 'Test',
          priority: 'HIGH',
          segment
        };
        const result = await OrganizationValidationSchema.parseAsync(org);
        expect(result.segment).toBe(segment);
      }
    });
  });

  describe('Contact Validation', () => {
    test('should validate valid contact', async () => {
      const validContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@restaurant.com',
        phone: '(555) 987-6543',
        position: 'Executive Chef',
        isPrimary: true,
        organizationId: 'org123'
      };

      const result = await ContactValidationSchema.parseAsync(validContact);
      expect(result.firstName).toBe('John');
      expect(result.position).toBe('Executive Chef');
    });

    test('should reject names with numbers', async () => {
      const invalidContact = {
        firstName: 'John123',
        lastName: 'Doe',
        organizationId: 'org123'
      };

      await expect(ContactValidationSchema.parseAsync(invalidContact))
        .rejects.toThrow('First name cannot contain numbers');
    });

    test('should require organizationId', async () => {
      const invalidContact = {
        firstName: 'John',
        lastName: 'Doe',
        organizationId: ''
      };

      await expect(ContactValidationSchema.parseAsync(invalidContact))
        .rejects.toThrow('Organization ID is required for contact');
    });

    test('should validate food service positions', () => {
      const validPositions = [
        'OWNER', 'GENERAL MANAGER', 'EXECUTIVE CHEF', 'HEAD CHEF',
        'SOUS CHEF', 'KITCHEN MANAGER', 'FOOD BUYER', 'PURCHASING MANAGER'
      ];

      validPositions.forEach(async position => {
        const contact = {
          firstName: 'Test',
          lastName: 'User',
          position,
          organizationId: 'org123'
        };
        const result = await ContactValidationSchema.parseAsync(contact);
        expect(result.position).toBe(position);
      });
    });
  });

  describe('Interaction Validation', () => {
    test('should validate valid interaction', async () => {
      const validInteraction = {
        type: 'MEETING',
        subject: 'Menu Planning Discussion',
        description: 'Discussed new seasonal menu items',
        date: new Date('2024-01-15'),
        duration: 60,
        outcome: 'POSITIVE',
        organizationId: 'org123'
      };

      const result = await InteractionValidationSchema.parseAsync(validInteraction);
      expect(result.type).toBe('MEETING');
      expect(result.duration).toBe(60);
    });

    test('should reject future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidInteraction = {
        type: 'CALL',
        subject: 'Future Call',
        date: futureDate,
        organizationId: 'org123'
      };

      await expect(InteractionValidationSchema.parseAsync(invalidInteraction))
        .rejects.toThrow('Interaction date cannot be in the future');
    });

    test('should reject very old dates', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 6);

      const invalidInteraction = {
        type: 'CALL',
        subject: 'Old Call',
        date: oldDate,
        organizationId: 'org123'
      };

      await expect(InteractionValidationSchema.parseAsync(invalidInteraction))
        .rejects.toThrow('Interaction date cannot be more than 5 years in the past');
    });

    test('should validate food service interaction types', async () => {
      const foodServiceTypes = ['DEMO', 'TASTING', 'DELIVERY'];

      for (const type of foodServiceTypes) {
        const interaction = {
          type,
          subject: 'Test',
          date: new Date(),
          organizationId: 'org123'
        };
        const result = await InteractionValidationSchema.parseAsync(interaction);
        expect(result.type).toBe(type);
      }
    });

    test('should validate duration limits', async () => {
      const invalidInteraction = {
        type: 'MEETING',
        subject: 'Marathon Meeting',
        date: new Date(),
        duration: 500, // More than 8 hours
        organizationId: 'org123'
      };

      await expect(InteractionValidationSchema.parseAsync(invalidInteraction))
        .rejects.toThrow('Duration must be between 0 and 480 minutes');
    });
  });

  describe('Opportunity Validation', () => {
    test('should validate valid opportunity', async () => {
      const validOpportunity = {
        name: 'Q1 Produce Supply Contract',
        organizationId: 'org123',
        value: 50000,
        stage: 'PROPOSAL',
        probability: 60,
        expectedCloseDate: new Date('2024-03-31')
      };

      const result = await OpportunityValidationSchema.parseAsync(validOpportunity);
      expect(result.stage).toBe('PROPOSAL');
      expect(result.probability).toBe(60);
    });

    test('should validate probability range', async () => {
      const invalidOpp1 = {
        name: 'Test',
        organizationId: 'org123',
        probability: -10
      };

      await expect(OpportunityValidationSchema.parseAsync(invalidOpp1))
        .rejects.toThrow('Probability cannot be less than 0%');

      const invalidOpp2 = {
        name: 'Test',
        organizationId: 'org123',
        probability: 150
      };

      await expect(OpportunityValidationSchema.parseAsync(invalidOpp2))
        .rejects.toThrow('Probability cannot exceed 100%');
    });

    test('should validate value limits', async () => {
      const invalidOpp = {
        name: 'Test',
        organizationId: 'org123',
        value: 15000000 // More than $10M
      };

      await expect(OpportunityValidationSchema.parseAsync(invalidOpp))
        .rejects.toThrow('Value exceeds reasonable limit');
    });

    test('should validate close date limits', async () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 3);

      const invalidOpp = {
        name: 'Test',
        organizationId: 'org123',
        expectedCloseDate: farFuture
      };

      await expect(OpportunityValidationSchema.parseAsync(invalidOpp))
        .rejects.toThrow('Expected close date cannot be more than 2 years');
    });
  });

  describe('Cross-Entity Validations', () => {
    test('should validate stage transitions', () => {
      // Valid transitions
      expect(CrossEntityValidations.validateStageTransition('PROSPECT', 'QUALIFIED')).toBe(true);
      expect(CrossEntityValidations.validateStageTransition('QUALIFIED', 'PROPOSAL')).toBe(true);
      expect(CrossEntityValidations.validateStageTransition('PROPOSAL', 'CLOSED_LOST')).toBe(true);

      // Invalid transitions
      expect(CrossEntityValidations.validateStageTransition('PROPOSAL', 'PROSPECT')).toBe(false);
      expect(CrossEntityValidations.validateStageTransition('PROSPECT', 'NEGOTIATION')).toBe(false);
    });

    test('should validate business hours', () => {
      // Email can be sent anytime
      const emailDate = new Date('2024-01-15T23:00:00');
      expect(CrossEntityValidations.validateBusinessHours(emailDate, 'EMAIL')).toBe(true);

      // Visit during lunch service (invalid)
      const lunchVisit = new Date('2024-01-15T12:30:00');
      expect(CrossEntityValidations.validateBusinessHours(lunchVisit, 'VISIT')).toBe(false);

      // Visit during off-hours (valid)
      const morningVisit = new Date('2024-01-15T09:00:00');
      expect(CrossEntityValidations.validateBusinessHours(morningVisit, 'VISIT')).toBe(true);

      // Demo during dinner service (invalid)
      const dinnerDemo = new Date('2024-01-15T19:00:00');
      expect(CrossEntityValidations.validateBusinessHours(dinnerDemo, 'DEMO')).toBe(false);
    });

    test('should validate contact-organization relationship', async () => {
      const mockContact = { organizationId: 'org123' };
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(mockContact as any);

      await expect(
        CrossEntityValidations.validateContactOrganization('contact123', 'org123', mockPrisma)
      ).resolves.not.toThrow();

      await expect(
        CrossEntityValidations.validateContactOrganization('contact123', 'wrong-org', mockPrisma)
      ).rejects.toThrow('does not belong to organization');
    });

    test('should check for duplicate organizations', async () => {
      (mockPrisma.organization.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-org',
        name: 'Existing Restaurant'
      });

      await expect(
        CrossEntityValidations.validateUniqueOrganization(
          'Existing Restaurant',
          'email@test.com',
          mockPrisma
        )
      ).rejects.toThrow('already exists');

      (mockPrisma.organization.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        CrossEntityValidations.validateUniqueOrganization(
          'New Restaurant',
          'new@test.com',
          mockPrisma
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Data Quality Scoring', () => {
    test('should calculate organization quality score', () => {
      const highQualityOrg = {
        name: 'Premium Restaurant',
        priority: 'HIGH',
        segment: 'FINE_DINING',
        phone: '555-123-4567',
        email: 'contact@premium.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        estimatedRevenue: 2000000,
        employeeCount: 100,
        lastContactDate: new Date()
      };

      const score = calculateDataQualityScore(highQualityOrg, 'organization');
      expect(score).toBeGreaterThanOrEqual(90);
    });

    test('should penalize missing data', () => {
      const lowQualityOrg = {
        name: 'Basic Restaurant',
        priority: 'LOW'
      };

      const score = calculateDataQualityScore(lowQualityOrg, 'organization');
      expect(score).toBeLessThan(50);
    });

    test('should penalize stale data', () => {
      const staleDate = new Date();
      staleDate.setFullYear(staleDate.getFullYear() - 2);

      const staleOrg = {
        name: 'Stale Restaurant',
        priority: 'HIGH',
        lastContactDate: staleDate
      };

      const score = calculateDataQualityScore(staleOrg, 'organization');
      expect(score).toBeLessThan(80);
    });

    test('should calculate contact quality score', () => {
      const highQualityContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@restaurant.com',
        phone: '555-123-4567',
        position: 'Executive Chef'
      };

      const score = calculateDataQualityScore(highQualityContact, 'contact');
      expect(score).toBe(100);
    });

    test('should calculate interaction quality score', () => {
      const completeInteraction = {
        subject: 'Menu Review',
        description: 'Detailed discussion about seasonal menu changes',
        outcome: 'POSITIVE',
        nextAction: 'Send pricing proposal'
      };

      const score = calculateDataQualityScore(completeInteraction, 'interaction');
      expect(score).toBeGreaterThanOrEqual(85);
    });

    test('should calculate opportunity quality score', () => {
      const completeOpp = {
        value: 50000,
        expectedCloseDate: new Date('2024-03-31'),
        contactId: 'contact123',
        stage: 'PROPOSAL',
        probability: 60
      };

      const score = calculateDataQualityScore(completeOpp, 'opportunity');
      expect(score).toBeGreaterThanOrEqual(85);
    });
  });
});

describe('Validation Service', () => {
  let validationService: ValidationService;

  beforeAll(() => {
    validationService = new ValidationService(mockPrisma);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('Batch Organization Validation', () => {
    test('should validate batch of organizations', async () => {
      const organizations = [
        {
          name: 'Restaurant A',
          priority: 'HIGH',
          segment: 'FINE_DINING',
          email: 'a@restaurant.com'
        },
        {
          name: 'Restaurant B',
          priority: 'MEDIUM',
          segment: 'CASUAL_DINING',
          phone: '555-123-4567'
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateOrganizations(organizations as any);

      expect(result.processedCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.isValid).toBe(true);
    });

    test('should catch validation errors', async () => {
      const organizations = [
        {
          name: 'A', // Too short
          priority: 'INVALID',
          email: 'not-an-email'
        }
      ];

      const result = await validationService.validateOrganizations(organizations as any);

      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.errors[0].errorType).toBeDefined();
    });

    test('should detect duplicates', async () => {
      const organizations = [
        {
          name: 'Existing Restaurant',
          priority: 'HIGH'
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([
        { name: 'Existing Restaurant', email: null }
      ]);

      const result = await validationService.validateOrganizations(organizations, {
        batchSize: 100,
        stopOnError: false,
        validateReferences: true,
        checkDuplicates: true,
        calculateQuality: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].errorType).toBe('DUPLICATE');
    });

    test('should generate warnings', async () => {
      const organizations = [
        {
          name: 'Restaurant Without Segment',
          priority: 'HIGH',
          type: 'CUSTOMER'
          // Missing segment, revenue, etc.
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateOrganizations(organizations as any);

      expect(result.warningCount).toBeGreaterThan(0);
      expect(result.warnings[0].suggestion).toBeDefined();
    });
  });

  describe('Referential Integrity Validation', () => {
    test('should validate organization references', async () => {
      const contacts = [
        {
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'valid-org-id'
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([
        { id: 'valid-org-id' }
      ]);
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateContacts(contacts as any);

      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    test('should catch invalid references', async () => {
      const contacts = [
        {
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'invalid-org-id'
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateContacts(contacts as any);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].errorType).toBe('REFERENCE');
      expect(result.errors[0].severity).toBe('CRITICAL');
    });
  });

  describe('Business Rule Validation', () => {
    test('should enforce high priority organization rules', async () => {
      const organizations = [
        {
          name: 'High Priority Restaurant',
          priority: 'HIGH'
          // Missing phone, email, and revenue
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateOrganizations(organizations as any);

      const businessRuleErrors = result.errors.filter(e => e.errorType === 'BUSINESS_RULE');
      expect(businessRuleErrors.length).toBeGreaterThan(0);
      expect(businessRuleErrors[0].message).toContain('High priority');
    });

    test('should validate interaction business hours', async () => {
      const interactions = [
        {
          type: 'DEMO',
          subject: 'Lunch Demo',
          date: new Date('2024-01-15T12:30:00'), // During lunch service
          organizationId: 'org123'
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([
        { id: 'org123' }
      ] as any);
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateInteractions(interactions as any);

      const businessRuleErrors = result.errors.filter(e => e.errorType === 'BUSINESS_RULE');
      expect(businessRuleErrors.length).toBeGreaterThan(0);
      expect(businessRuleErrors[0].message).toContain('service hours');
    });

    test('should validate opportunity probability alignment', async () => {
      const opportunities = [
        {
          name: 'Test Deal',
          organizationId: 'org123',
          stage: 'PROPOSAL',
          probability: 10 // Too low for proposal stage
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([
        { id: 'org123' }
      ] as any);
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateOpportunities(opportunities as any);

      const businessRuleErrors = result.errors.filter(e => e.errorType === 'BUSINESS_RULE');
      expect(businessRuleErrors.length).toBeGreaterThan(0);
      expect(businessRuleErrors[0].message).toContain('unusual for stage');
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive report', async () => {
      const results = new Map([
        ['Organizations', {
          isValid: false,
          errors: [
            {
              row: 1,
              field: 'email',
              value: 'invalid',
              message: 'Invalid email format',
              errorType: 'FORMAT' as const,
              severity: 'ERROR' as const
            }
          ],
          warnings: [
            {
              row: 2,
              field: 'segment',
              message: 'Missing segment',
              suggestion: 'Add segment for categorization'
            }
          ],
          dataQualityScore: 75,
          processedCount: 10,
          errorCount: 1,
          warningCount: 1
        }],
        ['Contacts', {
          isValid: true,
          errors: [],
          warnings: [],
          dataQualityScore: 90,
          processedCount: 20,
          errorCount: 0,
          warningCount: 0
        }]
      ]);

      const report = validationService.generateReport(results);

      expect(report).toContain('Data Validation Report');
      expect(report).toContain('Organizations');
      expect(report).toContain('❌ INVALID');
      expect(report).toContain('Contacts');
      expect(report).toContain('✅ VALID');
      expect(report).toContain('FORMAT (1)');
      expect(report).toContain('Invalid email format');
      expect(report).toContain('💡 Add segment');
    });
  });

  describe('Performance Testing', () => {
    test('should handle large batches efficiently', async () => {
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        name: `Restaurant ${i}`,
        priority: i % 2 === 0 ? 'HIGH' : 'LOW',
        email: `restaurant${i}@test.com`
      }));

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);

      const startTime = Date.now();
      const result = await validationService.validateOrganizations(largeDataset, {
        batchSize: 100,
        stopOnError: false,
        validateReferences: false,
        checkDuplicates: false,
        calculateQuality: false
      });
      const endTime = Date.now();

      expect(result.processedCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should stop on error when configured', async () => {
      const dataset = Array(100).fill(null).map((_, i) => ({
        name: i === 50 ? '' : `Restaurant ${i}`, // Invalid at position 50
        priority: 'HIGH'
      }));

      const result = await validationService.validateOrganizations(dataset, {
        batchSize: 100,
        stopOnError: true,
        validateReferences: false,
        checkDuplicates: false,
        calculateQuality: false
      });

      expect(result.processedCount).toBeLessThan(100);
      expect(result.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined values', async () => {
      const data = [
        {
          name: 'Test Restaurant',
          priority: 'HIGH',
          email: null,
          phone: undefined,
          notes: ''
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateOrganizations(data);

      expect(result.isValid).toBe(true);
      expect(result.processedCount).toBe(1);
    });

    test('should handle special characters in text fields', async () => {
      const data = [
        {
          name: "O'Malley's Pub & Grill",
          priority: 'MEDIUM',
          notes: 'Special chars: €£¥ "quotes" & more'
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await validationService.validateOrganizations(data);

      expect(result.isValid).toBe(true);
    });

    test('should handle very long text fields', async () => {
      const data = [
        {
          name: 'Test Restaurant',
          priority: 'HIGH',
          notes: 'A'.repeat(6000) // Exceeds 5000 character limit
        }
      ];

      const result = await validationService.validateOrganizations(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('cannot exceed 5000 characters');
    });

    test('should handle date edge cases', async () => {
      const interactions = [
        {
          type: 'CALL',
          subject: 'Test Call',
          date: new Date('1900-01-01'), // Very old date
          organizationId: 'org123'
        }
      ];

      const result = await validationService.validateInteractions(interactions as any);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('more than 5 years in the past');
    });

    test('should handle circular references gracefully', async () => {
      // This would test scenarios where entities reference each other
      const opportunity = {
        name: 'Test Opportunity',
        organizationId: 'org123',
        contactId: 'contact123'
      };

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue([
        { id: 'org123' }
      ] as any);
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([
        { id: 'contact123' }
      ]);
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue({
        organizationId: 'wrong-org' // Contact belongs to different org
      } as any);

      const result = await validationService.validateOpportunities([opportunity]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('does not belong'))).toBe(true);
    });
  });
});