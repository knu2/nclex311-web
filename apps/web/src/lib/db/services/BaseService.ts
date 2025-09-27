/**
 * Base service class for NCLEX311 application
 * Provides common database operations and connection management for all services
 */

import { getConnection } from '../connection';
import type { PgTable } from 'drizzle-orm/pg-core';
import { eq, desc, asc, count } from 'drizzle-orm';

/**
 * Common pagination interface
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Base service error class
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Abstract base service class
 * Provides common database operations and utilities
 */
export abstract class BaseService {
  protected db = getConnection();

  /**
   * Handle database errors with proper error transformation
   */
  protected handleError(error: unknown, operation: string): never {
    console.error(`Database operation failed [${operation}]:`, error);

    // If it's already a ServiceError, re-throw it as-is
    if (error instanceof ServiceError) {
      throw error;
    }

    if (error instanceof Error) {
      // Check for common PostgreSQL error codes
      if ('code' in error) {
        switch (error.code) {
          case '23505': // Unique violation
            throw new ServiceError(
              'Record already exists',
              'DUPLICATE_ENTRY',
              409,
              { originalError: error.message }
            );
          case '23503': // Foreign key violation
            throw new ServiceError(
              'Referenced record does not exist',
              'FOREIGN_KEY_VIOLATION',
              400,
              { originalError: error.message }
            );
          case '23502': // Not null violation
            throw new ServiceError(
              'Required field is missing',
              'MISSING_REQUIRED_FIELD',
              400,
              { originalError: error.message }
            );
          default:
            throw new ServiceError(
              `Database operation failed: ${error.message}`,
              'DATABASE_ERROR',
              500,
              { originalError: error.message, code: error.code }
            );
        }
      }

      throw new ServiceError(
        `Database operation failed: ${error.message}`,
        'DATABASE_ERROR',
        500,
        { originalError: error.message }
      );
    }

    throw new ServiceError(
      `Unknown database error during ${operation}`,
      'UNKNOWN_ERROR',
      500,
      { originalError: String(error) }
    );
  }

  /**
   * Execute a database operation with error handling
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, operationName);
    }
  }

  /**
   * Find a record by ID
   */
  protected async findById<T extends PgTable>(
    table: T,
    id: string
  ): Promise<T['$inferSelect'] | null> {
    return this.executeOperation(
      async () => {
        const results = await this.db
          .select()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(table as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .where(eq((table as any).id, id))
          .limit(1);

        return results[0] || null;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `findById:${(table as any)[Symbol.for('drizzle:Name')]}`
    );
  }

  /**
   * Find records with pagination
   */
  protected async findWithPagination<T extends PgTable>(
    table: T,
    params: PaginationParams = {},
    whereClause?: unknown
  ): Promise<PaginatedResult<T['$inferSelect']>> {
    const { page = 1, limit = 20, sortBy, sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    return this.executeOperation(
      async () => {
        // Build base query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = this.db.select().from(table as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let countQuery = this.db.select({ count: count() }).from(table as any);

        // Apply where clause if provided
        if (whereClause) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query = query.where(whereClause as any) as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          countQuery = countQuery.where(whereClause as any) as any;
        }

        // Apply sorting if specified
        if (sortBy && sortBy in table) {
          const orderFn = sortOrder === 'asc' ? asc : desc;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query = query.orderBy(orderFn((table as any)[sortBy])) as any;
        }

        // Apply pagination
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.limit(limit).offset(offset) as any;

        // Execute queries
        const [data, totalResult] = await Promise.all([query, countQuery]);

        const total = totalResult[0]?.count || 0;
        const pages = Math.ceil(total / limit);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            pages,
            hasNext: page < pages,
            hasPrev: page > 1,
          },
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `findWithPagination:${(table as any)[Symbol.for('drizzle:Name')]}`
    );
  }

  /**
   * Create a new record
   */
  protected async create<T extends PgTable>(
    table: T,
    data: T['$inferInsert']
  ): Promise<T['$inferSelect']> {
    return this.executeOperation(
      async () => {
        const results = await this.db
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(table as any)
          .values(data)
          .returning();

        return results[0];
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `create:${(table as any)[Symbol.for('drizzle:Name')]}`
    );
  }

  /**
   * Update a record by ID
   */
  protected async updateById<T extends PgTable>(
    table: T,
    id: string,
    data: Partial<T['$inferInsert']>
  ): Promise<T['$inferSelect'] | null> {
    return this.executeOperation(
      async () => {
        const results = await this.db
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(table as any)
          .set({ ...data, updatedAt: new Date() } as Partial<T['$inferInsert']>)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .where(eq((table as any).id, id))
          .returning();

        return results[0] || null;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `updateById:${(table as any)[Symbol.for('drizzle:Name')]}`
    );
  }

  /**
   * Delete a record by ID
   */
  protected async deleteById<T extends PgTable>(
    table: T,
    id: string
  ): Promise<boolean> {
    return this.executeOperation(
      async () => {
        const results = await this.db
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .delete(table as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .where(eq((table as any).id, id))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .returning({ id: (table as any).id });

        return results.length > 0;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `deleteById:${(table as any)[Symbol.for('drizzle:Name')]}`
    );
  }

  /**
   * Check if a record exists by ID
   */
  protected async existsById<T extends PgTable>(
    table: T,
    id: string
  ): Promise<boolean> {
    return this.executeOperation(
      async () => {
        const results = await this.db
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select({ id: (table as any).id })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(table as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .where(eq((table as any).id, id))
          .limit(1);

        return results.length > 0;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      `existsById:${(table as any)[Symbol.for('drizzle:Name')]}`
    );
  }

  /**
   * Execute operations within a database transaction
   */
  protected async transaction<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    return this.executeOperation(async () => {
      return await this.db.transaction(callback);
    }, 'transaction');
  }
}
