/**
 * Comprehensive Data Validation Rules for PantryCRM
 * Based on database best practices and food service industry requirements
 * 
 * References:
 * - Van der Loo & De Jonge (2020): Data Validation in Wiley StatsRef
 * - Data integrity types: Entity, Referential, Domain, Business Rule
 * - Food service specific constraints based on industry patterns
 */

import { z } from 'zod';

// Common validation patterns
const phoneRegex = /^\+?[\d\s\-\(\)\.]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zipCodeRegex = /^\d{5}(-\d{4})?$/;
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Food service specific patterns
const einRegex = /^\d{2}-\d{7}$/; // Employer Identification Number
const licenseRegex = /^[A-Z]{2,3}-\d{6,10}$/; // State license format

/**
 * Organization Validation Rules
 * Implements entity integrity, domain integrity, and business rules
 */
export const OrganizationValidationSchema = z.object({
  // Entity Integrity
  id: z.string().optional(), // Generated if not provided
  
  // Required fields with domain integrity
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name cannot exceed 200 characters')
    .refine(val => val.trim().length > 0, 'Organization name cannot be empty')
    .refine(val => !val.match(/^(test|temp|tmp|delete)/i), 'Invalid organization name pattern'),
  
  // Priority validation with business rules
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE'], {
    errorMap: () => ({ message: 'Priority must be HIGH, MEDIUM, LOW, or NONE' })
  }),
  
  // Segment validation - food service specific
  segment: z.string()
    .refine(val => {
      const validSegments = [
        'FINE_DINING', 'FAST_FOOD', 'CASUAL_DINING', 'QUICK_SERVICE',
        'CAFETERIA', 'FOOD_TRUCK', 'CATERING', 'BAKERY', 'BAR',
        'COFFEE_SHOP', 'BREWERY', 'DISTILLERY', 'GROCERY', 'CONVENIENCE',
        'INSTITUTIONAL', 'HEALTHCARE', 'EDUCATION', 'CORPORATE', 'OTHER'
      ];
      return !val || validSegments.includes(val.toUpperCase());
    }, 'Invalid segment for food service industry'),
  
  // Type validation
  type: z.enum(['PROSPECT', 'CUSTOMER', 'INACTIVE']).default('PROSPECT'),
  
  // Contact information with format validation
  phone: z.string()
    .optional()
    .nullable()
    .refine(val => !val || phoneRegex.test(val), 'Invalid phone number format')
    .refine(val => !val || val.replace(/\D/g, '').length >= 10, 'Phone number must have at least 10 digits'),
  
  email: z.string()
    .optional()
    .nullable()
    .refine(val => !val || emailRegex.test(val.toLowerCase()), 'Invalid email format')
    .refine(val => !val || val.length <= 254, 'Email cannot exceed 254 characters'),
  
  website: z.string()
    .optional()
    .nullable()
    .refine(val => !val || urlRegex.test(val), 'Invalid website URL format'),
  
  // Address validation
  address: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 255, 'Address cannot exceed 255 characters'),
  
  city: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length >= 2, 'City name must be at least 2 characters')
    .refine(val => !val || val.length <= 100, 'City name cannot exceed 100 characters'),
  
  state: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length === 2, 'State must be 2-letter code')
    .refine(val => !val || /^[A-Z]{2}$/.test(val), 'State must be uppercase letters'),
  
  zipCode: z.string()
    .optional()
    .nullable()
    .refine(val => !val || zipCodeRegex.test(val), 'Invalid ZIP code format (12345 or 12345-6789)'),
  
  // Business metrics validation
  estimatedRevenue: z.number()
    .optional()
    .nullable()
    .refine(val => val === null || val === undefined || val >= 0, 'Revenue cannot be negative')
    .refine(val => val === null || val === undefined || val <= 1000000000, 'Revenue exceeds reasonable limit'),
  
  employeeCount: z.number()
    .optional()
    .nullable()
    .refine(val => val === null || val === undefined || (val >= 0 && val <= 100000), 'Employee count must be between 0 and 100,000'),
  
  // Date validations
  lastContactDate: z.date()
    .optional()
    .nullable()
    .refine(val => !val || val <= new Date(), 'Last contact date cannot be in the future'),
  
  nextFollowUpDate: z.date()
    .optional()
    .nullable(),
  
  // Status validation
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD']).default('ACTIVE'),
  
  // Metadata for additional validations
  notes: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 5000, 'Notes cannot exceed 5000 characters'),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

/**
 * Contact Validation Rules
 * Includes referential integrity checks
 */
