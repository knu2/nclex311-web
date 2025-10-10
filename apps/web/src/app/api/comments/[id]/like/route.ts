import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentSession } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/comments/[id]/like
 * Like a comment
 * Story 1.5.6 - AC 5, 7: Like comment API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params;

    // Get current user from auth session
    const session = await getCurrentSession();
    const currentUserId = (session?.user as { id?: string })?.id;

    // Check authentication
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', currentUserId)
      .single();

    if (existingLike) {
      // Already liked, return current count
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      return NextResponse.json({
        success: true,
        like_count: count || 0,
      });
    }

    // Create like
    const { error: likeError } = await supabase.from('comment_likes').insert({
      comment_id: commentId,
      user_id: currentUserId,
    });

    if (likeError) {
      console.error('Error creating like:', likeError);
      return NextResponse.json(
        { error: 'Failed to like comment' },
        { status: 500 }
      );
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    return NextResponse.json({
      success: true,
      like_count: count || 0,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]/like
 * Unlike a comment
 * Story 1.5.6 - AC 5, 7: Unlike comment API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: commentId } = await params;

    // Get current user from auth session
    const session = await getCurrentSession();
    const currentUserId = (session?.user as { id?: string })?.id;

    // Check authentication
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', currentUserId);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unlike comment' },
        { status: 500 }
      );
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    return NextResponse.json({
      success: true,
      like_count: count || 0,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
