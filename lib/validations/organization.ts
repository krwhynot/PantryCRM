import { z } from 'zod';

export const OrganizationValidation = z.object({
  // Core information
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
    
  priority: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Priority must be A, B, C, or D' })
  }),
  
  segment: z.enum([
    'Fine Dining', 
    'Fast Food', 
    'Healthcare', 
    'Catering', 
    'Institutional'
  ], {
    errorMap: () => ({ message: 'Invalid market segment' })
  }),
  
  distributor: z.enum([
    'Sysco', 
    'USF', 
    'PFG', 
    'Direct', 
    'Other'
  ], {
    errorMap: () => ({ message: 'Invalid distributor' })
  }),
  
  // Organization details
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
    
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
    
  type: z.enum(['PROSPECT', 'CUSTOMER', 'INACTIVE'])
    .default('PROSPECT')
    .optional(),
    
  isActive: z.boolean()
    .default(true)
    .optional(),
    
  // Financial information
  annualRevenue: z.union([
    z.number().positive('Annual revenue must be positive'),
    z.string().refine(val => !isNaN(Number(val)), 'Must be a valid number').transform(Number),
    z.literal('').transform(() => undefined)
  ]).optional(),
  
  totalValue: z.union([
    z.number().positive('Total value must be positive'),
    z.string().refine(val => !isNaN(Number(val)), 'Must be a valid number').transform(Number),
    z.literal('').transform(() => undefined)
  ]).optional(),
  
  // Contact information
  accountManagerId: z.string().optional(), // Make it optional for now, as a user selection component is not yet built
    
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
    
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
    
  // Address information
  addressLine1: z.string()
    .max(200, 'Address too long')
    .optional(),
    
  addressLine2: z.string()
    .max(200, 'Address too long')
    .optional(),
    
  city: z.string()
    .max(100, 'City name too long')
    .optional(),
    
  state: z.string()
    .max(50, 'State name too long')
    .optional(),
    
  postalCode: z.string()
    .max(20, 'Postal code too long')
    .optional(),
    
  zipCode: z.string()
    .max(20, 'ZIP code too long')
    .optional(),
    
  country: z.string()
    .max(100, 'Country name too long')
    .optional(),
    
  // Additional information
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

export type OrganizationFormData = z.infer<typeof OrganizationValidation>;
