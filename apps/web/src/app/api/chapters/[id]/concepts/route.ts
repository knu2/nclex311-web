/**
 * API Route: GET /api/chapters/{id}/concepts
 * Returns chapter with its concepts including completion status
 * Story: 1.5.1 - Sidebar Navigation Component
 * Updated: Story 1.5.8 - Progress Dashboard (added completion tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentService, ProgressService } from '@/lib/db/services';
import { getCurrentSession } from '@/lib/auth-utils';

const contentService = new ContentService();
const progressService = new ProgressService();

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chapters/{id}/concepts
 * Returns chapter details with concept list, completion indicators, and premium status
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Get chapter ID from params
    const { id: chapterId } = await context.params;

    if (!chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chapter ID is required',
        },
        { status: 400 }
      );
    }

    // Get current user session (if any)
    const session = await getCurrentSession();
    const userId = session?.user ? (session.user as { id?: string }).id : null;

    // Fetch chapter with concepts from ContentService (optimized single query)
    const chapter = await contentService.getChapterWithConcepts(chapterId);

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chapter not found',
        },
        { status: 404 }
      );
    }

    // Fetch completion status for the user (if logged in)
    // Only fetch completion for concepts in this chapter (optimized)
    let completedConceptIds = new Set<string>();
    if (userId && chapter.concepts.length > 0) {
      try {
        const conceptIds = chapter.concepts.map(c => c.id);
        completedConceptIds = await progressService.getCompletedConceptIds(
          userId,
          conceptIds
        );
      } catch (error) {
        console.error('Error fetching progress:', error);
        // Continue without completion data
      }
    }

    // Transform concepts to match frontend interface with completion status
    const concepts = chapter.concepts.map(concept => ({
      id: concept.id,
      title: concept.title,
      slug: concept.slug,
      conceptNumber: concept.conceptNumber,
      isCompleted: completedConceptIds.has(concept.id),
      isPremium: concept.isPremium,
    }));

    // Return chapter with concepts
    return NextResponse.json({
      success: true,
      data: {
        id: chapter.id,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        concepts,
      },
    });
  } catch (error) {
    console.error('Failed to fetch chapter concepts:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chapter concepts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
