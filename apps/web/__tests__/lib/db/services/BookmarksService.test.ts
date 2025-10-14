/**
 * Unit tests for BookmarksService
 * Tests bookmark-related database operations with proper mocking
 * Story 1.5.9.1 - Task 8
 */

import { BookmarksService, ServiceError } from '@/lib/db/services';
import { Bookmark } from '@/lib/db/schema';

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

describe('BookmarksService', () => {
  let bookmarksService: BookmarksService;

  const mockBookmark: Bookmark = {
    id: 'bookmark-123',
    userId: 'user-123',
    conceptId: 'concept-123',
    bookmarkedAt: new Date('2025-10-14T00:00:00Z'),
  };

  const mockBookmarkWithDetails = {
    id: 'bookmark-123',
    user_id: 'user-123',
    concept_id: 'concept-123',
    concept_title: 'Test Concept',
    concept_slug: 'test-concept',
    chapter_number: 1,
    chapter_title: 'Test Chapter',
    note_preview: 'Test note content',
    bookmarked_at: new Date('2025-10-14T00:00:00Z'),
  };

  beforeEach(() => {
    bookmarksService = new BookmarksService();
    jest.clearAllMocks();
  });

  describe('createBookmark', () => {
    it('should create a new bookmark successfully', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockBookmark]),
          }),
        }),
      });

      const result = await bookmarksService.createBookmark(
        'user-123',
        'concept-123'
      );

      expect(result).toEqual(mockBookmark);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle duplicate bookmark gracefully', async () => {
      // First call returns nothing (conflict)
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Second call to fetch existing
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBookmark]),
          }),
        }),
      });

      const result = await bookmarksService.createBookmark(
        'user-123',
        'concept-123'
      );

      expect(result).toEqual(mockBookmark);
    });

    it('should throw error if duplicate bookmark cannot be retrieved', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        bookmarksService.createBookmark('user-123', 'concept-123')
      ).rejects.toThrow('Failed to create or retrieve bookmark');
    });

    it('should handle database foreign key errors', async () => {
      const dbError = new Error('Foreign key violation');
      (dbError as any).code = '23503';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(dbError),
          }),
        }),
      });

      await expect(
        bookmarksService.createBookmark('user-123', 'invalid-concept')
      ).rejects.toThrow(ServiceError);

      await expect(
        bookmarksService.createBookmark('user-123', 'invalid-concept')
      ).rejects.toMatchObject({
        code: 'FOREIGN_KEY_VIOLATION',
        statusCode: 400,
      });
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockBookmark]),
        }),
      });

      await expect(
        bookmarksService.removeBookmark('bookmark-123', 'user-123')
      ).resolves.not.toThrow();

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw error for unauthorized removal', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        bookmarksService.removeBookmark('bookmark-123', 'wrong-user')
      ).rejects.toThrow('Bookmark not found or unauthorized');

      await expect(
        bookmarksService.removeBookmark('bookmark-123', 'wrong-user')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should throw error for non-existent bookmark', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        bookmarksService.removeBookmark('non-existent-id', 'user-123')
      ).rejects.toThrow('Bookmark not found or unauthorized');
    });
  });

  describe('getUserBookmarks', () => {
    it('should return bookmarks with joined data', async () => {
      const mockBookmarks = [mockBookmarkWithDetails];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockBookmarks),
          }),
        }),
      });

      const result = await bookmarksService.getUserBookmarks('user-123');

      expect(result).toEqual(mockBookmarks);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array for user with no bookmarks', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await bookmarksService.getUserBookmarks('new-user');

      expect(result).toEqual([]);
    });

    it('should include note preview in results', async () => {
      const bookmarkWithNote = {
        ...mockBookmarkWithDetails,
        note_preview: 'This is a longer note content for testing',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([bookmarkWithNote]),
          }),
        }),
      });

      const result = await bookmarksService.getUserBookmarks('user-123');

      expect(result[0]).toHaveProperty('note_preview');
      expect(result[0].note_preview).toBe(
        'This is a longer note content for testing'
      );
    });

    it('should sort bookmarks by bookmarked_at DESC', async () => {
      const bookmark1 = {
        ...mockBookmarkWithDetails,
        id: 'bookmark-1',
        bookmarked_at: new Date('2025-10-14T00:00:00Z'),
      };
      const bookmark2 = {
        ...mockBookmarkWithDetails,
        id: 'bookmark-2',
        bookmarked_at: new Date('2025-10-15T00:00:00Z'),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([bookmark2, bookmark1]),
          }),
        }),
      });

      const result = await bookmarksService.getUserBookmarks('user-123');

      expect(result[0].id).toBe('bookmark-2'); // Newer bookmark first
      expect(result[1].id).toBe('bookmark-1');
    });
  });

  describe('getBookmarkByUserAndConcept', () => {
    it('should return bookmark when it exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBookmark]),
          }),
        }),
      });

      const result = await bookmarksService.getBookmarkByUserAndConcept(
        'user-123',
        'concept-123'
      );

      expect(result).toEqual(mockBookmark);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when bookmark does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await bookmarksService.getBookmarkByUserAndConcept(
        'user-123',
        'concept-123'
      );

      expect(result).toBeNull();
    });

    it('should use correct user and concept filters', async () => {
      let capturedWhereCondition: any;

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(condition => {
            capturedWhereCondition = condition;
            return {
              limit: jest.fn().mockResolvedValue([mockBookmark]),
            };
          }),
        }),
      });

      await bookmarksService.getBookmarkByUserAndConcept(
        'user-123',
        'concept-123'
      );

      expect(capturedWhereCondition).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle generic database errors', async () => {
      const dbError = new Error('Connection timeout');

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(dbError),
          }),
        }),
      });

      await expect(
        bookmarksService.createBookmark('user-123', 'concept-123')
      ).rejects.toThrow(ServiceError);

      await expect(
        bookmarksService.createBookmark('user-123', 'concept-123')
      ).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
        statusCode: 500,
      });
    });

    it('should preserve ServiceError properties', async () => {
      const customError = new ServiceError(
        'Custom error message',
        'CUSTOM_CODE',
        422,
        { detail: 'extra info' }
      );

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(customError),
          }),
        }),
      });

      try {
        await bookmarksService.createBookmark('user-123', 'concept-123');
        fail('Should have thrown ServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('CUSTOM_CODE');
        expect((error as ServiceError).statusCode).toBe(422);
        expect((error as ServiceError).details).toEqual({
          detail: 'extra info',
        });
      }
    });
  });
});
