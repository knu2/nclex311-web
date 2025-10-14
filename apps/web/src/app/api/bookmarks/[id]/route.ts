import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';
import { getCurrentSession } from '@/lib/auth-utils';

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

    // Verify bookmark exists and belongs to user
    const { data: bookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id, user_id')
      .eq('id', bookmarkId)
      .maybeSingle();

    if (fetchError || !bookmark) {
      return NextResponse.json(
        { success: false, error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (bookmark.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this bookmark' },
        { status: 403 }
      );
    }

    // Delete bookmark
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (deleteError) {
      console.error('Error deleting bookmark:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete bookmark' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
