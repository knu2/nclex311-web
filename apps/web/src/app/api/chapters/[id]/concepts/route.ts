/**
 * API Route: GET /api/chapters/{id}/concepts
 * Returns chapter with its concepts including completion status
 * Story: 1.5.1 - Sidebar Navigation Component
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/db/services';
// import { auth } from '@/lib/auth'; // TODO: Use for completion tracking in Story 2.4

const contentService = new ContentService();

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
    // const session = await auth();
    // const user = session?.user ?? null;
    // TODO: Use user session for completion tracking in Story 2.4

    // Fetch chapter with concepts from ContentService
    // For now, we'll use the getAllChaptersWithConcepts and filter
    // TODO: In future, add getChapterById method to ContentService
    const allChapters = await contentService.getAllChaptersWithConcepts();
    const chapter = allChapters.find(ch => ch.id === chapterId);

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chapter not found',
        },
        { status: 404 }
      );
    }

    // Transform concepts to match frontend interface
    // Note: isCompleted will be false for now until we implement completion tracking
    const concepts = chapter.concepts.map(concept => ({
      id: concept.id,
      title: concept.title,
      slug: concept.slug,
      conceptNumber: concept.conceptNumber,
      isCompleted: false, // TODO: Implement completion tracking in Story 2.4
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
