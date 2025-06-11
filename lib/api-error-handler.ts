/**
 * Standardized error handling for API routes
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export interface APIError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

// Predefined error types
export const ErrorTypes = {
  VALIDATION_ERROR: (details?: any) => new AppError('Validation failed', 400, 'VALIDATION_ERROR', details),
  UNAUTHORIZED: () => new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
  FORBIDDEN: () => new AppError('Forbidden', 403, 'FORBIDDEN'),
  NOT_FOUND: (resource?: string) => new AppError(`${resource || 'Resource'} not found`, 404, 'NOT_FOUND'),
  CONFLICT: (message?: string) => new AppError(message || 'Conflict', 409, 'CONFLICT'),
  RATE_LIMITED: () => new AppError('Too many requests', 429, 'RATE_LIMITED'),
  DATABASE_ERROR: () => new AppError('Database operation failed', 500, 'DATABASE_ERROR'),
  INTERNAL_ERROR: () => new AppError('Internal server error', 500, 'INTERNAL_ERROR'),
} as const;

/**
 * Centralized error handler for API routes
 */
export function handleAPIError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  // Handle known AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      { status: error.status }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined,
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, message } = error;
    
    switch (code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Record already exists',
            code: 'DUPLICATE_RECORD',
          },
          { status: 409 }
        );
      
      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: 'Record not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      
      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          {
            error: 'Related record not found',
            code: 'FOREIGN_KEY_CONSTRAINT',
          },
          { status: 400 }
        );
      
      default:
        return NextResponse.json(
          {
            error: 'Database operation failed',
            code: 'DATABASE_ERROR',
            details: process.env.NODE_ENV === 'development' ? { code, message } : undefined,
          },
          { status: 500 }
        );
    }
  }

  // Handle other Prisma errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Invalid database query',
        code: 'DATABASE_VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | R>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      if (result instanceof NextResponse) {
        return result;
      }
      return NextResponse.json(result);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Async try-catch wrapper with proper error throwing
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      errorMessage || 'Operation failed',
      500,
      'OPERATION_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}

/**
 * Validation helper with standardized error handling
 */
export function validateInput<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: ZodError } },
  input: unknown
): T {
  const result = schema.safeParse(input);
  
  if (!result.success) {
    throw ErrorTypes.VALIDATION_ERROR(result.error?.errors);
  }
  
  return result.data!;
}

/**
 * Database operation wrapper with error handling
 */
export async function dbOperation<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error; // Let handleAPIError deal with specific Prisma errors
    }
    throw ErrorTypes.DATABASE_ERROR();
  }
}