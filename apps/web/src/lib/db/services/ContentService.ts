/**
 * Content service for NCLEX311 application
 * Handles chapters, concepts, questions, and access control for freemium model
 */

import { eq, asc } from 'drizzle-orm';
import { BaseService, ServiceError } from './BaseService';
import {
  chapters,
  concepts,
  questions,
  options,
  type Chapter,
  type Concept,
  type Question,
  type Option,
} from '../schema/content';
import { type User } from '../schema/users';

// Extended types for API responses
export interface ChapterWithConcepts extends Chapter {
  concepts: ConceptPreview[];
}

export interface ConceptPreview {
  id: string;
  title: string;
  slug: string;
  conceptNumber: number;
  isPremium: boolean;
}

export interface ConceptWithQuestions extends Concept {
  questions: QuestionWithOptions[];
  chapter: Chapter;
  isPremium: boolean;
}

export interface QuestionWithOptions extends Question {
  options: Option[];
}

export interface FreemiumAccessResult<T> {
  hasAccess: boolean;
  data?: T;
  premiumRequired?: boolean;
  chapterNumber?: number;
}

/**
 * Content service implementing freemium access control
 */
export class ContentService extends BaseService {
  private static readonly FREE_CHAPTERS_LIMIT = 4;

  /**
   * Get all chapters with their concepts, including premium indicators
   */
  async getAllChaptersWithConcepts(): Promise<ChapterWithConcepts[]> {
    return this.executeOperation(async () => {
      const chaptersData = await this.db
        .select()
        .from(chapters)
        .orderBy(asc(chapters.chapterNumber));

      const chaptersWithConcepts: ChapterWithConcepts[] = [];

      for (const chapter of chaptersData) {
        const conceptsData = await this.db
          .select({
            id: concepts.id,
            title: concepts.title,
            slug: concepts.slug,
            conceptNumber: concepts.conceptNumber,
          })
          .from(concepts)
          .where(eq(concepts.chapterId, chapter.id))
          .orderBy(asc(concepts.conceptNumber));

        const conceptPreviews: ConceptPreview[] = conceptsData.map(concept => ({
          ...concept,
          isPremium: chapter.chapterNumber > ContentService.FREE_CHAPTERS_LIMIT,
        }));

        chaptersWithConcepts.push({
          ...chapter,
          concepts: conceptPreviews,
        });
      }

      return chaptersWithConcepts;
    }, 'getAllChaptersWithConcepts');
  }

  /**
   * Get a concept by slug with freemium access control
   */
  async getConceptBySlug(
    slug: string,
    user?: User | null
  ): Promise<FreemiumAccessResult<ConceptWithQuestions>> {
    return this.executeOperation(async () => {
      // First, find the concept and its chapter
      const conceptData = await this.db
        .select()
        .from(concepts)
        .leftJoin(chapters, eq(concepts.chapterId, chapters.id))
        .where(eq(concepts.slug, slug))
        .limit(1);

      if (!conceptData[0]) {
        throw new ServiceError(
          'Concept not found',
          'CONCEPT_NOT_FOUND',
          404
        );
      }

      const { concepts: concept, chapters: chapter } = conceptData[0];
      
      if (!chapter) {
        throw new ServiceError(
          'Chapter not found for concept',
          'CHAPTER_NOT_FOUND',
          404
        );
      }

      // Check freemium access
      const isPremium = chapter.chapterNumber > ContentService.FREE_CHAPTERS_LIMIT;
      const hasAccess = !isPremium || user?.subscription === 'PREMIUM';

      // If no access, return restricted result
      if (!hasAccess) {
        return {
          hasAccess: false,
          premiumRequired: true,
          chapterNumber: chapter.chapterNumber,
        };
      }

      // Get questions with options
      const questionsData = await this.db
        .select()
        .from(questions)
        .where(eq(questions.conceptId, concept.id))
        .orderBy(asc(questions.createdAt));

      const questionsWithOptions: QuestionWithOptions[] = [];

      for (const question of questionsData) {
        const optionsData = await this.db
          .select()
          .from(options)
          .where(eq(options.questionId, question.id))
          .orderBy(asc(options.createdAt));

        questionsWithOptions.push({
          ...question,
          options: optionsData,
        });
      }

      return {
        hasAccess: true,
        data: {
          ...concept,
          questions: questionsWithOptions,
          chapter,
          isPremium,
        },
      };
    }, 'getConceptBySlug');
  }

  /**
   * Get a concept by ID with freemium access control
   */
  async getConceptById(
    id: string,
    user?: User | null
  ): Promise<FreemiumAccessResult<ConceptWithQuestions>> {
    return this.executeOperation(async () => {
      // First, find the concept and its chapter
      const conceptData = await this.db
        .select()
        .from(concepts)
        .leftJoin(chapters, eq(concepts.chapterId, chapters.id))
        .where(eq(concepts.id, id))
        .limit(1);

      if (!conceptData[0]) {
        throw new ServiceError(
          'Concept not found',
          'CONCEPT_NOT_FOUND',
          404
        );
      }

      const { concepts: concept, chapters: chapter } = conceptData[0];
      
      if (!chapter) {
        throw new ServiceError(
          'Chapter not found for concept',
          'CHAPTER_NOT_FOUND',
          404
        );
      }

      // Check freemium access
      const isPremium = chapter.chapterNumber > ContentService.FREE_CHAPTERS_LIMIT;
      const hasAccess = !isPremium || user?.subscription === 'PREMIUM';

      // If no access, return restricted result
      if (!hasAccess) {
        return {
          hasAccess: false,
          premiumRequired: true,
          chapterNumber: chapter.chapterNumber,
        };
      }

      // Get questions with options
      const questionsData = await this.db
        .select()
        .from(questions)
        .where(eq(questions.conceptId, concept.id))
        .orderBy(asc(questions.createdAt));

      const questionsWithOptions: QuestionWithOptions[] = [];

      for (const question of questionsData) {
        const optionsData = await this.db
          .select()
          .from(options)
          .where(eq(options.questionId, question.id))
          .orderBy(asc(options.createdAt));

        questionsWithOptions.push({
          ...question,
          options: optionsData,
        });
      }

      return {
        hasAccess: true,
        data: {
          ...concept,
          questions: questionsWithOptions,
          chapter,
          isPremium,
        },
      };
    }, 'getConceptById');
  }

  /**
   * Check if a chapter is free (chapters 1-4)
   */
  isChapterFree(chapterNumber: number): boolean {
    return chapterNumber <= ContentService.FREE_CHAPTERS_LIMIT;
  }

  /**
   * Get chapter by ID
   */
  async getChapterById(id: string): Promise<Chapter | null> {
    return this.findById(chapters, id);
  }

  /**
   * Get chapter by slug
   */
  async getChapterBySlug(slug: string): Promise<Chapter | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(chapters)
        .where(eq(chapters.slug, slug))
        .limit(1);

      return result[0] || null;
    }, 'getChapterBySlug');
  }
}