export const ContactValidationSchema = z.object({
  id: z.string().optional(),
  
  // Name validation with business rules
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name cannot exceed 100 characters')
    .refine(val => !val.match(/\d/), 'First name cannot contain numbers'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name cannot exceed 100 characters')
    .refine(val => !val.match(/\d/), 'Last name cannot contain numbers'),
  
  // Contact information
  email: z.string()
    .optional()
    .nullable()
    .refine(val => !val || emailRegex.test(val.toLowerCase()), 'Invalid email format'),
  
  phone: z.string()
    .optional()
    .nullable()
    .refine(val => !val || phoneRegex.test(val), 'Invalid phone number format'),
  
  // Position validation - food service specific
  position: z.string()
    .optional()
    .nullable()
    .refine(val => {
      if (!val) return true;
      const commonPositions = [
        'OWNER', 'GENERAL MANAGER', 'EXECUTIVE CHEF', 'HEAD CHEF', 
        'SOUS CHEF', 'KITCHEN MANAGER', 'FOOD BUYER', 'PURCHASING MANAGER',
        'OPERATIONS MANAGER', 'DISTRICT MANAGER', 'REGIONAL MANAGER',
        'CEO', 'CFO', 'COO', 'DIRECTOR', 'MANAGER', 'SUPERVISOR',
        'BUYER', 'CHEF', 'COOK', 'SERVER', 'BARTENDER', 'HOST'
      ];
      // Allow common positions or any custom position
      return val.length <= 100;
    }, 'Position title cannot exceed 100 characters'),
  
  isPrimary: z.boolean().default(false),
  
  // Referential integrity
  organizationId: z.string()
    .min(1, 'Organization ID is required for contact'),
  
  notes: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 2000, 'Notes cannot exceed 2000 characters'),
  
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

/**
 * Interaction Validation Rules
 * Includes temporal and referential constraints
 */
export const InteractionValidationSchema = z.object({
  id: z.string().optional(),
  
  // Type validation with food service context
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'VISIT', 'DEMO', 'TASTING', 'DELIVERY', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid interaction type' })
  }),
  
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  
  description: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 5000, 'Description cannot exceed 5000 characters'),
  
  // Date validation with business rules
  date: z.date()
    .refine(val => val <= new Date(), 'Interaction date cannot be in the future')
    .refine(val => {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 5);
      return val >= yearAgo;
    }, 'Interaction date cannot be more than 5 years in the past'),
  
  // Duration validation (in minutes)
  duration: z.number()
    .optional()
    .nullable()
    .refine(val => val === null || val === undefined || (val >= 0 && val <= 480), 
      'Duration must be between 0 and 480 minutes (8 hours)'),
  
  // Outcome validation
  outcome: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FOLLOW_UP_NEEDED'])
    .optional()
    .nullable(),
  
  nextAction: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 500, 'Next action cannot exceed 500 characters'),
  
  // Referential integrity
  organizationId: z.string()
    .min(1, 'Organization ID is required for interaction'),
  
  contactId: z.string().optional().nullable(),
  
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

/**
 * Opportunity Validation Rules
 * Includes complex business rules and calculations
 */
export const OpportunityValidationSchema = z.object({
  id: z.string().optional(),
  
  name: z.string()
    .min(3, 'Opportunity name must be at least 3 characters')
    .max(200, 'Opportunity name cannot exceed 200 characters'),
  
  // Referential integrity
  organizationId: z.string()
    .min(1, 'Organization ID is required for opportunity'),
  
  contactId: z.string().optional().nullable(),
  
  // Value validation with business rules
  value: z.number()
    .optional()
    .nullable()
    .refine(val => val === null || val === undefined || val >= 0, 'Value cannot be negative')
    .refine(val => val === null || val === undefined || val <= 10000000, 'Value exceeds reasonable limit ($10M)'),
  
  // Stage validation with progression rules
  stage: z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .default('PROSPECT'),
  
  // Probability validation
  probability: z.number()
    .min(0, 'Probability cannot be less than 0%')
    .max(100, 'Probability cannot exceed 100%')
    .default(50),
  
  // Date validations with business logic
  expectedCloseDate: z.date()
    .optional()
    .nullable()
    .refine(val => {
      if (!val) return true;
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      return val <= maxDate;
    }, 'Expected close date cannot be more than 2 years in the future'),
  
  notes: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 5000, 'Notes cannot exceed 5000 characters'),
  
  reason: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.length <= 500, 'Reason cannot exceed 500 characters'),
  
  isActive: z.boolean().default(true),
  
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

