/**
 * Smart Slug Generator for NCLEX311 Content Import
 *
 * Implements three-tier strategy for generating unique concept slugs:
 * 1. Clean Base Slug (Priority 1) - SEO-friendly for first occurrence
 * 2. Contextual Differentiation (Priority 2) - Extract meaningful context from content
 * 3. Sequential Numbering (Fallback) - Reliable fallback ensuring zero import failures
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ConceptContext {
  title: string;
  chapterTitle: string;
  bookPage: number;
  keyPoints: string;
  category: string;
}

export interface SlugGenerationResult {
  slug: string;
  strategy: 'clean' | 'contextual' | 'sequential';
  processingTime: number;
  collisionCount: number;
  context?: string;
}

export class SmartSlugGenerator {
  private supabase: SupabaseClient;
  private globalSlugs: Set<string> = new Set();
  private contextPatterns: RegExp[] = [
    // Medical specialties (expanded)
    /\b(pediatric|adult|geriatric|neonatal|adolescent|infant|child|teen|elderly)\b/i,
    // Body systems (expanded)
    /\b(cardiac|pulmonary|renal|hepatic|neurologic|gastrointestinal|musculoskeletal|endocrine|reproductive|immune|respiratory|cardiovascular|nervous|digestive)\b/i,
    // Severity modifiers (expanded)
    /\b(acute|chronic|severe|mild|critical|moderate|post-operative|pre-operative|emergency|urgent|elective|routine)\b/i,
    // Treatment context (expanded)
    /\b(medication|surgery|therapy|assessment|prevention|diagnosis|treatment|rehabilitation|monitoring|intervention|management|care)\b/i,
    // Medical procedures (expanded)
    /\b(catheter|intubation|ventilation|dialysis|transfusion|surgical|diagnostic|therapeutic|procedure|operation|examination)\b/i,
    // Patient care contexts (expanded)
    /\b(inpatient|outpatient|home|community|clinic|hospital|icu|emergency|ward|unit|department)\b/i,
    // Clinical conditions
    /\b(infection|inflammation|disease|disorder|syndrome|condition|complication|manifestation)\b/i,
    // Medical states
    /\b(stable|unstable|deteriorating|improving|compensated|decompensated|progressive)\b/i,
  ];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Generate a unique slug for a concept using the three-tier strategy
   */
  async generateUniqueConceptSlug(
    context: ConceptContext
  ): Promise<SlugGenerationResult> {
    const startTime = Date.now();
    const baseSlug = this.generateBaseSlug(context.title);

    try {
      // Check database for existing conflicts
      const existingSlugs = await this.queryExistingSlugs(baseSlug);

      if (existingSlugs.length === 0 && !this.globalSlugs.has(baseSlug)) {
        // Clean slug available
        this.globalSlugs.add(baseSlug);
        return {
          slug: baseSlug,
          strategy: 'clean',
          processingTime: Date.now() - startTime,
          collisionCount: 0,
        };
      }

      // Attempt contextual differentiation
      const contextualResult = this.tryContextualDifferentiation(
        context,
        existingSlugs
      );
      if (contextualResult) {
        const { slug: contextualSlug, context: usedContext } = contextualResult;
        if (!this.globalSlugs.has(contextualSlug)) {
          this.globalSlugs.add(contextualSlug);
          return {
            slug: contextualSlug,
            strategy: 'contextual',
            processingTime: Date.now() - startTime,
            collisionCount: existingSlugs.length,
            context: usedContext,
          };
        }
      }

      // Fall back to sequential numbering
      const sequentialSlug = this.generateSequentialSlug(baseSlug, [
        ...existingSlugs,
        ...Array.from(this.globalSlugs),
      ]);
      this.globalSlugs.add(sequentialSlug);

      return {
        slug: sequentialSlug,
        strategy: 'sequential',
        processingTime: Date.now() - startTime,
        collisionCount: existingSlugs.length,
      };
    } catch (error) {
      console.error('Error generating unique slug:', error);
      // Emergency fallback - generate with timestamp to ensure uniqueness
      const timestampSlug = `${baseSlug}-${Date.now()}`;
      this.globalSlugs.add(timestampSlug);

      return {
        slug: timestampSlug,
        strategy: 'sequential',
        processingTime: Date.now() - startTime,
        collisionCount: -1, // Indicates error occurred
      };
    }
  }

  /**
   * Generate clean base slug from title
   */
  private generateBaseSlug(title: string): string {
    return (
      title
        .toLowerCase()
        // Remove special characters except spaces and hyphens
        .replace(/[^a-z0-9\s-]/g, '')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Convert spaces to hyphens
        .replace(/\s/g, '-')
        // Remove multiple consecutive hyphens
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        .trim()
    );
  }

  /**
   * Query database for existing slugs that match the base pattern
   */
  private async queryExistingSlugs(baseSlug: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('concepts')
      .select('slug')
      .like('slug', `${baseSlug}%`)
      .order('slug');

    if (error) {
      console.error('Database query error for slug conflicts:', error);
      return [];
    }

    return data ? data.map(row => row.slug) : [];
  }

  /**
   * Attempt to find contextual differentiation from content
   */
  private tryContextualDifferentiation(
    context: ConceptContext,
    existing: string[]
  ): { slug: string; context: string } | null {
    const baseSlug = this.generateBaseSlug(context.title);
    const searchText = `${context.keyPoints} ${context.chapterTitle}`;

    // Try each context pattern - search both key points and chapter title
    for (const pattern of this.contextPatterns) {
      const match = searchText.match(pattern);
      if (match) {
        const contextTerm = match[1].toLowerCase();
        const contextSlug = `${baseSlug}-${contextTerm}`;

        if (!existing.includes(contextSlug)) {
          return {
            slug: contextSlug,
            context: contextTerm,
          };
        }
      }
    }

    // Try chapter-based context as fallback (but make it more meaningful)
    const chapterSlugBase = this.generateBaseSlug(context.chapterTitle);

    // Use abbreviated chapter names for cleaner URLs
    const chapterAbbreviations: { [key: string]: string } = {
      'management-of-care': 'mgmt',
      'safety-and-infection-control': 'safety',
      'psychosocial-integrity': 'psychosocial',
      'pharmacological-and-parenteral-therapies': 'pharm',
      'physiological-adaptation': 'physio',
      'reduction-of-risk-potential': 'risk-reduction',
      'health-promotion-and-maintenance': 'health-promo',
      'basic-care-and-comfort': 'basic-care',
    };

    const chapterContext =
      chapterAbbreviations[chapterSlugBase] || chapterSlugBase;
    const chapterSlug = `${baseSlug}-${chapterContext}`;

    if (!existing.includes(chapterSlug)) {
      return {
        slug: chapterSlug,
        context: chapterContext,
      };
    }

    return null;
  }

  /**
   * Generate sequential slug with next available number
   */
  private generateSequentialSlug(
    baseSlug: string,
    existingSlugs: string[]
  ): string {
    const slugPattern = new RegExp(`^${baseSlug}(-\d+)?$`);
    const matchingSlugs = existingSlugs.filter(slug => slugPattern.test(slug));

    if (matchingSlugs.length === 0) {
      // Base slug is available
      return baseSlug;
    }

    // Find the highest number used
    let highestNumber = 1;
    for (const slug of matchingSlugs) {
      if (slug === baseSlug) {
        // Base slug exists, so start from 2
        continue;
      }

      const match = slug.match(/-(\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    }

    // Return next available number
    const nextNumber = highestNumber + 1;
    return `${baseSlug}-${nextNumber}`;
  }

  /**
   * Reset the in-memory cache (useful for testing)
   */
  reset(): void {
    this.globalSlugs.clear();
  }

  /**
   * Get statistics about current session
   */
  getStats() {
    return {
      cachedSlugs: this.globalSlugs.size,
      patterns: this.contextPatterns.length,
    };
  }

  /**
   * Log slug generation decision for debugging
   */
  logSlugDecision(result: SlugGenerationResult, context: ConceptContext): void {
    const logMessage = [
      `Slug Generation: "${context.title}" → "${result.slug}"`,
      `Strategy: ${result.strategy}`,
      `Time: ${result.processingTime}ms`,
      `Collisions: ${result.collisionCount}`,
    ];

    if (result.context) {
      logMessage.push(`Context: ${result.context}`);
    }

    console.log(`  🏷️  ${logMessage.join(' | ')}`);
  }
}
