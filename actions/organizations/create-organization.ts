'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const OrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  priority: z.enum(['A', 'B', 'C', 'D']).optional().nullable(),
  segment: z.enum(['Fine Dining', 'Fast Food', 'Healthcare', 'Catering', 'Institutional']).optional().nullable(),
  distributor: z.enum(['Sysco', 'USF', 'PFG', 'Direct', 'Other']).optional().nullable(),
  // Remove accountManagerId - not in schema
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  notes: z.string().optional().nullable(),
});

export interface CreateOrganizationState {
  success?: boolean;
  error?: string;
  data?: any;
}

export async function createOrganizationAction(
  prevState: CreateOrganizationState | null,
  formData: FormData
): Promise<CreateOrganizationState> {
  try {
    // Convert FormData to object
    const rawData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (value === '') {
        rawData[key] = null;
      } else {
        rawData[key] = value;
      }
    }

    // Validate the data
    const validatedData = OrganizationSchema.parse(rawData);

    // Create the organization
    const organization = await prisma.organization.create({
      data: {
        name: validatedData.name,
        priority: validatedData.priority,
        segment: validatedData.segment,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zipCode: validatedData.zipCode,
        phone: validatedData.phone,
        email: validatedData.email,
        website: validatedData.website,
        notes: validatedData.notes,
      },
    });

    return {
      success: true,
      data: organization,
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create organization',
    };
  }
}