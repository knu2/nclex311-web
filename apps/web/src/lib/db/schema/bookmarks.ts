import { pgTable, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { concepts } from './content';

/**
 * Bookmarks table schema
 * Contains user bookmarks for concepts
 *
 * Database structure matches Story 1.5.9:
 * - id (UUID, primary key)
 * - user_id (UUID, references users.id, CASCADE DELETE)
 * - concept_id (UUID, references concepts.id, CASCADE DELETE)
 * - bookmarked_at (TIMESTAMP, default NOW())
 * - UNIQUE constraint on (user_id, concept_id) - user can only bookmark once
 * - Indexes: user_id, concept_id
 */
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conceptId: uuid('concept_id')
      .notNull()
      .references(() => concepts.id, { onDelete: 'cascade' }),
    bookmarkedAt: timestamp('bookmarked_at').defaultNow().notNull(),
  },
  table => ({
    userIdx: index('idx_bookmarks_user').on(table.userId),
    conceptIdx: index('idx_bookmarks_concept').on(table.conceptId),
    uniqueUserConcept: unique('bookmarks_user_concept_unique').on(
      table.userId,
      table.conceptId
    ),
  })
);

// Define relations for proper joins
export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  concept: one(concepts, {
    fields: [bookmarks.conceptId],
    references: [concepts.id],
  }),
}));

// Export inferred types for use throughout the application
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
