import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  json,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Chapters table schema
 * Contains the main chapters/sections of the NCLEX content
 */
export const chapters = pgTable('chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  metadata: json('metadata'),
});

/**
 * Concepts table schema
 * Contains individual concepts within chapters
 */
export const concepts = pgTable('concepts', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  chapterId: uuid('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  metadata: json('metadata'),
});

/**
 * Questions table schema
 * Contains practice questions for each concept
 */
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  conceptId: uuid('concept_id')
    .notNull()
    .references(() => concepts.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  questionType: varchar('question_type', { length: 50 }).notNull(),
  correctAnswer: text('correct_answer'),
  explanation: text('explanation'),
  difficultyLevel: varchar('difficulty_level', { length: 20 }),
  orderIndex: integer('order_index').notNull(),
  metadata: json('metadata'),
});

/**
 * Options table schema
 * Contains answer options for questions
 */
export const options = pgTable('options', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  orderIndex: integer('order_index').notNull(),
  metadata: json('metadata'),
});

/**
 * Images table schema
 * Contains medical images associated with concepts or questions
 */
export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  blobUrl: varchar('blob_url', { length: 512 }).notNull(),
  altText: text('alt_text').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  fileSize: integer('file_size').notNull(),
  extractionConfidence: varchar('extraction_confidence', {
    length: 20,
  }).notNull(),
  medicalContent: text('medical_content').notNull(),
  conceptId: uuid('concept_id').references(() => concepts.id, {
    onDelete: 'set null',
  }),
  questionId: uuid('question_id').references(() => questions.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations between tables for proper joins
export const chaptersRelations = relations(chapters, ({ many }) => ({
  concepts: many(concepts),
}));

export const conceptsRelations = relations(concepts, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [concepts.chapterId],
    references: [chapters.id],
  }),
  questions: many(questions),
  images: many(images),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  concept: one(concepts, {
    fields: [questions.conceptId],
    references: [concepts.id],
  }),
  options: many(options),
  images: many(images),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  concept: one(concepts, {
    fields: [images.conceptId],
    references: [concepts.id],
  }),
  question: one(questions, {
    fields: [images.questionId],
    references: [questions.id],
  }),
}));

// Export inferred types for use throughout the application
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type ChapterUpdate = Partial<NewChapter>;

export type Concept = typeof concepts.$inferSelect;
export type NewConcept = typeof concepts.$inferInsert;
export type ConceptUpdate = Partial<NewConcept>;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionUpdate = Partial<NewQuestion>;

export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;
export type OptionUpdate = Partial<NewOption>;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type ImageUpdate = Partial<NewImage>;
