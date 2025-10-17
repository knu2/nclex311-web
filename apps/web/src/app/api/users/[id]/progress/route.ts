import { NextRequest, NextResponse } from 'next/server';
import { ProgressService, BookmarksService } from '@/lib/db/services';
import { getConnection } from '@/lib/db/connection';
import { concepts, chapters } from '@/lib/db/schema';
import { eq, count, lte, gte } from 'drizzle-orm';

/**
 * GET /api/users/[id]/progress
 * Fetches user progress statistics including completed concepts and bookmarks
 * Story 1.5.13: UX Enhancement - Sidebar & Bookmark Polish
 *
 * Reuses existing ProgressService and BookmarksService from Story 1.5.8 and 1.5.9
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const progressService = new ProgressService();
    const bookmarksService = new BookmarksService();
    const db = getConnection();

    // Fetch overall user progress (includes completed concepts count)
    const progressData = await progressService.getUserProgress(userId);

    // Fetch bookmarks count for user
    const userBookmarks = await bookmarksService.getUserBookmarks(userId);

    // Fetch free concepts total (chapters 1-4)
    const freeConceptsResult = await db
      .select({ count: count() })
      .from(concepts)
      .innerJoin(chapters, eq(concepts.chapterId, chapters.id))
      .where(lte(chapters.chapterNumber, 4));

    const freeConceptsTotal = freeConceptsResult[0]?.count || 0;

    // Fetch premium concepts total (chapters 5-8)
    const premiumConceptsResult = await db
      .select({ count: count() })
      .from(concepts)
      .innerJoin(chapters, eq(concepts.chapterId, chapters.id))
      .where(gte(chapters.chapterNumber, 5));

    const premiumConceptsTotal = premiumConceptsResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        completedConceptsCount:
          progressData.overall_progress.completed_concepts,
        bookmarksCount: userBookmarks.length,
        freeConceptsTotal,
        premiumConceptsTotal,
      },
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user progress',
      },
      { status: 500 }
    );
  }
}
