/**
 * Database connection utility for NCLEX311 application
 * Provides centralized database access using Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test database connectivity
 * @returns Promise<boolean> - true if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Test Supabase connection by checking client configuration
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error(
        'Database connection test failed: Missing Supabase configuration'
      );
      return false;
    }

    // Test with actual table now that schema exists
    // This gives us a better health check: connection + schema validation
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }

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
    // Test connection using the same method as testConnection
    const connected = await testConnection();

    if (!connected) {
      return {
        connected: false,
        error: 'Connection test failed',
      };
    }

    // Get table count to verify schema is set up
    const { data: userCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { data: chapterCount } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true });

    return {
      connected: true,
      database_name: 'supabase',
      user_name: 'authenticated',
      version: 'PostgreSQL (via Supabase)',
      current_time: new Date().toISOString(),
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      schema_status: {
        tables_accessible: true,
        users_table_count: userCount || 0,
        chapters_table_count: chapterCount || 0,
      },
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run raw SQL query using Supabase RPC (for migrations and admin tasks)
 * @param functionName - PostgreSQL function name
 * @param params - Function parameters
 * @returns Query result
 */
export async function runQuery(
  functionName: string,
  params: Record<string, unknown> = {}
) {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) throw error;
    return { rows: data };
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

/**
 * Execute migration using Supabase SQL runner
 * Note: For production, migrations should be handled via Supabase Dashboard or CLI
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function executeMigration(migrationName: string): Promise<void> {
  console.warn(
    'Migrations should be run via Supabase Dashboard or CLI in production'
  );
  throw new Error(
    'Migration execution not implemented for Supabase client - use Supabase Dashboard'
  );
}
