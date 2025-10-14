import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { BookmarksService } from '@/lib/db/services/BookmarksService';
import { ServiceError } from '@/lib/db/services/BaseService';

/**
 * Bookmark response interface
 */
interface BookmarkResponse {
  id: string;
  user_id: string;
  concept_id: string;
  concept_title: string;
  concept_slug: string;
  chapter_number: number;
  chapter_title: string;
  note_preview: string;
  bookmarked_at: string;
}

/**
 * GET /api/users/[id]/bookmarks
 * Fetch all bookmarks for a user with concept, chapter, and note data
 *
 * Response:
 * {
 *   bookmarks: BookmarkResponse[]
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Await params in Next.js 15
    const { id } = await params;
    const requestedUserId = id;
    const currentUserId = session.user.id;

    // Verify user can only access their own bookmarks
    if (requestedUserId !== currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized to access these bookmarks' },
        { status: 403 }
      );
    }

    // Fetch bookmarks with joined data using BookmarksService
    const bookmarksService = new BookmarksService();
    const bookmarksData =
      await bookmarksService.getUserBookmarks(currentUserId);

    // Transform the data into the expected response format
    const formattedBookmarks: BookmarkResponse[] = bookmarksData.map(
      bookmark => ({
        id: bookmark.id,
        user_id: bookmark.user_id,
        concept_id: bookmark.concept_id,
        concept_title: bookmark.concept_title,
        concept_slug: bookmark.concept_slug,
        chapter_number: bookmark.chapter_number,
        chapter_title: bookmark.chapter_title,
        note_preview: bookmark.note_preview
          ? bookmark.note_preview.substring(0, 100)
          : '',
        bookmarked_at: bookmark.bookmarked_at.toISOString(),
      })
    );

    return NextResponse.json({
      bookmarks: formattedBookmarks,
    });
  } catch (error) {
    console.error('Bookmarks fetch error:', error);

    // Handle ServiceError with appropriate status codes
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
