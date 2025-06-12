/**
 * Validation schemas for Lead-related API endpoints
 * Implements comprehensive input validation to prevent injection attacks
 */

import { z } from 'zod';

// Common field validations
const nameField = z.string().min(1, 'Name is required').max(50, 'Name too long').trim();
const emailField = z.string().email('Invalid email format').max(255, 'Email too long').toLowerCase();
const phoneField = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone format').optional();
const companyField = z.string().min(1, 'Company name is required').max(100, 'Company name too long').trim();

/**
 * Validation schema for creating leads from web forms
 */
export const CreateLeadFromWebSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: emailField,
  phone: phoneField,
  account: companyField,
  job: z.string().max(100, 'Job title too long').trim().optional(),
  lead_source: z.string().max(50, 'Lead source too long').trim().optional(),
}).strict(); // Reject unknown properties

/**
 * Validation schema for lead updates
 */
export const UpdateLeadSchema = z.object({
  firstName: nameField.optional(),
  lastName: nameField.optional(),
  email: emailField.optional(),
  phone: phoneField,
  account: companyField.optional(),
  job: z.string().max(100, 'Job title too long').trim().optional(),
  lead_source: z.string().max(50, 'Lead source too long').trim().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED']).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
}).strict();

/**
 * Validation schema for lead search/filtering
 */
export const LeadSearchSchema = z.object({
  q: z.string().max(100, 'Search query too long').optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED']).optional(),
  source: z.string().max(50, 'Source filter too long').optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
}).strict();

/**
 * Validation schema for API token authorization
 */
export const APITokenSchema = z.object({
  authorization: z.string().min(10, 'Invalid token format').max(500, 'Token too long')
});

export type CreateLeadFromWebInput = z.infer<typeof CreateLeadFromWebSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type LeadSearchInput = z.infer<typeof LeadSearchSchema>;
export type APITokenInput = z.infer<typeof APITokenSchema>;