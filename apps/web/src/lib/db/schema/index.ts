/**
 * Main schema export file for NCLEX311 Drizzle ORM
 * Centralizes all table schemas and type exports
 */

// Export all user-related schemas and types
export * from './users';

// Export all content-related schemas and types
export * from './content';

// Export all notes-related schemas and types
export * from './notes';

// Export all comments-related schemas and types
export * from './comments';

// Export all bookmarks-related schemas and types
export * from './bookmarks';

// Export all payments-related schemas and types
export * from './payments';

// Re-export commonly used Drizzle types
export type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// Export database schema for connection typing
import { users } from './users';
import {
  chapters,
  concepts,
  questions,
  options,
  images,
  chaptersRelations,
  conceptsRelations,
  questionsRelations,
  optionsRelations,
  imagesRelations,
} from './content';
import { notes } from './notes';
import {
  comments,
  commentLikes,
  commentsRelations,
  commentLikesRelations,
} from './comments';
import { bookmarks, bookmarksRelations } from './bookmarks';
import { orders, webhookLogs } from './payments';

/**
 * Complete database schema including all tables and relations
 * Used for Drizzle ORM initialization and type inference
 */
export const schema = {
  // Tables
  users,
  chapters,
  concepts,
  questions,
  options,
  images,
  notes,
  comments,
  commentLikes,
  bookmarks,
  orders,
  webhookLogs,

  // Relations
  chaptersRelations,
  conceptsRelations,
  questionsRelations,
  optionsRelations,
  imagesRelations,
  commentsRelations,
  commentLikesRelations,
  bookmarksRelations,
};

// Export table names for reference
export const tableNames = {
  users: 'users',
  chapters: 'chapters',
  concepts: 'concepts',
  questions: 'questions',
  options: 'options',
  images: 'images',
  notes: 'notes',
  comments: 'comments',
  commentLikes: 'comment_likes',
  bookmarks: 'bookmarks',
  orders: 'orders',
  webhookLogs: 'webhook_logs',
} as const;
