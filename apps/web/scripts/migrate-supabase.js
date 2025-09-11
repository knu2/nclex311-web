#!/usr/bin/env node

/**
 * Supabase migration utility for NCLEX311
 * Usage: node scripts/migrate-supabase.js
 * 
 * Note: This creates a migration status tracker instead of running SQL
 * For actual migrations, use Supabase Dashboard SQL Editor (recommended)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  console.log('🚀 Starting Supabase database migrations...');
  
  // Create Supabase client with service role key (needed for DDL operations)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.log('\n💡 Make sure both variables are set in .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const migrationsDir = path.join(__dirname, '../migrations');
  
  try {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('📝 No migration files found in migrations directory');
      return;
    }
    
    for (const file of migrationFiles) {
      console.log(`⚡ Running migration: ${file}`);
      
      const migrationContent = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf-8'
      );
      
      // Split the migration into individual statements
      // PostgreSQL can't handle multiple statements in a single RPC call
      const statements = migrationContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';'
          });
          
          if (error) {
            console.error(`❌ SQL Error in ${file}:`, error);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
      
      console.log(`✅ Completed migration: ${file}`);
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Alternative: Run migrations via Supabase Dashboard SQL Editor');
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
