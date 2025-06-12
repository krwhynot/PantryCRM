'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const ContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  positionKey: z.string().optional(),
  organizationId: z.string().cuid('Invalid organization'),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

export interface CreateContactState {
  success?: boolean;
  error?: string;
  data?: any;
}

export async function createContactAction(
  prevState: CreateContactState | null,
  formData: FormData
): Promise<CreateContactState> {
  try {
    // Convert FormData to object
    const rawData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key === 'isPrimary') {
        rawData[key] = value === 'on';
      } else if (value === '') {
        rawData[key] = undefined;
      } else {
        rawData[key] = value;
      }
    }

    // Validate the data
    const validatedData = ContactSchema.parse(rawData);

    // If setting as primary, remove primary status from other contacts in the organization
    if (validatedData.isPrimary) {
      await prisma.contact.updateMany({
        where: { organizationId: validatedData.organizationId },
        data: { isPrimary: false }
      });
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        positionKey: validatedData.positionKey || null,
        organizationId: validatedData.organizationId,
        isPrimary: validatedData.isPrimary,
        notes: validatedData.notes || null,
      },
    });

    return {
      success: true,
      data: contact,
    };
  } catch (error) {
    console.error('Error creating contact:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contact',
    };
  }
}