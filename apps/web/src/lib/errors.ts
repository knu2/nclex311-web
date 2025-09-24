/**
 * Centralized API error handling utilities
 * Follows Coding Standards: Error Handling Standards
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface ApiErrorShape {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class DatabaseError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: unknown, context: string) {
  console.error(`API Error in ${context}:`, error);

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      {
        error: 'Database Error',
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      } satisfies ApiErrorShape,
      { status: 500 }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid input data',
        details: { issues: error.issues },
        timestamp: new Date().toISOString(),
      } satisfies ApiErrorShape,
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    } satisfies ApiErrorShape,
    { status: 500 }
  );
}
