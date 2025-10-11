import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { CommentService } from '@/lib/db/services/CommentService';
import { ServiceError } from '@/lib/db/services/BaseService';

/**
 * POST /api/comments/[id]/like
 * Like a comment
 * Story 1.5.6.1 - Refactored to use Drizzle ORM and CommentService
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const commentService = new CommentService();

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

    // Like comment using CommentService
    // Service handles comment existence check and duplicate like handling (ON CONFLICT DO NOTHING)
    const likeCount = await commentService.likeComment(
      commentId,
      currentUserId
    );

    return NextResponse.json({
      success: true,
      like_count: likeCount,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
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

/**
 * DELETE /api/comments/[id]/like
 * Unlike a comment
 * Story 1.5.6.1 - Refactored to use Drizzle ORM and CommentService
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const commentService = new CommentService();

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

    // Unlike comment using CommentService
    // Service handles comment existence check
    const likeCount = await commentService.unlikeComment(
      commentId,
      currentUserId
    );

    return NextResponse.json({
      success: true,
      like_count: likeCount,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
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
