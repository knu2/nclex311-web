/**
 * Bookmarks Service for NCLEX311 application
 * Handles all bookmark-related database operations
 */

import { eq, and, desc } from 'drizzle-orm';
import { BaseService, ServiceError } from '@/lib/db/services/BaseService';
import {
  bookmarks,
  concepts,
  chapters,
  notes,
  type Bookmark,
  type InsertBookmark,
} from '@/lib/db/schema';

/**
 * BookmarksService class
 * Provides methods for managing user bookmarks on concepts
 */
export class BookmarksService extends BaseService {
  /**
   * Create a new bookmark for a user
   * Uses onConflictDoNothing to handle duplicate bookmark attempts gracefully
   */
  async createBookmark(userId: string, conceptId: string): Promise<Bookmark> {
    return this.executeOperation(async () => {
      const newBookmark: InsertBookmark = {
        userId,
        conceptId,
      };

      const [bookmark] = await this.db
        .insert(bookmarks)
        .values(newBookmark)
        .onConflictDoNothing()
        .returning();

      if (!bookmark) {
        // Bookmark already exists, fetch and return it
        const existing = await this.getBookmarkByUserAndConcept(
          userId,
          conceptId
        );
        if (!existing) {
          throw new ServiceError(
            'Failed to create or retrieve bookmark',
            'BOOKMARK_ERROR',
            500
          );
        }
        return existing;
      }

      return bookmark;
    }, 'createBookmark');
  }

  /**
   * Remove a bookmark
   * Verifies ownership before deletion
   */
  async removeBookmark(bookmarkId: string, userId: string): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(bookmarks)
        .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new ServiceError(
          'Bookmark not found or unauthorized',
          'NOT_FOUND',
          404
        );
      }
    }, 'removeBookmark');
  }

  /**
   * Get all bookmarks for a user with concept details
   * Includes joins to concepts, chapters, and notes tables
   * Sorted by bookmarked_at DESC
   */
  async getUserBookmarks(userId: string) {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({
          id: bookmarks.id,
          user_id: bookmarks.userId,
          concept_id: bookmarks.conceptId,
          concept_title: concepts.title,
          concept_slug: concepts.slug,
          chapter_number: chapters.chapterNumber,
          chapter_title: chapters.title,
          note_preview: notes.content,
          bookmarked_at: bookmarks.bookmarkedAt,
        })
        .from(bookmarks)
        .innerJoin(concepts, eq(bookmarks.conceptId, concepts.id))
        .innerJoin(chapters, eq(concepts.chapterId, chapters.id))
        .leftJoin(
          notes,
          and(
            eq(notes.conceptId, concepts.id),
            eq(notes.userId, bookmarks.userId)
          )
        )
        .where(eq(bookmarks.userId, userId))
        .orderBy(desc(bookmarks.bookmarkedAt));

      return result;
    }, 'getUserBookmarks');
  }

  /**
   * Get bookmark by user and concept (helper method)
   * Used to fetch existing bookmark when duplicate creation is attempted
   */
  async getBookmarkByUserAndConcept(
    userId: string,
    conceptId: string
  ): Promise<Bookmark | null> {
    return this.executeOperation(async () => {
      const [bookmark] = await this.db
        .select()
        .from(bookmarks)
        .where(
          and(eq(bookmarks.userId, userId), eq(bookmarks.conceptId, conceptId))
        )
        .limit(1);

      return bookmark || null;
    }, 'getBookmarkByUserAndConcept');
  }
}
