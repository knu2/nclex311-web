/**
 * Comment Service for NCLEX311 application
 * Handles all comment-related database operations for concept discussions
 */

import { eq, and, desc, count, sql } from 'drizzle-orm';
import { BaseService, ServiceError } from '@/lib/db/services/BaseService';
import {
  comments,
  commentLikes,
  users,
  type Comment,
  type NewComment,
  type NewCommentLike,
  type CommentWithLikes,
} from '@/lib/db/schema';

/**
 * CommentService class
 * Provides methods for managing comments and likes on concepts
 */
export class CommentService extends BaseService {
  /**
   * Create a new comment on a concept
   * Validates content length (max 2000 characters) and ensures non-empty content
   */
  async createComment(
    conceptId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    // Validation
    if (!content || content.trim().length === 0) {
      throw new ServiceError(
        'Comment content cannot be empty',
        'INVALID_INPUT',
        400
      );
    }

    if (content.length > 2000) {
      throw new ServiceError(
        'Comment exceeds 2000 character limit',
        'INVALID_INPUT',
        400
      );
    }

    return this.executeOperation(async () => {
      const newComment: NewComment = {
        conceptId,
        userId,
        content: content.trim(),
      };

      const result = await this.db
        .insert(comments)
        .values(newComment)
        .returning();

      return result[0];
    }, 'createComment');
  }

  /**
   * Get comments for a concept with pagination and like information
   * Returns comments sorted by newest first with user info and like counts
   */
  async getCommentsByConceptId(
    conceptId: string,
    page: number = 1,
    pageSize: number = 20,
    currentUserId?: string
  ): Promise<{ comments: CommentWithLikes[]; totalCount: number }> {
    return this.executeOperation(async () => {
      const offset = (page - 1) * pageSize;

      // Build the select query with aggregations
      // We need: comment data, user email, like count, and whether current user liked it
      const commentsQuery = this.db
        .select({
          id: comments.id,
          userId: comments.userId,
          conceptId: comments.conceptId,
          content: comments.content,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          user_name: users.email,
          like_count: sql<number>`CAST(COUNT(DISTINCT ${commentLikes.id}) AS INTEGER)`,
          is_liked_by_user: currentUserId
            ? sql<boolean>`CAST(CASE WHEN EXISTS (
                SELECT 1 FROM ${commentLikes} 
                WHERE ${commentLikes.commentId} = ${comments.id} 
                AND ${commentLikes.userId} = ${currentUserId}
              ) THEN true ELSE false END AS BOOLEAN)`
            : sql<boolean>`false`,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .leftJoin(commentLikes, eq(commentLikes.commentId, comments.id))
        .where(eq(comments.conceptId, conceptId))
        .groupBy(comments.id, users.email)
        .orderBy(desc(comments.createdAt))
        .limit(pageSize)
        .offset(offset);

      // Get total count
      const countResult = await this.db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.conceptId, conceptId));

      const [commentsData, totalCount] = await Promise.all([
        commentsQuery,
        Promise.resolve(countResult[0]?.count || 0),
      ]);

      return {
        comments: commentsData as CommentWithLikes[],
        totalCount: Number(totalCount),
      };
    }, 'getCommentsByConceptId');
  }

  /**
   * Like a comment
   * Uses ON CONFLICT DO NOTHING to handle duplicate likes gracefully
   * Returns the updated like count
   */
  async likeComment(commentId: string, userId: string): Promise<number> {
    return this.executeOperation(async () => {
      // Verify comment exists
      const comment = await this.findById(comments, commentId);
      if (!comment) {
        throw new ServiceError('Comment not found', 'NOT_FOUND', 404);
      }

      // Insert like (on conflict do nothing due to UNIQUE constraint)
      const newLike: NewCommentLike = {
        commentId,
        userId,
      };

      await this.db.insert(commentLikes).values(newLike).onConflictDoNothing();

      // Get updated like count
      const countResult = await this.db
        .select({ count: count() })
        .from(commentLikes)
        .where(eq(commentLikes.commentId, commentId));

      return Number(countResult[0]?.count || 0);
    }, 'likeComment');
  }

  /**
   * Unlike a comment
   * Removes the like relationship and returns the updated like count
   */
  async unlikeComment(commentId: string, userId: string): Promise<number> {
    return this.executeOperation(async () => {
      // Verify comment exists
      const comment = await this.findById(comments, commentId);
      if (!comment) {
        throw new ServiceError('Comment not found', 'NOT_FOUND', 404);
      }

      // Delete like
      await this.db
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.userId, userId)
          )
        );

      // Get updated like count
      const countResult = await this.db
        .select({ count: count() })
        .from(commentLikes)
        .where(eq(commentLikes.commentId, commentId));

      return Number(countResult[0]?.count || 0);
    }, 'unlikeComment');
  }

  /**
   * Get a single comment with like status for a specific user
   * Helper method for retrieving detailed comment information
   */
  async getCommentWithLikeStatus(
    commentId: string,
    userId?: string
  ): Promise<CommentWithLikes | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({
          id: comments.id,
          userId: comments.userId,
          conceptId: comments.conceptId,
          content: comments.content,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          user_name: users.email,
          like_count: sql<number>`CAST(COUNT(DISTINCT ${commentLikes.id}) AS INTEGER)`,
          is_liked_by_user: userId
            ? sql<boolean>`CAST(CASE WHEN EXISTS (
                SELECT 1 FROM ${commentLikes} 
                WHERE ${commentLikes.commentId} = ${comments.id} 
                AND ${commentLikes.userId} = ${userId}
              ) THEN true ELSE false END AS BOOLEAN)`
            : sql<boolean>`false`,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .leftJoin(commentLikes, eq(commentLikes.commentId, comments.id))
        .where(eq(comments.id, commentId))
        .groupBy(comments.id, users.email)
        .limit(1);

      return (result[0] as CommentWithLikes) || null;
    }, 'getCommentWithLikeStatus');
  }
}
