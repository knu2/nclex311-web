/**
 * Unit tests for CommentService
 * Tests comment-related database operations with proper mocking
 * Story 1.5.6.1 - Task 6
 */

import { CommentService, ServiceError } from '@/lib/db/services';
import { Comment, CommentWithLikes } from '@/lib/db/schema';

// Mock the connection module
jest.mock('@/lib/db/connection', () => ({
  getConnection: jest.fn(() => mockDb),
  sql: jest.fn(),
}));

// Mock database instance
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
};

describe('CommentService', () => {
  let commentService: CommentService;

  const mockComment: Comment = {
    id: 'comment-123',
    userId: 'user-123',
    conceptId: 'concept-123',
    content: 'This is a test comment',
    createdAt: new Date('2025-10-11T00:00:00Z'),
    updatedAt: new Date('2025-10-11T00:00:00Z'),
  };

  const mockCommentWithLikes: CommentWithLikes = {
    ...mockComment,
    user_name: 'test@example.com',
    like_count: 5,
    is_liked_by_user: false,
  };

  beforeEach(() => {
    commentService = new CommentService();
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create comment with valid input', async () => {
      const content = 'This is a valid comment';
      const conceptId = 'concept-123';
      const userId = 'user-123';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockComment]),
        }),
      });

      const result = await commentService.createComment(
        conceptId,
        userId,
        content
      );

      expect(result).toEqual(mockComment);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should reject empty content', async () => {
      await expect(
        commentService.createComment('concept-1', 'user-1', '')
      ).rejects.toThrow('Comment content cannot be empty');

      await expect(
        commentService.createComment('concept-1', 'user-1', '')
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        statusCode: 400,
      });
    });

    it('should reject whitespace-only content', async () => {
      await expect(
        commentService.createComment('concept-1', 'user-1', '   ')
      ).rejects.toThrow('Comment content cannot be empty');
    });

    it('should reject content over 2000 characters', async () => {
      const longContent = 'a'.repeat(2001);

      await expect(
        commentService.createComment('concept-1', 'user-1', longContent)
      ).rejects.toThrow('exceeds 2000 character limit');

      await expect(
        commentService.createComment('concept-1', 'user-1', longContent)
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        statusCode: 400,
      });
    });

    it('should trim content before saving', async () => {
      const content = '  Test comment with spaces  ';
      const expectedTrimmed = 'Test comment with spaces';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockImplementation(data => {
          expect(data.content).toBe(expectedTrimmed);
          return {
            returning: jest.fn().mockResolvedValue([mockComment]),
          };
        }),
      });

      await commentService.createComment('concept-1', 'user-1', content);
    });

    it('should handle database errors properly', async () => {
      const dbError = new Error('Foreign key violation');
      (dbError as any).code = '23503';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(dbError),
        }),
      });

      await expect(
        commentService.createComment('concept-1', 'user-1', 'Valid content')
      ).rejects.toThrow(ServiceError);

      await expect(
        commentService.createComment('concept-1', 'user-1', 'Valid content')
      ).rejects.toMatchObject({
        code: 'FOREIGN_KEY_VIOLATION',
        statusCode: 400,
      });
    });
  });

  describe('getCommentsByConceptId', () => {
    it('should return paginated comments', async () => {
      const mockComments = [mockCommentWithLikes];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue(mockComments),
        }),
      });

      // Mock count query
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockResolvedValue(mockComments),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 10 }]),
          }),
        });

      const result = await commentService.getCommentsByConceptId(
        'concept-123',
        1,
        20
      );

      expect(result.comments).toEqual(mockComments);
      expect(result.totalCount).toBe(10);
    });

    it('should handle pagination correctly', async () => {
      const page = 2;
      const pageSize = 20;
      const expectedOffset = (page - 1) * pageSize;

      let capturedOffset: number | undefined;
      let capturedLimit: number | undefined;

      // Mock for comments query with pagination capture
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockImplementation(limit => {
            capturedLimit = limit;
            return {
              offset: jest.fn().mockImplementation(offset => {
                capturedOffset = offset;
                return Promise.resolve([]);
              }),
            };
          }),
        }),
      });

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      await commentService.getCommentsByConceptId(
        'concept-123',
        page,
        pageSize
      );

      expect(capturedLimit).toBe(pageSize);
      expect(capturedOffset).toBe(expectedOffset);
    });

    it('should include like status for authenticated user', async () => {
      const userId = 'user-123';
      const commentWithLike = {
        ...mockCommentWithLikes,
        is_liked_by_user: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue([commentWithLike]),
        }),
      });

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockResolvedValue([commentWithLike]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 1 }]),
          }),
        });

      const result = await commentService.getCommentsByConceptId(
        'concept-123',
        1,
        20,
        userId
      );

      expect(result.comments[0].is_liked_by_user).toBe(true);
    });

    it('should return empty array when no comments exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockResolvedValue([]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        });

      const result = await commentService.getCommentsByConceptId('concept-123');

      expect(result.comments).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('likeComment', () => {
    it('should increment like count', async () => {
      // Mock findById to return comment
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockComment]),
          }),
        }),
      });

      // Mock insert for like
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
        }),
      });

      // Mock count query
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockComment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 6 }]),
          }),
        });

      const result = await commentService.likeComment(
        'comment-123',
        'user-456'
      );

      expect(result).toBe(6);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle duplicate likes gracefully', async () => {
      // Mock findById
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockComment]),
          }),
        }),
      });

      // Mock insert with onConflictDoNothing
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
        }),
      });

      // Mock count (like already exists, count stays same)
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockComment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 5 }]),
          }),
        });

      const result = await commentService.likeComment(
        'comment-123',
        'user-123'
      );

      expect(result).toBe(5);
    });

    it('should throw error when comment not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        commentService.likeComment('nonexistent', 'user-123')
      ).rejects.toThrow('Comment not found');

      await expect(
        commentService.likeComment('nonexistent', 'user-123')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('unlikeComment', () => {
    it('should decrement like count', async () => {
      // Mock findById
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockComment]),
          }),
        }),
      });

      // Mock delete
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      // Mock count query
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockComment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 4 }]),
          }),
        });

      const result = await commentService.unlikeComment(
        'comment-123',
        'user-123'
      );

      expect(result).toBe(4);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw error when comment not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        commentService.unlikeComment('nonexistent', 'user-123')
      ).rejects.toThrow('Comment not found');

      await expect(
        commentService.unlikeComment('nonexistent', 'user-123')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should handle unliking non-liked comment gracefully', async () => {
      // Mock findById
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockComment]),
          }),
        }),
      });

      // Mock delete (no rows affected)
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      // Mock count (count unchanged)
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockComment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 5 }]),
          }),
        });

      const result = await commentService.unlikeComment(
        'comment-123',
        'user-456'
      );

      expect(result).toBe(5);
    });
  });

  describe('getCommentWithLikeStatus', () => {
    it('should return comment with like information', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([mockCommentWithLikes]),
        }),
      });

      const result = await commentService.getCommentWithLikeStatus(
        'comment-123',
        'user-123'
      );

      expect(result).toEqual(mockCommentWithLikes);
    });

    it('should return null when comment not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const result =
        await commentService.getCommentWithLikeStatus('nonexistent');

      expect(result).toBeNull();
    });

    it('should work without authenticated user', async () => {
      const commentWithoutAuth = {
        ...mockCommentWithLikes,
        is_liked_by_user: false,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([commentWithoutAuth]),
        }),
      });

      const result =
        await commentService.getCommentWithLikeStatus('comment-123');

      expect(result?.is_liked_by_user).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockRejectedValue(new Error('Connection failed')),
        }),
      });

      await expect(
        commentService.createComment('concept-1', 'user-1', 'Valid content')
      ).rejects.toThrow(ServiceError);
    });

    it('should preserve ServiceError when thrown', async () => {
      // Test that ServiceErrors are not wrapped
      await expect(
        commentService.createComment('concept-1', 'user-1', '')
      ).rejects.toBeInstanceOf(ServiceError);

      const error = await commentService
        .createComment('concept-1', 'user-1', '')
        .catch(e => e);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.statusCode).toBe(400);
    });
  });
});
