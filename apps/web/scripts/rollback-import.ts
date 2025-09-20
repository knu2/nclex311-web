#!/usr/bin/env npx tsx

/**
 * NCLEX311 Import Rollback Script
 * Rolls back imported content from the database
 *
 * Usage:
 *   npx tsx scripts/rollback-import.ts --confirm
 *   npx tsx scripts/rollback-import.ts --dry-run
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { program } from 'commander';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class ImportRollback {
  private dryRun: boolean;

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
  }

  /**
   * Execute rollback process
   */
  async rollback(): Promise<void> {
    try {
      console.log('🔄 Starting NCLEX311 Import Rollback');
      console.log(`🧪 Dry Run: ${this.dryRun ? 'Yes' : 'No'}`);

      if (!this.dryRun) {
        console.log(
          '⚠️  WARNING: This will permanently delete all imported data!'
        );
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
        await this.delay(5000);
      }

      console.log('');

      // Get current counts
      await this.displayCurrentCounts();

      // Rollback in reverse dependency order
      await this.deleteImages();
      await this.deleteOptions();
      await this.deleteQuestions();
      await this.deleteConcepts();
      await this.deleteChapters();

      // Display final counts
      await this.displayCurrentCounts();

      console.log(
        this.dryRun ? '✅ Rollback simulation complete' : '✅ Rollback complete'
      );
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Display current record counts
   */
  private async displayCurrentCounts(): Promise<void> {
    console.log('📊 Current database state:');

    const tables = ['chapters', 'concepts', 'questions', 'options', 'images'];

    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      const icon = this.getTableIcon(table);
      console.log(`${icon} ${table}: ${count || 0} records`);
    }

    console.log('');
  }

  /**
   * Delete all images
   */
  private async deleteImages(): Promise<void> {
    console.log('🖼️  Processing images...');

    if (!this.dryRun) {
      const { count: beforeCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });

      const { error } = await supabase
        .from('images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to delete images: ${error.message}`);
      }

      console.log(`   ✅ Deleted ${beforeCount || 0} images`);
    } else {
      const { count } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });

      console.log(`   🧪 [DRY RUN] Would delete ${count || 0} images`);
    }
  }

  /**
   * Delete all options
   */
  private async deleteOptions(): Promise<void> {
    console.log('📝 Processing options...');

    if (!this.dryRun) {
      const { count: beforeCount } = await supabase
        .from('options')
        .select('*', { count: 'exact', head: true });

      const { error } = await supabase
        .from('options')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to delete options: ${error.message}`);
      }

      console.log(`   ✅ Deleted ${beforeCount || 0} options`);
    } else {
      const { count } = await supabase
        .from('options')
        .select('*', { count: 'exact', head: true });

      console.log(`   🧪 [DRY RUN] Would delete ${count || 0} options`);
    }
  }

  /**
   * Delete all questions
   */
  private async deleteQuestions(): Promise<void> {
    console.log('❓ Processing questions...');

    if (!this.dryRun) {
      const { count: beforeCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { error } = await supabase
        .from('questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to delete questions: ${error.message}`);
      }

      console.log(`   ✅ Deleted ${beforeCount || 0} questions`);
    } else {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      console.log(`   🧪 [DRY RUN] Would delete ${count || 0} questions`);
    }
  }

  /**
   * Delete all concepts
   */
  private async deleteConcepts(): Promise<void> {
    console.log('💡 Processing concepts...');

    if (!this.dryRun) {
      const { count: beforeCount } = await supabase
        .from('concepts')
        .select('*', { count: 'exact', head: true });

      const { error } = await supabase
        .from('concepts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to delete concepts: ${error.message}`);
      }

      console.log(`   ✅ Deleted ${beforeCount || 0} concepts`);
    } else {
      const { count } = await supabase
        .from('concepts')
        .select('*', { count: 'exact', head: true });

      console.log(`   🧪 [DRY RUN] Would delete ${count || 0} concepts`);
    }
  }

  /**
   * Delete all chapters
   */
  private async deleteChapters(): Promise<void> {
    console.log('📚 Processing chapters...');

    if (!this.dryRun) {
      const { count: beforeCount } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true });

      const { error } = await supabase
        .from('chapters')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to delete chapters: ${error.message}`);
      }

      console.log(`   ✅ Deleted ${beforeCount || 0} chapters`);
    } else {
      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true });

      console.log(`   🧪 [DRY RUN] Would delete ${count || 0} chapters`);
    }
  }

  /**
   * Get icon for table
   */
  private getTableIcon(table: string): string {
    const icons: Record<string, string> = {
      chapters: '📚',
      concepts: '💡',
      questions: '❓',
      options: '📝',
      images: '🖼️',
    };
    return icons[table] || '📄';
  }

  /**
   * Wait for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI setup
program
  .name('rollback-import')
  .description('Rollback NCLEX311 imported content from database')
  .version('1.0.0')
  .option('--confirm', 'Confirm deletion (required for actual rollback)', false)
  .option('--dry-run', 'Simulate rollback without deleting data', false)
  .action(async options => {
    try {
      if (!options.confirm && !options.dryRun) {
        console.error('❌ You must specify either --confirm or --dry-run');
        console.error('   Use --dry-run to simulate the rollback');
        console.error('   Use --confirm to actually delete the data');
        process.exit(1);
      }

      const rollback = new ImportRollback(options.dryRun || !options.confirm);
      await rollback.rollback();
      process.exit(0);
    } catch (error) {
      console.error(
        '💥 Rollback failed:',
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
