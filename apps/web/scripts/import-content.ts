#!/usr/bin/env npx tsx

/**
 * NCLEX311 Content Import Script
 * Imports pre-extracted JSON files and medical images into the PostgreSQL database
 *
 * Usage:
 *   npx tsx scripts/import-content.ts --data-dir=python/final_output --images-dir=python/final_output/images
 *   npx tsx scripts/import-content.ts --help
 *   npx tsx scripts/import-content.ts --data-dir=python/final_output --images-dir=python/final_output/images --dry-run
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { program } from 'commander';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve, extname } from 'path';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types for schema validation
interface Database {
  public: {
    Tables: {
      images: {
        Insert: {
          filename: string;
          blob_url: string;
          alt_text: string;
          width: number;
          height: number;
          file_size: number;
          extraction_confidence: string;
          medical_content: string;
          concept_id?: string | null;
          question_id?: string | null;
        };
      };
    };
  };
}

// Create Supabase client with types
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<Database> | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseKey);
}

if (!supabase) {
  console.warn(
    '⚠️  Supabase configuration not found - database operations will be skipped'
  );
}

// Chapter mapping based on the provided structure
const CHAPTERS = [
  {
    number: 1,
    title: 'Management of Care',
    pages: '16 to 47',
  },
  {
    number: 2,
    title: 'Safety and Infection Control',
    pages: '50 to 62',
  },
  {
    number: 3,
    title: 'Psychosocial Integrity',
    pages: '66 to 82',
  },
  {
    number: 4,
    title: 'Pharmacological and Parenteral Therapies',
    pages: '86 to 149',
  },
  {
    number: 5,
    title: 'Physiological Adaptation',
    pages: '152 to 245',
  },
  {
    number: 6,
    title: 'Reduction of Risk Potential',
    pages: '248 to 294',
  },
  {
    number: 7,
    title: 'Health Promotion and Maintenance',
    pages: '299 to 332',
  },
  {
    number: 8,
    title: 'Basic Care and Comfort',
    pages: '336 to 365',
  },
];

// Types for JSON import data structure
interface BookPageData {
  book_page: number;
  pdf_page: number;
  content: {
    main_concept: string;
    key_points: string;
    questions: BookQuestion[];
  };
  images: BookImage[]; // Images at root level
  extraction_metadata: {
    timestamp: string;
    extraction_confidence: 'high' | 'medium' | 'low';
    human_validated: boolean;
    notes: string;
    category: string;
    reference: string;
  };
}

interface BookQuestion {
  id: number;
  type: 'SATA' | 'multiple_choice' | 'fill_in_blank' | 'matrix_grid';
  question_text: string;
  options: string[];
  correct_answer: string | MatrixCorrectAnswer;
  rationale: string;
  matrix_categories?: string[]; // For matrix grid questions
}

interface MatrixCorrectAnswer {
  [category: string]: string[];
}

interface BookImage {
  filename: string;
  description: string;
  medical_relevance: 'high' | 'medium' | 'low';
  content_type: string;
  context: string;
}

// Progress tracking
interface ImportProgress {
  chaptersCreated: number;
  conceptsProcessed: number;
  questionsProcessed: number;
  optionsProcessed: number;
  imagesProcessed: number;
  pagesProcessed: number;
  errors: string[];
  startTime: Date;
}

class ContentImporter {
  private progress: ImportProgress;
  private dataDir: string;
  private imagesDir: string;
  private dryRun: boolean;
  private chapterMap: Map<string, string> = new Map(); // category -> chapter_id

  constructor(dataDir: string, imagesDir: string, dryRun: boolean = false) {
    this.dataDir = resolve(dataDir);
    this.imagesDir = resolve(imagesDir);
    this.dryRun = dryRun;
    this.progress = {
      chaptersCreated: 0,
      conceptsProcessed: 0,
      questionsProcessed: 0,
      optionsProcessed: 0,
      imagesProcessed: 0,
      pagesProcessed: 0,
      errors: [],
      startTime: new Date(),
    };
  }

  /**
   * Main import execution method
   */
  async import(): Promise<void> {
    try {
      console.log('🚀 Starting NCLEX311 Content Import');
      console.log(`📁 Data Directory: ${this.dataDir}`);
      console.log(`🖼️  Images Directory: ${this.imagesDir}`);
      console.log(`🧪 Dry Run: ${this.dryRun ? 'Yes' : 'No'}`);
      console.log('');

      // Validate environment
      await this.validateEnvironment();

      // Create chapters first
      await this.createChapters();

      // Find and process JSON files
      const jsonFiles = await this.findJSONFiles();
      console.log(`📄 Found ${jsonFiles.length} JSON file(s) to process`);

      // Process each JSON file
      for (const jsonFile of jsonFiles) {
        await this.processJSONFile(jsonFile);
      }

      this.displayFinalReport();
    } catch {
      this.handleError('Import failed', error);
      throw error;
    }
  }

  /**
   * Validate environment before starting import
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');

    // Check data directory
    try {
      const dataStat = await stat(this.dataDir);
      if (!dataStat.isDirectory()) {
        throw new Error(`Data path is not a directory: ${this.dataDir}`);
      }
    } catch {
      throw new Error(`Data directory not accessible: ${this.dataDir}`);
    }

    // Check images directory
    try {
      const imagesStat = await stat(this.imagesDir);
      if (!imagesStat.isDirectory()) {
        throw new Error(`Images path is not a directory: ${this.imagesDir}`);
      }
    } catch {
      throw new Error(`Images directory not accessible: ${this.imagesDir}`);
    }

    // Test database connection
    if (!this.dryRun) {
      const { error } = await supabase.from('chapters').select('id').limit(1);
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
    }

    console.log('✅ Environment validation complete');
  }

  /**
   * Create chapters in the database
   */
  private async createChapters(): Promise<void> {
    console.log('📚 Creating chapters...');

    for (const chapter of CHAPTERS) {
      const slug = this.generateSlug(chapter.title);

      console.log(`  📖 Creating chapter: ${chapter.title}`);

      if (!this.dryRun) {
        // Check if chapter already exists
        const { data: existing } = await supabase
          .from('chapters')
          .select('id')
          .eq('chapter_number', chapter.number)
          .single();

        let chapterId: string;

        if (existing) {
          chapterId = existing.id;
          console.log(`    ♻️  Chapter already exists, using ID: ${chapterId}`);
        } else {
          const { data: chapterData, error: chapterError } = await supabase
            .from('chapters')
            .insert({
              title: chapter.title,
              chapter_number: chapter.number,
              slug: slug,
            })
            .select('id')
            .single();

          if (chapterError) {
            throw new Error(
              `Failed to create chapter: ${chapterError.message}`
            );
          }

          chapterId = chapterData.id;
          this.progress.chaptersCreated++;
        }

        this.chapterMap.set(chapter.title, chapterId);
      } else {
        console.log(`    🧪 [DRY RUN] Would create chapter: ${chapter.title}`);
        this.chapterMap.set(chapter.title, `mock-${chapter.number}`);
      }
    }

    console.log(
      `✅ Chapters setup complete (${this.progress.chaptersCreated} created)`
    );
  }

  /**
   * Find all JSON files in the data directory
   */
  private async findJSONFiles(): Promise<string[]> {
    const files = await readdir(this.dataDir);
    const jsonFiles = files
      .filter(file => extname(file).toLowerCase() === '.json')
      .filter(file => file.startsWith('book_page_'))
      .map(file => join(this.dataDir, file))
      .sort(); // Sort to process in page order

    return jsonFiles;
  }

  /**
   * Process a single JSON file (book page)
   */
  private async processJSONFile(filePath: string): Promise<void> {
    try {
      console.log(`\n📖 Processing: ${filePath}`);

      const jsonContent = await readFile(filePath, 'utf-8');
      const pageData: BookPageData = JSON.parse(jsonContent);

      if (!this.validateJSONStructure(pageData)) {
        this.progress.errors.push(`Invalid JSON structure in ${filePath}`);
        return;
      }

      await this.importPageContent(pageData);
      this.progress.pagesProcessed++;
    } catch {
      this.handleError(`Processing file ${filePath}`, error);
    }
  }

  /**
   * Validate JSON structure matches expected format
   */
  private validateJSONStructure(data: unknown): data is BookPageData {
    return (
      data &&
      typeof data.book_page === 'number' &&
      data.content &&
      typeof data.content.main_concept === 'string' &&
      Array.isArray(data.content.questions) &&
      Array.isArray(data.images) && // Images at root level
      data.extraction_metadata &&
      typeof data.extraction_metadata.category === 'string'
    );
  }

  /**
   * Import content from a book page
   */
  private async importPageContent(pageData: BookPageData): Promise<void> {
    const category = pageData.extraction_metadata.category;
    const chapterId = this.chapterMap.get(category);

    if (!chapterId) {
      throw new Error(`No chapter found for category: ${category}`);
    }

    // Create concept from the main concept and key points
    const conceptData = await this.createConcept(pageData, chapterId);

    // Process questions
    for (const question of pageData.content.questions) {
      await this.importQuestion(question, conceptData.id, pageData);
    }

    // Process standalone images (those not embedded in questions)
    for (const image of pageData.images) {
      // Images at root level
      const isQuestionImage = pageData.content.questions.some(
        q =>
          q.question_text.includes(image.filename) ||
          q.rationale.includes(image.filename)
      );

      if (!isQuestionImage) {
        await this.importImage(
          image,
          conceptData.id,
          null,
          pageData.extraction_metadata.extraction_confidence
        );
      }
    }
  }

  /**
   * Create a concept from page content
   */
  private async createConcept(
    pageData: BookPageData,
    chapterId: string
  ): Promise<{ id: string }> {
    const conceptTitle = pageData.content.main_concept;
    const conceptSlug = this.generateSlug(conceptTitle);
    const conceptContent = `${pageData.content.main_concept}\n\n${pageData.content.key_points}`;

    console.log(`  💡 Creating concept: ${conceptTitle}`);

    if (!this.dryRun) {
      const { data: conceptData, error: conceptError } = await supabase
        .from('concepts')
        .insert({
          title: conceptTitle,
          slug: conceptSlug,
          content: conceptContent,
          concept_number: pageData.book_page, // Use book page as concept number
          chapter_id: chapterId,
        })
        .select('id')
        .single();

      if (conceptError) {
        throw new Error(`Failed to create concept: ${conceptError.message}`);
      }

      this.progress.conceptsProcessed++;
      return conceptData;
    } else {
      this.progress.conceptsProcessed++;
      return { id: `mock-concept-${pageData.book_page}` };
    }
  }

  /**
   * Import a question and its options
   */
  private async importQuestion(
    question: BookQuestion,
    conceptId: string,
    pageData: BookPageData
  ): Promise<void> {
    // Map question types
    const questionTypeMap: Record<string, string> = {
      SATA: 'SELECT_ALL_THAT_APPLY',
      multiple_choice: 'MULTIPLE_CHOICE',
      fill_in_blank: 'FILL_IN_THE_BLANK',
      matrix_grid: 'MATRIX_GRID',
    };

    const mappedType = questionTypeMap[question.type] || 'MULTIPLE_CHOICE';

    console.log(`    ❓ Importing question (${mappedType})`);

    if (!this.dryRun) {
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          text: question.question_text,
          type: mappedType,
          rationale: question.rationale,
          concept_id: conceptId,
        })
        .select('id')
        .single();

      if (questionError) {
        throw new Error(`Failed to insert question: ${questionError.message}`);
      }

      this.progress.questionsProcessed++;

      // Import options
      await this.importOptions(question, questionData.id);

      // Import question-related images
      for (const image of pageData.images) {
        // Images at root level
        if (
          question.question_text.includes(image.filename) ||
          question.rationale.includes(image.filename)
        ) {
          await this.importImage(
            image,
            null,
            questionData.id,
            pageData.extraction_metadata.extraction_confidence
          );
        }
      }
    } else {
      console.log(
        `    🧪 [DRY RUN] Would import question with ${question.options.length} options`
      );
      this.progress.questionsProcessed++;
      this.progress.optionsProcessed += question.options.length;
    }
  }

  /**
   * Import options for a question
   */
  private async importOptions(
    question: BookQuestion,
    questionId: string
  ): Promise<void> {
    let correctAnswers: number[] = [];

    // Handle different correct answer formats
    if (typeof question.correct_answer === 'string') {
      // Standard format: "1,3" or "4"
      correctAnswers = question.correct_answer
        .split(',')
        .map(a => parseInt(a.trim()));
    } else if (
      typeof question.correct_answer === 'object' &&
      question.type === 'matrix_grid'
    ) {
      // Matrix grid format: collect all correct answers from all categories
      const matrixAnswer = question.correct_answer as MatrixCorrectAnswer;
      for (const category in matrixAnswer) {
        const categoryAnswers = matrixAnswer[category].map(a =>
          parseInt(a.trim())
        );
        correctAnswers.push(...categoryAnswers);
      }
    }

    for (let i = 0; i < question.options.length; i++) {
      const optionText = question.options[i];
      const isCorrect = correctAnswers.includes(i + 1);

      const { error } = await supabase.from('options').insert({
        text: optionText,
        is_correct: isCorrect,
        question_id: questionId,
      });

      if (error) {
        throw new Error(`Failed to insert option: ${error.message}`);
      }

      this.progress.optionsProcessed++;
    }
  }

  /**
   * Import an image to Vercel Blob Storage and database
   */
  private async importImage(
    image: BookImage,
    conceptId: string | null,
    questionId: string | null,
    extractionConfidence: 'high' | 'medium' | 'low'
  ): Promise<void> {
    try {
      console.log(`      🖼️  Importing image: ${image.filename}`);

      if (this.dryRun) {
        console.log(`      🧪 [DRY RUN] Would import image: ${image.filename}`);
        this.progress.imagesProcessed++;
        return;
      }

      const imagePath = join(this.imagesDir, image.filename);

      // Check if image file exists
      try {
        await stat(imagePath);
      } catch {
        console.warn(`⚠️  Image file not found: ${imagePath}, skipping...`);
        return;
      }

      // Read image file
      const imageBuffer = await readFile(imagePath);
      const imageStats = await stat(imagePath);

      // Get actual image dimensions using sharp
      let width = 800;
      let height = 600;
      try {
        const metadata = await sharp(imageBuffer).metadata();
        width = metadata.width || 800;
        height = metadata.height || 600;
      } catch {
        console.warn(
          `⚠️  Could not extract image dimensions for ${image.filename}, using defaults`
        );
      }

      // Upload to Vercel Blob Storage
      const blob = await put(image.filename, imageBuffer, {
        access: 'public',
        contentType: this.getContentType(image.filename),
        allowOverwrite: true,
      });

      // Insert into database
      const { error } = await supabase.from('images').insert({
        filename: image.filename,
        blob_url: blob.url,
        alt_text: image.description,
        width,
        height,
        file_size: imageStats.size,
        extraction_confidence: extractionConfidence,
        medical_content: image.description,
        concept_id: conceptId,
        question_id: questionId,
      });

      if (error) {
        throw new Error(`Failed to insert image record: ${error.message}`);
      }

      this.progress.imagesProcessed++;
      console.log(`      ✅ Image uploaded: ${blob.url}`);
    } catch {
      this.handleError(`Importing image ${image.filename}`, error);
    }
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get MIME content type for image file
   */
  private getContentType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Handle and log errors
   */
  private handleError(context: string, error: unknown): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const fullError = `${context}: ${errorMsg}`;

    console.error(`❌ ${fullError}`);
    this.progress.errors.push(fullError);
  }

  /**
   * Display final import report
   */
  private displayFinalReport(): void {
    const duration = Date.now() - this.progress.startTime.getTime();
    const durationSec = Math.round(duration / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('📊 NCLEX311 IMPORT COMPLETE - Final Report');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${durationSec}s`);
    console.log(`📄 Pages Processed: ${this.progress.pagesProcessed}`);
    console.log(`📚 Chapters Created: ${this.progress.chaptersCreated}`);
    console.log(`💡 Concepts: ${this.progress.conceptsProcessed}`);
    console.log(`❓ Questions: ${this.progress.questionsProcessed}`);
    console.log(`📝 Options: ${this.progress.optionsProcessed}`);
    console.log(`🖼️  Images: ${this.progress.imagesProcessed}`);
    console.log(`❌ Errors: ${this.progress.errors.length}`);

    if (this.progress.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.progress.errors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      if (this.progress.errors.length > 10) {
        console.log(`... and ${this.progress.errors.length - 10} more errors`);
      }
    }

    console.log('\n✅ Import process finished');
  }
}

// CLI setup
program
  .name('import-content')
  .description(
    'Import NCLEX311 content from pre-extracted JSON files and images'
  )
  .version('1.0.0')
  .option(
    '-d, --data-dir <path>',
    'Directory containing JSON data files',
    'python/final_output'
  )
  .option(
    '-i, --images-dir <path>',
    'Directory containing image files',
    'python/final_output/images'
  )
  .option('--dry-run', 'Simulate import without making database changes', false)
  .action(async options => {
    try {
      const importer = new ContentImporter(
        options.dataDir,
        options.imagesDir,
        options.dryRun
      );

      await importer.import();
      process.exit(0);
    } catch {
      console.error(
        '💥 Import failed:',
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