/**
 * Cross-entity validation rules
 * These validate relationships and business logic across entities
 */
export const CrossEntityValidations = {
  // Validate that primary contact belongs to the correct organization
  validateContactOrganization: async (contactId: string, organizationId: string, prisma: any) => {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { organizationId: true }
    });
    
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }
    
    if (contact.organizationId !== organizationId) {
      throw new Error(`Contact ${contactId} does not belong to organization ${organizationId}`);
    }
  },
  
  // Validate opportunity stage transitions
  validateStageTransition: (currentStage: string, newStage: string): boolean => {
    const stageOrder = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const newIndex = stageOrder.indexOf(newStage);
    
    // Can always move to CLOSED_LOST
    if (newStage === 'CLOSED_LOST') return true;
    
    // Can't move backwards except to CLOSED_LOST
    if (newIndex < currentIndex) return false;
    
    // Can't skip stages (except moving to closed)
    if (newIndex - currentIndex > 1 && !['CLOSED_WON', 'CLOSED_LOST'].includes(newStage)) {
      return false;
    }
    
    return true;
  },
  
  // Validate duplicate organizations
  validateUniqueOrganization: async (name: string, email: string | null, prisma: any, excludeId?: string) => {
    const where: any = {
      OR: [
        { name: { equals: name, mode: 'insensitive' } }
      ]
    };
    
    if (email) {
      where.OR.push({ email: { equals: email, mode: 'insensitive' } });
    }
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    
    const existing = await prisma.organization.findFirst({ where });
    
    if (existing) {
      throw new Error(`Organization with name "${name}" or email "${email}" already exists`);
    }
  },
  
  // Validate business hours for interactions
  validateBusinessHours: (date: Date, type: string): boolean => {
    if (type === 'EMAIL') return true; // Emails can be sent anytime
    
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Typical restaurant business hours consideration
    if (type === 'VISIT' || type === 'DEMO' || type === 'TASTING') {
      // Not during typical service hours (11am-2pm, 5pm-10pm)
      if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 22)) {
        return false;
      }
    }
    
    // General business hours (7am - 8pm)
    return hour >= 7 && hour <= 20;
  }
};

/**
 * Data quality scoring
 * Calculates a quality score based on completeness and validity
 */
export function calculateDataQualityScore(entity: any, entityType: string): number {
  let score = 100;
  const penalties: Record<string, number> = {};
  
  switch (entityType) {
    case 'organization':
      // Required fields
      if (!entity.name) penalties.name = 20;
      if (!entity.priority) penalties.priority = 10;
      if (!entity.segment) penalties.segment = 10;
      
      // Important optional fields
      if (!entity.phone && !entity.email) penalties.contact = 15;
      if (!entity.address || !entity.city || !entity.state) penalties.address = 10;
      if (!entity.estimatedRevenue) penalties.revenue = 5;
      if (!entity.employeeCount) penalties.employees = 5;
      
      // Data freshness
      if (entity.lastContactDate) {
        const daysSinceContact = Math.floor((Date.now() - entity.lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceContact > 180) penalties.stale = 10;
        if (daysSinceContact > 365) penalties.stale = 20;
      }
      break;
      
    case 'contact':
      if (!entity.firstName || !entity.lastName) penalties.name = 20;
      if (!entity.email && !entity.phone) penalties.contact = 20;
      if (!entity.position) penalties.position = 10;
      break;
      
    case 'interaction':
      if (!entity.subject) penalties.subject = 15;
      if (!entity.description) penalties.description = 10;
      if (!entity.outcome) penalties.outcome = 10;
      if (!entity.nextAction && entity.outcome === 'FOLLOW_UP_NEEDED') penalties.followup = 15;
      break;
      
    case 'opportunity':
      if (!entity.value) penalties.value = 15;
      if (!entity.expectedCloseDate) penalties.closeDate = 10;
      if (!entity.contactId) penalties.contact = 10;
      if (entity.stage === 'PROPOSAL' && entity.probability < 25) penalties.probability = 10;
      break;
  }
  
  // Calculate final score
  const totalPenalty = Object.values(penalties).reduce((sum, penalty) => sum + penalty, 0);
  score = Math.max(0, score - totalPenalty);
  
  return score;
}

export type OrganizationValidation = z.infer<typeof OrganizationValidationSchema>;
export type ContactValidation = z.infer<typeof ContactValidationSchema>;
export type InteractionValidation = z.infer<typeof InteractionValidationSchema>;
export type OpportunityValidation = z.infer<typeof OpportunityValidationSchema>;