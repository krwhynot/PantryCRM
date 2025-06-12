/**
 * Centralized Input Sanitization Utilities
 * Security implementation for Kitchen Pantry CRM
 * 
 * Enhanced with DOMPurify for comprehensive XSS protection:
 * - Prevents XSS attacks through HTML sanitization
 * - Implements length limits for performance
 * - Standardizes input validation across all endpoints
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes search input to prevent XSS and ensure performance
 * @param input - Raw user input string
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized string safe for database queries
 */
export function sanitizeSearchInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First pass: DOMPurify sanitization to remove HTML/JavaScript
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // No HTML tags allowed in search
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  });

  return sanitized
    .replace(/[{}[\]\\]/g, '') // Remove characters that could break SQL queries
    .replace(/[^\w\s@.-]/g, '') // Allow only alphanumeric, spaces, @, ., and -
    .trim()
    .substring(0, maxLength); // Limit length for performance
}

/**
 * Validates minimum search query length
 * @param query - Sanitized search query
 * @param minLength - Minimum required length (default: 2)
 * @returns Whether query meets minimum length requirement
 */
export function isValidSearchQuery(query: string, minLength: number = 2): boolean {
  return query.length >= minLength;
}

/**
 * Sanitizes and validates search input in one operation
 * @param input - Raw user input
 * @param options - Configuration options
 * @returns Object with sanitized query and validity status
 */
export function processSearchInput(
  input: string | null,
  options: {
    minLength?: number;
    maxLength?: number;
  } = {}
): {
  query: string;
  isValid: boolean;
} {
  const { minLength = 2, maxLength = 100 } = options;
  
  if (!input) {
    return { query: '', isValid: false };
  }

  const sanitized = sanitizeSearchInput(input, maxLength);
  const isValid = isValidSearchQuery(sanitized, minLength);

  return {
    query: sanitized,
    isValid
  };
}

/**
 * Sanitizes organization/contact names for database storage
 * @param name - Organization or contact name
 * @returns Sanitized name suitable for database storage
 */
export function sanitizeEntityName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Use DOMPurify for comprehensive sanitization
  const sanitized = DOMPurify.sanitize(name, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  return sanitized
    .replace(/[{}[\]\\]/g, '') // Remove additional dangerous characters
    .trim()
    .substring(0, 255); // Database field limit
}

/**
 * Sanitizes email addresses for database queries
 * @param email - Email address input
 * @returns Sanitized email or empty string if invalid format
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const sanitized = email
    .replace(/[<>'"{}[\]\\]/g, '')
    .trim()
    .toLowerCase()
    .substring(0, 320); // RFC 5321 email length limit

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Azure SQL specific input sanitization
 * Handles special characters that could cause issues with SQL Server
 * @param input - Raw input string
 * @returns String safe for Azure SQL queries
 */
export function sanitizeForAzureSQL(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>'"{}[\]\\;-]/g, '') // Remove SQL injection vectors
    .replace(/--/g, '') // Remove SQL comment markers
    .replace(/\x00/g, '') // Remove null bytes
    .trim()
    .substring(0, 4000); // SQL Server varchar(max) practical limit
}