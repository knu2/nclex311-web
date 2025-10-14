/**
 * Progress service for tracking user concept completion
 * Story 1.5.8: Progress Dashboard
 */

import { eq, and, asc, inArray } from 'drizzle-orm';
import { BaseService, ServiceError } from './BaseService';
import { chapters, concepts } from '../schema/content';
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

// Define completed_concepts table schema
export const completedConcepts = pgTable('completed_concepts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  conceptId: uuid('concept_id').notNull(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
});

export type CompletedConcept = typeof completedConcepts.$inferSelect;

// Progress data interfaces
export interface CompletedConceptDetail {
  concept_id: string;
  concept_title: string;
  concept_slug: string;
  completed_at: string;
}

export interface ChapterProgress {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  concept_count: number;
  completed_concept_count: number;
  completion_percentage: number;
  completed_concepts: CompletedConceptDetail[];
}

export interface OverallProgress {
  total_concepts: number;
  completed_concepts: number;
  completion_percentage: number;
}

export interface UserProgress {
  user_id: string;
  overall_progress: OverallProgress;
  chapters: ChapterProgress[];
}

/**
 * Progress service for managing concept completion tracking
 */
export class ProgressService extends BaseService {
  /**
   * Mark a concept as complete for a user
   */
  async markConceptComplete(
    userId: string,
    conceptId: string
  ): Promise<{ completed_at: string }> {
    return this.executeOperation(async () => {
      // Check if already completed
      const existing = await this.db
        .select()
        .from(completedConcepts)
        .where(
          and(
            eq(completedConcepts.userId, userId),
            eq(completedConcepts.conceptId, conceptId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Already completed, return existing
        return { completed_at: existing[0].completedAt.toISOString() };
      }

      // Insert new completion record
      const result = await this.db
        .insert(completedConcepts)
        .values({
          userId,
          conceptId,
        })
        .returning();

      if (!result[0]) {
        throw new ServiceError(
          'Failed to mark concept as complete',
          'INSERT_FAILED',
          500
        );
      }

      return { completed_at: result[0].completedAt.toISOString() };
    }, 'markConceptComplete');
  }

  /**
   * Unmark a concept as complete for a user
   */
  async unmarkConceptComplete(
    userId: string,
    conceptId: string
  ): Promise<void> {
    return this.executeOperation(async () => {
      await this.db
        .delete(completedConcepts)
        .where(
          and(
            eq(completedConcepts.userId, userId),
            eq(completedConcepts.conceptId, conceptId)
          )
        );
    }, 'unmarkConceptComplete');
  }

  /**
   * Get comprehensive progress data for a user
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    return this.executeOperation(async () => {
      // Fetch all chapters with their concepts
      const chaptersData = await this.db
        .select()
        .from(chapters)
        .orderBy(asc(chapters.chapterNumber));

      // Fetch all completed concepts for the user
      const completedData = await this.db
        .select({
          conceptId: completedConcepts.conceptId,
          completedAt: completedConcepts.completedAt,
          conceptTitle: concepts.title,
          conceptSlug: concepts.slug,
          chapterId: concepts.chapterId,
        })
        .from(completedConcepts)
        .leftJoin(concepts, eq(completedConcepts.conceptId, concepts.id))
        .where(eq(completedConcepts.userId, userId));

      // Create a map of completed concepts by concept_id
      const completedMap = new Map<
        string,
        {
          completed_at: string;
          concept_title: string;
          concept_slug: string;
        }
      >();

      completedData.forEach(item => {
        if (item.conceptTitle && item.conceptSlug) {
          completedMap.set(item.conceptId, {
            completed_at: item.completedAt.toISOString(),
            concept_title: item.conceptTitle,
            concept_slug: item.conceptSlug,
          });
        }
      });

      // Build chapter progress data
      let totalConcepts = 0;
      let totalCompleted = 0;
      const chapterProgressData: ChapterProgress[] = [];

      for (const chapter of chaptersData) {
        // Get all concepts for this chapter
        const chapterConcepts = await this.db
          .select({
            id: concepts.id,
            title: concepts.title,
            slug: concepts.slug,
          })
          .from(concepts)
          .where(eq(concepts.chapterId, chapter.id))
          .orderBy(asc(concepts.conceptNumber));

        const conceptCount = chapterConcepts.length;
        totalConcepts += conceptCount;

        // Filter completed concepts for this chapter
        const completed: CompletedConceptDetail[] = [];
        chapterConcepts.forEach(concept => {
          const completionData = completedMap.get(concept.id);
          if (completionData) {
            completed.push({
              concept_id: concept.id,
              concept_title: completionData.concept_title,
              concept_slug: completionData.concept_slug,
              completed_at: completionData.completed_at,
            });
            totalCompleted++;
          }
        });

        // Sort completed concepts by completion date (most recent first)
        completed.sort(
          (a, b) =>
            new Date(b.completed_at).getTime() -
            new Date(a.completed_at).getTime()
        );

        const completedCount = completed.length;
        const completionPercentage =
          conceptCount > 0
            ? Math.round((completedCount / conceptCount) * 100)
            : 0;

        chapterProgressData.push({
          chapter_id: chapter.id,
          chapter_number: chapter.chapterNumber,
          chapter_title: chapter.title,
          concept_count: conceptCount,
          completed_concept_count: completedCount,
          completion_percentage: completionPercentage,
          completed_concepts: completed,
        });
      }

      // Calculate overall completion percentage
      const overallPercentage =
        totalConcepts > 0
          ? Math.round((totalCompleted / totalConcepts) * 100)
          : 0;

      return {
        user_id: userId,
        overall_progress: {
          total_concepts: totalConcepts,
          completed_concepts: totalCompleted,
          completion_percentage: overallPercentage,
        },
        chapters: chapterProgressData,
      };
    }, 'getUserProgress');
  }

  /**
   * Check if a concept is completed by a user
   */
  async isConceptCompleted(
    userId: string,
    conceptId: string
  ): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(completedConcepts)
        .where(
          and(
            eq(completedConcepts.userId, userId),
            eq(completedConcepts.conceptId, conceptId)
          )
        )
        .limit(1);

      return result.length > 0;
    }, 'isConceptCompleted');
  }

  /**
   * Get completion status for multiple concepts at once
   * Returns a Set of completed concept IDs for efficient lookup
   */
  async getCompletedConceptIds(
    userId: string,
    conceptIds: string[]
  ): Promise<Set<string>> {
    return this.executeOperation(async () => {
      if (conceptIds.length === 0) {
        return new Set<string>();
      }

      // Use SQL IN clause to fetch all at once
      const result = await this.db
        .select({ conceptId: completedConcepts.conceptId })
        .from(completedConcepts)
        .where(
          and(
            eq(completedConcepts.userId, userId),
            inArray(completedConcepts.conceptId, conceptIds)
          )
        );

      return new Set(result.map(r => r.conceptId));
    }, 'getCompletedConceptIds');
  }
}
