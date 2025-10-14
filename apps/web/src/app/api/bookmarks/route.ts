import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { BookmarksService } from '@/lib/db/services/BookmarksService';
import { ServiceError } from '@/lib/db/services/BaseService';

/**
 * POST /api/bookmarks
 * Create a new bookmark for a concept
 *
 * Request Body:
 * {
 *   concept_id: string (UUID)
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   bookmark: {
 *     id: string;
 *     concept_id: string;
 *     bookmarked_at: string;
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { concept_id } = body;

    // Validate concept_id
    if (!concept_id || typeof concept_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid concept_id' },
        { status: 400 }
      );
    }

    // Create bookmark using BookmarksService (handles duplicates gracefully)
    const bookmarksService = new BookmarksService();
    const bookmark = await bookmarksService.createBookmark(userId, concept_id);

    return NextResponse.json({
      success: true,
      bookmark: {
        id: bookmark.id,
        concept_id: bookmark.conceptId,
        bookmarked_at: bookmark.bookmarkedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Bookmark creation error:', error);

    // Handle ServiceError with appropriate status codes
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
