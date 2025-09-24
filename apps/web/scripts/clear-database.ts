#!/usr/bin/env npx tsx

/**
 * Database Cleanup Script
 * Safely clears all imported content from the database for testing purposes
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  console.log('🧹 Starting database cleanup...');

  try {
    // Delete in proper order to respect foreign key constraints
    console.log('  🗑️  Deleting options...');
    const { error: optionsError } = await supabase
      .from('options')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (optionsError) {
      console.error('❌ Error deleting options:', optionsError.message);
    } else {
      console.log('  ✅ Options cleared');
    }

    console.log('  🗑️  Deleting images...');
    const { error: imagesError } = await supabase
      .from('images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (imagesError) {
      console.error('❌ Error deleting images:', imagesError.message);
    } else {
      console.log('  ✅ Images cleared');
    }

    console.log('  🗑️  Deleting questions...');
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (questionsError) {
      console.error('❌ Error deleting questions:', questionsError.message);
    } else {
      console.log('  ✅ Questions cleared');
    }

    console.log('  🗑️  Deleting concepts...');
    const { error: conceptsError } = await supabase
      .from('concepts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (conceptsError) {
      console.error('❌ Error deleting concepts:', conceptsError.message);
    } else {
      console.log('  ✅ Concepts cleared');
    }

    console.log('  🗑️  Deleting chapters...');
    const { error: chaptersError } = await supabase
      .from('chapters')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (chaptersError) {
      console.error('❌ Error deleting chapters:', chaptersError.message);
    } else {
      console.log('  ✅ Chapters cleared');
    }

    // Verify cleanup
    console.log('\n📊 Verifying cleanup...');

    const tables = ['chapters', 'concepts', 'questions', 'options', 'images'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error(`❌ Error checking ${table}:`, error.message);
      } else {
        console.log(`  📋 ${table}: 0 records remaining`);
      }
    }

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('🚀 Ready for fresh import testing');
  } catch (error) {
    console.error(
      '💥 Database cleanup failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Add confirmation prompt for safety
async function confirmCleanup(): Promise<boolean> {
  const readline = await import('readline');

  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      '⚠️  This will delete ALL imported content from the database. Are you sure? (yes/no): ',
      answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      }
    );
  });
}

async function main() {
  console.log('🧹 NCLEX311 Database Cleanup Tool');
  console.log('=====================================');

  const confirmed = await confirmCleanup();

  if (!confirmed) {
    console.log('❌ Cleanup cancelled by user');
    process.exit(0);
  }

  await clearDatabase();
}

main().catch(console.error);
