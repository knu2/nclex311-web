/**
 * NotesService for managing user notes on concepts
 * Provides CRUD operations for personal notes
 */

import { eq, and } from 'drizzle-orm';
import { BaseService, ServiceError } from './BaseService';
import { notes, type Note, type NewNote } from '../schema/notes';

const MAX_NOTE_LENGTH = 2000;

/**
 * Service for managing user notes
 * Handles creation, retrieval, update, and deletion of personal concept notes
 */
export class NotesService extends BaseService {
  /**
   * Get a user's note for a specific concept
   * @param userId - The user's ID
   * @param conceptId - The concept ID
   * @returns The note if it exists, null otherwise
   */
  async getUserNote(userId: string, conceptId: string): Promise<Note | null> {
    return this.executeOperation(async () => {
      const results = await this.db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.conceptId, conceptId)))
        .limit(1);

      return results[0] || null;
    }, 'NotesService.getUserNote');
  }

  /**
   * Create or update a note for a concept
   * Uses upsert logic: creates new note if none exists, updates if it does
   * @param userId - The user's ID
   * @param conceptId - The concept ID
   * @param content - The note content (max 2000 characters)
   * @returns The created or updated note
   */
  async upsertNote(
    userId: string,
    conceptId: string,
    content: string
  ): Promise<Note> {
    // Validate content length
    if (content.length > MAX_NOTE_LENGTH) {
      throw new ServiceError(
        `Note content exceeds maximum length of ${MAX_NOTE_LENGTH} characters`,
        'NOTE_TOO_LONG',
        400,
        { maxLength: MAX_NOTE_LENGTH, actualLength: content.length }
      );
    }

    // Validate content is not empty
    if (content.trim().length === 0) {
      throw new ServiceError(
        'Note content cannot be empty',
        'EMPTY_CONTENT',
        400
      );
    }

    return this.executeOperation(async () => {
      // Check if note already exists
      const existingNote = await this.getUserNote(userId, conceptId);

      if (existingNote) {
        // Update existing note
        const updated = await this.db
          .update(notes)
          .set({
            content,
            updatedAt: new Date(),
          })
          .where(eq(notes.id, existingNote.id))
          .returning();

        return updated[0];
      } else {
        // Create new note
        const newNote: NewNote = {
          userId,
          conceptId,
          content,
        };

        const created = await this.db.insert(notes).values(newNote).returning();

        return created[0];
      }
    }, 'NotesService.upsertNote');
  }

  /**
   * Delete a user's note for a concept
   * @param userId - The user's ID
   * @param conceptId - The concept ID
   * @returns True if note was deleted, false if it didn't exist
   */
  async deleteNote(userId: string, conceptId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(notes)
        .where(and(eq(notes.userId, userId), eq(notes.conceptId, conceptId)))
        .returning();

      return result.length > 0;
    }, 'NotesService.deleteNote');
  }

  /**
   * Get all notes for a user
   * @param userId - The user's ID
   * @returns Array of all notes for the user
   */
  async getAllUserNotes(userId: string): Promise<Note[]> {
    return this.executeOperation(async () => {
      return await this.db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(notes.updatedAt);
    }, 'NotesService.getAllUserNotes');
  }

  /**
   * Check if a user has a note for a specific concept
   * @param userId - The user's ID
   * @param conceptId - The concept ID
   * @returns True if note exists, false otherwise
   */
  async hasNote(userId: string, conceptId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const note = await this.getUserNote(userId, conceptId);
      return note !== null;
    }, 'NotesService.hasNote');
  }
}
