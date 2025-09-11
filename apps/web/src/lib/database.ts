/**
 * Database connection utility for NCLEX311 application
 * Provides centralized database access using Vercel Postgres
 */

import { sql } from '@vercel/postgres';

/**
 * Test database connectivity
 * @returns Promise<boolean> - true if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1 as test`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get database connection info
 * @returns Promise<object> - connection status and basic info
 */
export async function getConnectionInfo() {
  try {
    const result = await sql`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version,
        NOW() as current_time
    `;
    
    return {
      connected: true,
      ...result.rows[0]
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run raw SQL query (for migrations and admin tasks)
 * @param query - SQL query string
 * @returns Query result
 */
export async function runQuery(query: string) {
  try {
    return await sql.query(query);
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

/**
 * Execute migration file
 * @param migrationContent - SQL content of migration file
 */
export async function executeMigration(migrationContent: string): Promise<void> {
  try {
    await sql.query(migrationContent);
  } catch (error) {
    console.error('Migration execution failed:', error);
    throw error;
  }
}
