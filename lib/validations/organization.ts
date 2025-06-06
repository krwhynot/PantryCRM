import { z } from 'zod';

export const OrganizationValidation = z.object({
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
  
  accountManagerId: z.string().optional(), // Make it optional for now, as a user selection component is not yet built
    
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
    
  email: z.string()
    .email('Invalid email format')
    .optional(),
    
  addressLine1: z.string()
    .max(200, 'Address too long')
    .optional()
});

export type OrganizationFormData = z.infer<typeof OrganizationValidation>;
