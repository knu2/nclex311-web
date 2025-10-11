import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { concepts } from './content';

/**
 * Comments table schema
 * Contains user comments on concepts for community discussion
 *
 * Database structure matches Story 1.5.6:
 * - id (UUID, primary key)
 * - user_id (UUID, references users.id, CASCADE DELETE)
 * - concept_id (UUID, references concepts.id, CASCADE DELETE)
 * - content (TEXT, max 2000 chars validated at API level)
 * - created_at (TIMESTAMP, default NOW())
 * - updated_at (TIMESTAMP, default NOW())
 * - Indexes: concept_id, created_at (DESC)
 */
export const comments = pgTable(
  'comments',
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
    conceptIdx: index('idx_comments_concept').on(table.conceptId),
    createdAtIdx: index('idx_comments_created_at').on(table.createdAt),
  })
);

/**
 * Comment likes table schema
 * Contains like relationships between users and comments
 *
 * Database structure matches Story 1.5.6:
 * - id (UUID, primary key)
 * - user_id (UUID, references users.id, CASCADE DELETE)
 * - comment_id (UUID, references comments.id, CASCADE DELETE)
 * - created_at (TIMESTAMP, default NOW())
 * - UNIQUE constraint on (user_id, comment_id) - user can only like once
 * - Index: comment_id
 */
export const commentLikes = pgTable(
  'comment_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    commentIdx: index('idx_comment_likes_comment').on(table.commentId),
    userCommentUnique: unique('comment_likes_user_comment_unique').on(
      table.userId,
      table.commentId
    ),
  })
);

// Define relations for proper joins
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  concept: one(concepts, {
    fields: [comments.conceptId],
    references: [concepts.id],
  }),
  likes: many(commentLikes),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
}));

// Export inferred types for use throughout the application
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentUpdate = Partial<Omit<Comment, 'id' | 'createdAt'>>;

export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;

// Extended types for API responses
export interface CommentWithUser extends Comment {
  user_name: string;
}

export interface CommentWithLikes extends CommentWithUser {
  like_count: number;
  is_liked_by_user: boolean;
}
