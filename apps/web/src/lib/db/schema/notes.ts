import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { concepts } from './content';

/**
 * Notes table schema for NCLEX311 application
 * Stores user's personal notes for concepts
 *
 * Database structure:
 * - id (UUID, primary key)
 * - user_id (UUID, foreign key to users, not null)
 * - concept_id (UUID, foreign key to concepts, not null)
 * - content (TEXT, not null, max 2000 chars enforced at application level)
 * - created_at (TIMESTAMPTZ, default NOW())
 * - updated_at (TIMESTAMPTZ, default NOW())
 * - UNIQUE constraint on (user_id, concept_id) - one note per user per concept
 */
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conceptId: uuid('concept_id')
      .notNull()
      .references(() => concepts.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    // Unique index to ensure one note per user per concept
    userConceptIdx: uniqueIndex('idx_notes_user_concept').on(
      table.userId,
      table.conceptId
    ),
  })
);

// Export inferred types for use throughout the application
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteUpdate = Partial<
  Omit<Note, 'id' | 'userId' | 'conceptId' | 'createdAt'>
>;

// API response type (excluding internal IDs in some contexts)
export type NoteResponse = Note;
