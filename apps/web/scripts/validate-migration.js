#!/usr/bin/env node

/**
 * Validate migration status for NCLEX311 Supabase setup
 * Usage: node scripts/validate-migration.js
 * 
 * This script checks if all expected tables from migrations exist and are accessible
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

async function validateMigrations() {
  console.log('🔍 Validating database migration status...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env.local:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Expected tables from our 001_initial_schema.sql migration
  const expectedTables = [
    'users',
    'chapters', 
    'concepts',
    'questions',
    'options',
    'bookmarks',
    'completed_concepts',
    'comments',
    'payments'
  ];
  
  console.log('📊 Checking table accessibility...');
  
  const results = {};
  
  for (const table of expectedTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results[table] = { status: 'error', error: error.message };
      } else {
        results[table] = { status: 'ok', count: count || 0 };
      }
    } catch (error) {
      results[table] = { status: 'error', error: error.message };
    }
  }
  
  // Display results
  console.log('\\n📋 Migration Validation Report:');
  console.log('================================');
  
  let allTablesOk = true;
  
  for (const [table, result] of Object.entries(results)) {
    if (result.status === 'ok') {
      console.log(`✅ ${table.padEnd(20)}: Accessible (${result.count} records)`);
    } else {
      console.log(`❌ ${table.padEnd(20)}: ${result.error}`);
      allTablesOk = false;
    }
  }
  
  console.log('================================');
  
  if (allTablesOk) {
    console.log('🎉 All expected tables are accessible! Migration is complete.');
    console.log('');
    console.log('📝 To add new migrations:');
    console.log('   1. Create new .sql files in migrations/ directory');
    console.log('   2. Run them via Supabase Dashboard SQL Editor');
    console.log('   3. Run this script to validate');
  } else {
    console.log('⚠️  Some tables are missing or inaccessible.');
    console.log('');
    console.log('🛠️  To fix this:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the contents of migrations/001_initial_schema.sql');
    console.log('   3. Run this script again to validate');
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  validateMigrations();
}

module.exports = { validateMigrations };
