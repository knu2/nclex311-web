/**
 * Integration tests for Comments API routes
 * Tests actual database operations with CommentService
 *
 * @jest-environment node
 */

import { CommentService } from '@/lib/db/services';
import { UserService } from '@/lib/db/services';

describe('Comments API Integration Tests', () => {
  // Skip these tests if we don't have a test database configured
  const skipTests =
    !process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

  let commentService: CommentService;
  let userService: UserService;
  let testUserId: string | null = null;
  const testConceptId: string = '00000000-0000-0000-0000-000000000001'; // Placeholder concept ID
  let createdCommentIds: string[] = [];

  beforeAll(async () => {
    if (skipTests) {
      console.log(
        'Skipping comments integration tests - no test database configured'
      );
      return;
    }

    userService = new UserService();
    commentService = new CommentService();

    // Create a test user for authenticated operations
    try {
      const testEmail = `comments-test-${Date.now()}@integration.test`;
      const testUser = await userService.registerUser(
        testEmail,
        'test-password-123'
      );
      testUserId = testUser.id;
    } catch (error) {
      console.warn('Failed to create test user:', error);
    }
  });

  afterAll(async () => {
    if (!skipTests) {
      // Comments will be deleted via cascade when user is deleted
      // No explicit cleanup needed for individual comments

      // Cleanup test user
      if (testUserId) {
        try {
          await userService.deleteUser(testUserId);
        } catch (error) {
          console.warn('Failed to cleanup test user:', error);
        }
      }

      // Note: Services use shared connection pool, no cleanup needed
    }
  });

  afterEach(() => {
    createdCommentIds = [];
  });

  describe('CommentService - Create Comment', () => {
    (skipTests ? it.skip : it)(
      'should create a comment with valid input',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const content = 'This is a test comment for integration testing';
        const comment = await commentService.createComment(
          testConceptId,
          testUserId,
          content
        );

        createdCommentIds.push(comment.id);

        expect(comment).toHaveProperty('id');
        expect(comment.conceptId).toBe(testConceptId);
        expect(comment.userId).toBe(testUserId);
        expect(comment.content).toBe(content);
        expect(comment).toHaveProperty('createdAt');
        expect(comment).toHaveProperty('updatedAt');
      },
      10000
    );

    (skipTests ? it.skip : it)('should reject empty content', async () => {
      if (!testUserId) throw new Error('Test user not created');

      await expect(
        commentService.createComment(testConceptId, testUserId, '')
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        statusCode: 400,
      });

      await expect(
        commentService.createComment(testConceptId, testUserId, '   ')
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        statusCode: 400,
      });
    });

    (skipTests ? it.skip : it)(
      'should reject content over 2000 characters',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const longContent = 'a'.repeat(2001);

        await expect(
          commentService.createComment(testConceptId, testUserId, longContent)
        ).rejects.toMatchObject({
          code: 'INVALID_INPUT',
          statusCode: 400,
        });
      }
    );

    (skipTests ? it.skip : it)(
      'should trim whitespace from content',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const content = '  Test comment with whitespace  ';
        const comment = await commentService.createComment(
          testConceptId,
          testUserId,
          content
        );

        createdCommentIds.push(comment.id);

        expect(comment.content).toBe('Test comment with whitespace');
      }
    );
  });

  describe('CommentService - Get Comments', () => {
    beforeEach(async () => {
      if (skipTests || !testUserId) return;

      // Create multiple test comments for pagination testing
      const commentsToCreate = [
        'First test comment',
        'Second test comment',
        'Third test comment',
      ];

      for (const content of commentsToCreate) {
        const comment = await commentService.createComment(
          testConceptId,
          testUserId,
          content
        );
        createdCommentIds.push(comment.id);
      }
    });

    (skipTests ? it.skip : it)(
      'should fetch comments with pagination',
      async () => {
        const result = await commentService.getCommentsByConceptId(
          testConceptId,
          1,
          20
        );

        expect(result).toHaveProperty('comments');
        expect(result).toHaveProperty('totalCount');
        expect(Array.isArray(result.comments)).toBe(true);
        expect(typeof result.totalCount).toBe('number');
        expect(result.totalCount).toBeGreaterThanOrEqual(3); // At least our 3 test comments
      },
      10000
    );

    (skipTests ? it.skip : it)(
      'should include user information in comments',
      async () => {
        const result = await commentService.getCommentsByConceptId(
          testConceptId,
          1,
          20
        );

        expect(result.comments.length).toBeGreaterThan(0);
        const comment = result.comments[0];

        expect(comment).toHaveProperty('user_name');
        expect(comment).toHaveProperty('user_id');
        expect(comment).toHaveProperty('content');
        expect(comment).toHaveProperty('like_count');
        expect(comment).toHaveProperty('created_at');
      }
    );

    (skipTests ? it.skip : it)(
      'should include like status for authenticated user',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const result = await commentService.getCommentsByConceptId(
          testConceptId,
          1,
          20,
          testUserId
        );

        expect(result.comments.length).toBeGreaterThan(0);
        const comment = result.comments[0];

        expect(comment).toHaveProperty('is_liked_by_user');
        expect(typeof comment.is_liked_by_user).toBe('boolean');
      }
    );

    (skipTests ? it.skip : it)(
      'should respect pagination parameters',
      async () => {
        // Test first page with smaller page size
        const page1 = await commentService.getCommentsByConceptId(
          testConceptId,
          1,
          2
        );

        expect(page1.comments.length).toBeLessThanOrEqual(2);

        // Test second page
        const page2 = await commentService.getCommentsByConceptId(
          testConceptId,
          2,
          2
        );

        expect(page2.comments.length).toBeLessThanOrEqual(2);

        // Ensure pages have different comments (if enough comments exist)
        if (page1.comments.length > 0 && page2.comments.length > 0) {
          expect(page1.comments[0].id).not.toBe(page2.comments[0].id);
        }
      }
    );

    (skipTests ? it.skip : it)(
      'should return empty array for non-existent concept',
      async () => {
        const fakeConceptId = '99999999-9999-9999-9999-999999999999';
        const result = await commentService.getCommentsByConceptId(
          fakeConceptId,
          1,
          20
        );

        expect(result.comments).toEqual([]);
        expect(result.totalCount).toBe(0);
      }
    );
  });

  describe('CommentService - Like/Unlike Comments', () => {
    let testCommentId: string;

    beforeEach(async () => {
      if (skipTests || !testUserId) return;

      // Create a test comment for liking
      const comment = await commentService.createComment(
        testConceptId,
        testUserId,
        'Comment for like testing'
      );
      testCommentId = comment.id;
      createdCommentIds.push(comment.id);
    });

    (skipTests ? it.skip : it)(
      'should like a comment successfully',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const likeCount = await commentService.likeComment(
          testCommentId,
          testUserId
        );

        expect(typeof likeCount).toBe('number');
        expect(likeCount).toBeGreaterThan(0);
      },
      10000
    );

    (skipTests ? it.skip : it)(
      'should handle duplicate likes gracefully',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        // Like the comment twice
        const firstLike = await commentService.likeComment(
          testCommentId,
          testUserId
        );
        const secondLike = await commentService.likeComment(
          testCommentId,
          testUserId
        );

        // Like count should remain the same
        expect(firstLike).toBe(secondLike);
      }
    );

    (skipTests ? it.skip : it)(
      'should unlike a comment successfully',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        // First like the comment
        await commentService.likeComment(testCommentId, testUserId);

        // Then unlike it
        const likeCount = await commentService.unlikeComment(
          testCommentId,
          testUserId
        );

        expect(typeof likeCount).toBe('number');
        expect(likeCount).toBe(0);
      }
    );

    (skipTests ? it.skip : it)(
      'should handle unliking non-liked comment gracefully',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        // Unlike a comment that was never liked
        const likeCount = await commentService.unlikeComment(
          testCommentId,
          testUserId
        );

        expect(typeof likeCount).toBe('number');
        expect(likeCount).toBe(0);
      }
    );

    (skipTests ? it.skip : it)(
      'should throw error when liking non-existent comment',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const fakeCommentId = '99999999-9999-9999-9999-999999999999';

        await expect(
          commentService.likeComment(fakeCommentId, testUserId)
        ).rejects.toMatchObject({
          code: 'NOT_FOUND',
          statusCode: 404,
        });
      }
    );

    (skipTests ? it.skip : it)(
      'should throw error when unliking non-existent comment',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const fakeCommentId = '99999999-9999-9999-9999-999999999999';

        await expect(
          commentService.unlikeComment(fakeCommentId, testUserId)
        ).rejects.toMatchObject({
          code: 'NOT_FOUND',
          statusCode: 404,
        });
      }
    );
  });

  describe('CommentService - Get Comment with Like Status', () => {
    let testCommentId: string;

    beforeEach(async () => {
      if (skipTests || !testUserId) return;

      const comment = await commentService.createComment(
        testConceptId,
        testUserId,
        'Comment for like status testing'
      );
      testCommentId = comment.id;
      createdCommentIds.push(comment.id);
    });

    (skipTests ? it.skip : it)(
      'should return comment with like information',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const comment = await commentService.getCommentWithLikeStatus(
          testCommentId,
          testUserId
        );

        expect(comment).not.toBeNull();
        expect(comment).toHaveProperty('id', testCommentId);
        expect(comment).toHaveProperty('user_name');
        expect(comment).toHaveProperty('like_count');
        expect(comment).toHaveProperty('is_liked_by_user');
        expect(typeof comment?.is_liked_by_user).toBe('boolean');
      },
      10000
    );

    (skipTests ? it.skip : it)(
      'should return null for non-existent comment',
      async () => {
        const fakeCommentId = '99999999-9999-9999-9999-999999999999';
        const comment =
          await commentService.getCommentWithLikeStatus(fakeCommentId);

        expect(comment).toBeNull();
      }
    );

    (skipTests ? it.skip : it)(
      'should work without authenticated user',
      async () => {
        const comment =
          await commentService.getCommentWithLikeStatus(testCommentId);

        expect(comment).not.toBeNull();
        expect(comment).toHaveProperty('is_liked_by_user', false);
      }
    );

    (skipTests ? it.skip : it)(
      'should reflect like status correctly',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        // Check status before liking
        const beforeLike = await commentService.getCommentWithLikeStatus(
          testCommentId,
          testUserId
        );
        expect(beforeLike?.is_liked_by_user).toBe(false);

        // Like the comment
        await commentService.likeComment(testCommentId, testUserId);

        // Check status after liking
        const afterLike = await commentService.getCommentWithLikeStatus(
          testCommentId,
          testUserId
        );
        expect(afterLike?.is_liked_by_user).toBe(true);
        expect(afterLike?.like_count).toBeGreaterThan(0);
      }
    );
  });

  describe('Performance Tests', () => {
    (skipTests ? it.skip : it)(
      'should create comment within reasonable time',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const startTime = Date.now();
        const comment = await commentService.createComment(
          testConceptId,
          testUserId,
          'Performance test comment'
        );
        const endTime = Date.now();
        const duration = endTime - startTime;

        createdCommentIds.push(comment.id);

        expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      },
      10000
    );

    (skipTests ? it.skip : it)(
      'should fetch comments within reasonable time',
      async () => {
        const startTime = Date.now();
        await commentService.getCommentsByConceptId(testConceptId, 1, 20);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      }
    );

    (skipTests ? it.skip : it)(
      'should like/unlike within reasonable time',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const comment = await commentService.createComment(
          testConceptId,
          testUserId,
          'Performance test for likes'
        );
        createdCommentIds.push(comment.id);

        const startTime = Date.now();
        await commentService.likeComment(comment.id, testUserId);
        await commentService.unlikeComment(comment.id, testUserId);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      }
    );
  });

  describe('Error Handling', () => {
    (skipTests ? it.skip : it)(
      'should handle invalid UUID format gracefully',
      async () => {
        await expect(
          commentService.getCommentsByConceptId('invalid-uuid', 1, 20)
        ).rejects.toThrow();
      }
    );

    (skipTests ? it.skip : it)(
      'should handle database constraints properly',
      async () => {
        if (!testUserId) throw new Error('Test user not created');

        const fakeConceptId = '99999999-9999-9999-9999-999999999999';

        // Attempting to create comment with non-existent concept should fail
        await expect(
          commentService.createComment(fakeConceptId, testUserId, 'Test')
        ).rejects.toMatchObject({
          code: 'FOREIGN_KEY_VIOLATION',
          statusCode: 400,
        });
      }
    );
  });
});
