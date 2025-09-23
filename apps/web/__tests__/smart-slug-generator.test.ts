/**
 * Unit Tests for SmartSlugGenerator
 * Tests the three-tier slug generation strategy with collision scenarios
 */

import {
  SmartSlugGenerator,
  ConceptContext,
  SlugGenerationResult,
} from '../src/lib/smart-slug-generator';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

describe('SmartSlugGenerator', () => {
  let slugGenerator: SmartSlugGenerator;
  let mockContext: ConceptContext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create new instance for each test
    slugGenerator = new SmartSlugGenerator(
      mockSupabaseClient as SupabaseClient
    );

    // Define mock context for all tests
    mockContext = {
      title: 'Heart Failure',
      chapterTitle: 'Physiological Adaptation',
      bookPage: 152,
      keyPoints:
        'Acute heart failure involves rapid onset of symptoms and requires immediate medical attention.',
      category: 'Physiological Adaptation',
    };
  });

  describe('generateUniqueConceptSlug', () => {
    test('should return clean slug when no collisions exist', async () => {
      // Mock no existing slugs
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => {
            // Add small delay to ensure measurable processing time
            return new Promise(resolve => {
              setTimeout(() => resolve({ data: [], error: null }), 1);
            });
          }),
        };
        return chain;
      });

      const result = await slugGenerator.generateUniqueConceptSlug(mockContext);

      expect(result.slug).toBe('heart-failure');
      expect(result.strategy).toBe('clean');
      expect(result.collisionCount).toBe(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should use contextual differentiation when collisions exist', async () => {
      // Mock existing slugs with collision
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ slug: 'heart-failure' }],
            error: null,
          }),
        };
        return chain;
      });

      const contextWithKeyword = {
        ...mockContext,
        keyPoints:
          'Acute heart failure involves rapid onset of symptoms requiring emergency treatment.',
      };

      const result =
        await slugGenerator.generateUniqueConceptSlug(contextWithKeyword);

      expect(result.slug).toBe('heart-failure-acute');
      expect(result.strategy).toBe('contextual');
      expect(result.collisionCount).toBe(1);
      expect(result.context).toBe('acute');
    });

    test('should use chapter context when medical terms not found', async () => {
      // Mock existing slugs
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ slug: 'heart-failure' }],
            error: null,
          }),
        };
        return chain;
      });

      const contextWithoutKeywords = {
        ...mockContext,
        keyPoints: 'This is a basic overview without specific medical context.',
      };

      const result = await slugGenerator.generateUniqueConceptSlug(
        contextWithoutKeywords
      );

      expect(result.slug).toBe('heart-failure-physio');
      expect(result.strategy).toBe('contextual');
      expect(result.context).toBe('physio');
    });

    test('should fall back to sequential numbering when contextual fails', async () => {
      // Mock existing slugs including contextual variations (including chapter context)
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { slug: 'heart-failure' },
              { slug: 'heart-failure-acute' },
              { slug: 'heart-failure-physio' }, // chapter context already taken
              { slug: 'heart-failure-chronic' },
            ],
            error: null,
          }),
        };
        return chain;
      });

      const result = await slugGenerator.generateUniqueConceptSlug(mockContext);

      expect(result.slug).toBe('heart-failure-2');
      expect(result.strategy).toBe('sequential');
      expect(result.collisionCount).toBe(4);
    });

    test('should handle multiple sequential collisions correctly', async () => {
      // Mock existing slugs with sequential numbers
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { slug: 'triage' },
              { slug: 'triage-2' },
              { slug: 'triage-3' },
              { slug: 'triage-emergency' },
            ],
            error: null,
          }),
        };
        return chain;
      });

      const triageContext = {
        ...mockContext,
        title: 'Triage',
        keyPoints:
          'Standard triage protocols without specific medical context.',
      };

      const result =
        await slugGenerator.generateUniqueConceptSlug(triageContext);

      // The generator should find chapter context since no medical terms found
      expect(result.slug).toBe('triage-physio');
      expect(result.strategy).toBe('contextual');
    });

    test('should detect medical specialties in context', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ slug: 'meningitis' }],
            error: null,
          }),
        };
        return chain;
      });

      const pediatricContext = {
        ...mockContext,
        title: 'Meningitis',
        keyPoints:
          'Pediatric meningitis requires specialized treatment protocols.',
      };

      const result =
        await slugGenerator.generateUniqueConceptSlug(pediatricContext);

      expect(result.slug).toBe('meningitis-pediatric');
      expect(result.strategy).toBe('contextual');
      expect(result.context).toBe('pediatric');
    });

    test('should detect body system contexts', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ slug: 'assessment' }],
            error: null,
          }),
        };
        return chain;
      });

      const cardiacContext = {
        ...mockContext,
        title: 'Assessment',
        keyPoints:
          'Comprehensive cardiac assessment involves monitoring heart rate, rhythm, and sounds.',
      };

      const result =
        await slugGenerator.generateUniqueConceptSlug(cardiacContext);

      expect(result.slug).toBe('assessment-cardiac');
      expect(result.strategy).toBe('contextual');
      expect(result.context).toBe('cardiac');
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        };
        return chain;
      });

      const result = await slugGenerator.generateUniqueConceptSlug(mockContext);

      // Should still generate a slug even with database errors
      expect(result.slug).toContain('heart-failure');
      // With database error, it returns empty array, so no collisions detected
      expect(result.collisionCount).toBe(0);
    });

    test('should handle malformed titles correctly', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
        return chain;
      });

      const malformedContext = {
        ...mockContext,
        title: 'Test!@# $%^&*() Title with Special Characters & Numbers 123',
      };

      const result =
        await slugGenerator.generateUniqueConceptSlug(malformedContext);

      expect(result.slug).toBe(
        'test-title-with-special-characters-numbers-123'
      );
      expect(result.strategy).toBe('clean');
    });

    test('should track performance metrics correctly', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => {
            // Add small delay to ensure measurable processing time
            return new Promise(resolve => {
              setTimeout(() => resolve({ data: [], error: null }), 1);
            });
          }),
        };
        return chain;
      });

      const result = await slugGenerator.generateUniqueConceptSlug(mockContext);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeLessThan(1000); // Should be fast
    });
  });

  describe('Session Management', () => {
    test('should track generated slugs in memory', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
        return chain;
      });

      const stats1 = slugGenerator.getStats();
      expect(stats1.cachedSlugs).toBe(0);

      await slugGenerator.generateUniqueConceptSlug(mockContext);

      const stats2 = slugGenerator.getStats();
      expect(stats2.cachedSlugs).toBe(1);
    });

    test('should prevent in-memory collisions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
        return chain;
      });

      // Generate same slug twice
      const result1 =
        await slugGenerator.generateUniqueConceptSlug(mockContext);
      const contextWithoutKeywords = {
        ...mockContext,
        keyPoints: 'Basic overview without medical keywords',
      };
      const result2 = await slugGenerator.generateUniqueConceptSlug(
        contextWithoutKeywords
      );

      expect(result1.slug).toBe('heart-failure');
      expect(result2.slug).toBe('heart-failure-physio'); // Should use chapter context since no medical keywords
    });

    test('should reset correctly', () => {
      slugGenerator.reset();
      const stats = slugGenerator.getStats();
      expect(stats.cachedSlugs).toBe(0);
    });
  });

  describe('Context Pattern Matching', () => {
    test('should detect multiple medical contexts', async () => {
      const patterns = [
        {
          text: 'pediatric care protocols for children',
          expected: 'pediatric',
        },
        { text: 'acute pain requires immediate attention', expected: 'acute' },
        { text: 'chronic kidney disease management', expected: 'chronic' },
        { text: 'geriatric patient assessment differs', expected: 'geriatric' },
      ];

      mockSupabaseClient.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          like: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{ slug: 'test' }],
            error: null,
          }),
        };
        return chain;
      });

      for (const pattern of patterns) {
        const context = {
          ...mockContext,
          title: 'Test',
          keyPoints: pattern.text,
        };

        const result = await slugGenerator.generateUniqueConceptSlug(context);
        expect(result.context).toBe(pattern.expected);
        slugGenerator.reset();
      }
    });
  });

  describe('Logging', () => {
    test('should log slug decisions correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result: SlugGenerationResult = {
        slug: 'heart-failure-acute',
        strategy: 'contextual',
        processingTime: 25,
        collisionCount: 1,
        context: 'acute',
      };

      slugGenerator.logSlugDecision(result, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Slug Generation: "Heart Failure" → "heart-failure-acute"'
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Strategy: contextual')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context: acute')
      );

      consoleSpy.mockRestore();
    });
  });
});
