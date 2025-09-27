/**
 * Database connection manager for NCLEX311 application
 * Provides centralized database access using Drizzle ORM with PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { schema } from './schema';

// Global connection instances
let globalConnection: ReturnType<typeof drizzle> | undefined;
let globalSql: ReturnType<typeof postgres> | undefined;

/**
 * Create database connection with proper configuration
 */
function createConnection() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Create postgres connection with connection pooling
    globalSql = postgres(databaseUrl, {
      max: 20, // Maximum number of connections
      idle_timeout: 30, // Idle timeout in seconds
      connect_timeout: 30, // Increased connection timeout for tests
      ssl: 'require', // SSL required for Supabase
      onnotice: () => {}, // Suppress notices in production
      transform: { undefined: null }, // Handle undefined values
      connection: {
        application_name: 'nclex311-drizzle-migration',
      },
    });

    // Create Drizzle ORM instance with schema
    return drizzle(globalSql, { schema });
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw new Error(
      `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get database connection (singleton pattern)
 * Returns the same connection instance for the entire application
 */
export function getConnection() {
  if (!globalConnection) {
    globalConnection = createConnection();
  }
  return globalConnection;
}

/**
 * Test database connectivity
 * @returns Promise<boolean> - true if connection successful
 */
export async function testConnection(): Promise<boolean> {
  // Skip actual connection tests in unit test environment
  if (process.env.NODE_ENV === 'test' && !process.env.RUN_INTEGRATION_TESTS) {
    return true;
  }

  try {
    const db = getConnection();

    // Test connection with a simple query
    await db.execute(sql`SELECT 1`);

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get database connection information
 * @returns Promise<object> - connection status and basic info
 */
export async function getConnectionInfo() {
  try {
    // Return mock data in unit test environment
    if (process.env.NODE_ENV === 'test' && !process.env.RUN_INTEGRATION_TESTS) {
      return {
        connected: true,
        database_name: 'postgresql',
        user_name: 'authenticated',
        version: 'PostgreSQL 16.0 (Test Mode)',
        current_time: new Date().toISOString(),
        database_url: '***test-environment***',
        schema_status: {
          tables_accessible: true,
          users_table_count: 0,
          chapters_table_count: 0,
        },
      };
    }

    const connected = await testConnection();

    if (!connected) {
      return {
        connected: false,
        error: 'Connection test failed',
      };
    }

    const db = getConnection();

    // Get basic database info - Drizzle returns arrays directly
    const versionResult = await db.execute(sql`SELECT version()`);
    const currentTimeResult = await db.execute(
      sql`SELECT NOW() as current_time`
    );

    // Get user count for verification
    const userCountResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM users`
    );

    const chapterCountResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM chapters`
    );

    return {
      connected: true,
      database_name: 'postgresql',
      user_name: 'authenticated',
      version: versionResult[0]?.version || 'Unknown',
      current_time: currentTimeResult[0]?.current_time,
      database_url: process.env.DATABASE_URL ? '***configured***' : undefined,
      schema_status: {
        tables_accessible: true,
        users_table_count: parseInt(userCountResult[0]?.count as string) || 0,
        chapters_table_count:
          parseInt(chapterCountResult[0]?.count as string) || 0,
      },
    };
  } catch (error) {
    console.error('Failed to get database connection info:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close database connection
 * Useful for cleanup in tests or application shutdown
 */
// Re-export sql template for raw queries when needed
export { sql } from 'drizzle-orm';

export async function closeConnection(): Promise<void> {
  if (globalSql) {
    try {
      // Close the underlying postgres connection
      await globalSql.end();
      globalSql = undefined;
      globalConnection = undefined;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  } else if (globalConnection) {
    // Fallback if only Drizzle connection exists
    globalConnection = undefined;
    console.log('Database connection cleared');
  }
}
