import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { BookmarksService } from '@/lib/db/services/BookmarksService';
import { ServiceError } from '@/lib/db/services/BaseService';

/**
 * DELETE /api/bookmarks/[id]
 * Remove a bookmark
 *
 * Response:
 * {
 *   success: boolean;
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    // Await params in Next.js 15
    const { id } = await params;
    const bookmarkId = id;

    // Validate bookmark ID
    if (!bookmarkId) {
      return NextResponse.json(
        { success: false, error: 'Invalid bookmark ID' },
        { status: 400 }
      );
    }

    // Delete bookmark using BookmarksService (includes ownership verification)
    const bookmarksService = new BookmarksService();
    await bookmarksService.removeBookmark(bookmarkId, userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Bookmark deletion error:', error);

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
