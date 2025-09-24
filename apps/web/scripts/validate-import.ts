#!/usr/bin/env npx tsx

/**
 * NCLEX311 Import Validation Script
 * Validates imported content and generates verification reports
 *
 * Usage:
 *   npx tsx scripts/validate-import.ts
 *   npx tsx scripts/validate-import.ts --spot-check=10
 *   npx tsx scripts/validate-import.ts --full-report
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

interface ValidationReport {
  summary: {
    totalChapters: number;
    totalConcepts: number;
    totalQuestions: number;
    totalOptions: number;
    totalImages: number;
    correctAnswers: number;
    brokenImageLinks: number;
    orphanedRecords: number;
  };
  spotChecks: SpotCheckResult[];
  issues: ValidationIssue[];
  duration: number;
}

interface SpotCheckResult {
  type: 'concept' | 'question' | 'image';
  id: string;
  title?: string;
  status: 'valid' | 'invalid';
  details: string;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  category: string;
  message: string;
  affectedIds?: string[];
}

class ImportValidator {
  private report: ValidationReport;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.report = {
      summary: {
        totalChapters: 0,
        totalConcepts: 0,
        totalQuestions: 0,
        totalOptions: 0,
        totalImages: 0,
        correctAnswers: 0,
        brokenImageLinks: 0,
        orphanedRecords: 0,
      },
      spotChecks: [],
      issues: [],
      duration: 0,
    };
  }

  /**
   * Run comprehensive validation
   */
  async validate(
    spotCheckCount: number = 5,
    fullReport: boolean = false
  ): Promise<void> {
    try {
      console.log('🔍 Starting NCLEX311 Import Validation');
      console.log(`📊 Spot checks: ${spotCheckCount}`);
      console.log(`📋 Full report: ${fullReport ? 'Yes' : 'No'}`);
      console.log('');

      // Generate summary statistics
      await this.generateSummary();

      // Perform data integrity checks
      await this.checkDataIntegrity();

      // Validate relationships
      await this.validateRelationships();

      // Validate image links
      await this.validateImageLinks();

      // Perform spot checks
      await this.performSpotChecks(spotCheckCount);

      // Generate report
      this.generateReport(fullReport);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  /**
   * Generate summary statistics
   */
  private async generateSummary(): Promise<void> {
    console.log('📊 Generating summary statistics...');

    // Count chapters
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true });
    this.report.summary.totalChapters = chapterCount || 0;

    // Count concepts
    const { count: conceptCount } = await supabase
      .from('concepts')
      .select('*', { count: 'exact', head: true });
    this.report.summary.totalConcepts = conceptCount || 0;

    // Count questions
    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    this.report.summary.totalQuestions = questionCount || 0;

    // Count options
    const { count: optionCount } = await supabase
      .from('options')
      .select('*', { count: 'exact', head: true });
    this.report.summary.totalOptions = optionCount || 0;

    // Count images
    const { count: imageCount } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true });
    this.report.summary.totalImages = imageCount || 0;

    // Count correct answers
    const { count: correctCount } = await supabase
      .from('options')
      .select('*', { count: 'exact', head: true })
      .eq('is_correct', true);
    this.report.summary.correctAnswers = correctCount || 0;

    console.log('✅ Summary statistics collected');
  }

  /**
   * Check data integrity
   */
  private async checkDataIntegrity(): Promise<void> {
    console.log('🔍 Checking data integrity...');

    // Check for questions without correct answers
    const { data: questionsWithoutCorrect } = await supabase
      .from('questions')
      .select(
        `
        id,
        text,
        options!inner(is_correct)
      `
      )
      .not('options.is_correct', 'eq', true);

    if (questionsWithoutCorrect && questionsWithoutCorrect.length > 0) {
      this.report.issues.push({
        type: 'error',
        category: 'Missing Correct Answers',
        message: `Found ${questionsWithoutCorrect.length} questions without correct answers`,
        affectedIds: questionsWithoutCorrect.map(q => q.id),
      });
    }

    // Check for concepts without questions
    const { data: conceptsWithoutQuestions } = await supabase
      .from('concepts')
      .select(
        `
        id,
        title,
        questions(id)
      `
      )
      .filter('questions', 'is', null);

    if (conceptsWithoutQuestions && conceptsWithoutQuestions.length > 0) {
      this.report.issues.push({
        type: 'warning',
        category: 'Concepts Without Questions',
        message: `Found ${conceptsWithoutQuestions.length} concepts without questions`,
        affectedIds: conceptsWithoutQuestions.map(c => c.id),
      });
    }

    // Check for orphaned options (options without questions)
    const { data: orphanedOptions } = await supabase
      .from('options')
      .select(
        `
        id,
        question_id,
        questions(id)
      `
      )
      .filter('questions', 'is', null);

    if (orphanedOptions && orphanedOptions.length > 0) {
      this.report.summary.orphanedRecords += orphanedOptions.length;
      this.report.issues.push({
        type: 'error',
        category: 'Orphaned Options',
        message: `Found ${orphanedOptions.length} orphaned options`,
        affectedIds: orphanedOptions.map(o => o.id),
      });
    }

    console.log('✅ Data integrity checks complete');
  }

  /**
   * Validate relationships
   */
  private async validateRelationships(): Promise<void> {
    console.log('🔗 Validating relationships...');

    // Check chapter-concept relationships
    const { data: chaptersWithConcepts } = await supabase.from('chapters')
      .select(`
        id,
        title,
        concepts(id, title)
      `);

    if (chaptersWithConcepts) {
      for (const chapter of chaptersWithConcepts) {
        if (!chapter.concepts || chapter.concepts.length === 0) {
          this.report.issues.push({
            type: 'warning',
            category: 'Empty Chapters',
            message: `Chapter "${chapter.title}" has no concepts`,
            affectedIds: [chapter.id],
          });
        }
      }
    }

    // Check concept-question relationships
    const { data: conceptsWithQuestions } = await supabase.from('concepts')
      .select(`
        id,
        title,
        questions(id)
      `);

    if (conceptsWithQuestions) {
      const emptyConceptsCount = conceptsWithQuestions.filter(
        c => !c.questions || c.questions.length === 0
      ).length;

      if (emptyConceptsCount > 0) {
        this.report.issues.push({
          type: 'warning',
          category: 'Empty Concepts',
          message: `${emptyConceptsCount} concepts have no questions`,
        });
      }
    }

    console.log('✅ Relationship validation complete');
  }

  /**
   * Validate image links
   */
  private async validateImageLinks(): Promise<void> {
    console.log('🖼️  Validating image links...');

    const { data: images } = await supabase
      .from('images')
      .select('id, filename, blob_url');

    if (images) {
      let brokenCount = 0;

      for (const image of images.slice(0, 10)) {
        // Check first 10 images
        try {
          const response = await fetch(image.blob_url, { method: 'HEAD' });
          if (!response.ok) {
            brokenCount++;
            this.report.issues.push({
              type: 'error',
              category: 'Broken Image Links',
              message: `Image ${image.filename} returns ${response.status}`,
              affectedIds: [image.id],
            });
          }
        } catch (error) {
          brokenCount++;
          this.report.issues.push({
            type: 'error',
            category: 'Broken Image Links',
            message: `Image ${image.filename} failed to load: ${error}`,
            affectedIds: [image.id],
          });
        }
      }

      this.report.summary.brokenImageLinks = brokenCount;
    }

    console.log('✅ Image link validation complete');
  }

  /**
   * Perform spot checks on random records
   */
  private async performSpotChecks(count: number): Promise<void> {
    console.log(`🎯 Performing ${count} spot checks...`);

    // Spot check concepts
    const { data: concepts } = await supabase
      .from('concepts')
      .select(
        `
        id,
        title,
        slug,
        content,
        chapter_id,
        chapters(title),
        questions(id)
      `
      )
      .limit(Math.ceil(count / 3));

    if (concepts) {
      for (const concept of concepts) {
        const isValid =
          concept.title &&
          concept.slug &&
          concept.content &&
          concept.chapter_id;
        this.report.spotChecks.push({
          type: 'concept',
          id: concept.id,
          title: concept.title,
          status: isValid ? 'valid' : 'invalid',
          details: isValid
            ? `Valid concept with ${concept.questions?.length || 0} questions in chapter "${(concept.chapters as { title?: string })?.title || 'Unknown'}"`
            : 'Missing required fields',
        });
      }
    }

    // Spot check questions
    const { data: questions } = await supabase
      .from('questions')
      .select(
        `
        id,
        text,
        type,
        rationale,
        concept_id,
        concepts(title),
        options(id, is_correct)
      `
      )
      .limit(Math.ceil(count / 3));

    if (questions) {
      for (const question of questions) {
        const hasCorrectAnswer = question.options?.some(o => o.is_correct);
        const isValid =
          question.text &&
          question.type &&
          question.concept_id &&
          hasCorrectAnswer;

        this.report.spotChecks.push({
          type: 'question',
          id: question.id,
          status: isValid ? 'valid' : 'invalid',
          details: isValid
            ? `Valid ${question.type} question with ${question.options?.length || 0} options in concept "${(question.concepts as { title?: string })?.title || 'Unknown'}"`
            : 'Missing required fields or no correct answer',
        });
      }
    }

    // Spot check images
    const { data: images } = await supabase
      .from('images')
      .select(
        `
        id,
        filename,
        blob_url,
        width,
        height,
        concept_id,
        question_id
      `
      )
      .limit(Math.ceil(count / 3));

    if (images) {
      for (const image of images) {
        const hasAssociation = image.concept_id || image.question_id;
        const isValid =
          image.filename && image.blob_url && image.width && image.height;

        this.report.spotChecks.push({
          type: 'image',
          id: image.id,
          title: image.filename,
          status: isValid ? 'valid' : 'invalid',
          details: isValid
            ? `Valid image (${image.width}x${image.height}) ${hasAssociation ? 'with' : 'without'} association`
            : 'Missing required metadata',
        });
      }
    }

    console.log('✅ Spot checks complete');
  }

  /**
   * Generate and display validation report
   */
  private generateReport(fullReport: boolean): void {
    this.report.duration = Date.now() - this.startTime.getTime();
    const durationSec = Math.round(this.report.duration / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('📋 IMPORT VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${durationSec}s`);
    console.log('\n📊 Summary Statistics:');
    console.log(`📚 Chapters: ${this.report.summary.totalChapters}`);
    console.log(`💡 Concepts: ${this.report.summary.totalConcepts}`);
    console.log(`❓ Questions: ${this.report.summary.totalQuestions}`);
    console.log(`📝 Options: ${this.report.summary.totalOptions}`);
    console.log(`🖼️  Images: ${this.report.summary.totalImages}`);
    console.log(`✅ Correct Answers: ${this.report.summary.correctAnswers}`);
    console.log(
      `🔗 Broken Image Links: ${this.report.summary.brokenImageLinks}`
    );
    console.log(`⚠️  Orphaned Records: ${this.report.summary.orphanedRecords}`);

    console.log('\n🎯 Spot Check Results:');
    const validChecks = this.report.spotChecks.filter(
      c => c.status === 'valid'
    ).length;
    console.log(`✅ Valid: ${validChecks}/${this.report.spotChecks.length}`);

    if (fullReport) {
      for (const check of this.report.spotChecks) {
        const icon = check.status === 'valid' ? '✅' : '❌';
        console.log(
          `  ${icon} ${check.type}: ${check.title || check.id} - ${check.details}`
        );
      }
    }

    console.log('\n🚨 Issues Found:');
    const errorCount = this.report.issues.filter(
      i => i.type === 'error'
    ).length;
    const warningCount = this.report.issues.filter(
      i => i.type === 'warning'
    ).length;
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);

    if (fullReport && this.report.issues.length > 0) {
      console.log('\n📋 Issue Details:');
      for (const issue of this.report.issues) {
        const icon = issue.type === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} ${issue.category}: ${issue.message}`);
        if (issue.affectedIds && issue.affectedIds.length <= 3) {
          console.log(`      Affected IDs: ${issue.affectedIds.join(', ')}`);
        } else if (issue.affectedIds && issue.affectedIds.length > 3) {
          console.log(
            `      Affected IDs: ${issue.affectedIds.slice(0, 3).join(', ')} (+${issue.affectedIds.length - 3} more)`
          );
        }
      }
    }

    const overallStatus = errorCount === 0 ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n🎯 Overall Status: ${overallStatus}`);

    if (
      this.report.summary.totalConcepts > 0 &&
      this.report.summary.totalQuestions > 0
    ) {
      console.log('🎉 Import appears successful with content available!');
    }

    console.log('');
  }
}

// CLI setup
program
  .name('validate-import')
  .description(
    'Validate NCLEX311 imported content and generate verification reports'
  )
  .version('1.0.0')
  .option('-s, --spot-check <count>', 'Number of records to spot check', '5')
  .option(
    '-f, --full-report',
    'Generate detailed report with all issues',
    false
  )
  .action(async options => {
    try {
      const validator = new ImportValidator();
      await validator.validate(parseInt(options.spotCheck), options.fullReport);
      process.exit(0);
    } catch (error) {
      console.error(
        '💥 Validation failed:',
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
