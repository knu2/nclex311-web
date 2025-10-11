import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { CommentService } from '@/lib/db/services/CommentService';
import { ContentService } from '@/lib/db/services/ContentService';
import { ServiceError } from '@/lib/db/services/BaseService';

const PAGE_SIZE = 20;

/**
 * GET /api/concepts/[slug]/comments
 * Fetch comments for a concept with pagination
 * Story 1.5.6.1 - Refactored to use Drizzle ORM and CommentService
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const commentService = new CommentService();
  const contentService = new ContentService();

  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Get current user from auth session
    const session = await getCurrentSession();
    const currentUserId = (session?.user as { id?: string })?.id || undefined;

    // Get concept by slug to obtain concept ID
    const conceptResult = await contentService.getConceptBySlug(slug);
    if (!conceptResult.hasAccess || !conceptResult.data) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    // Fetch comments using CommentService
    const { comments, totalCount } =
      await commentService.getCommentsByConceptId(
        conceptResult.data.id,
        page,
        PAGE_SIZE,
        currentUserId
      );

    // Transform to match API response format
    const commentsResponse = comments.map(comment => ({
      id: comment.id,
      user_id: comment.userId,
      user_name: comment.user_name?.split('@')[0] || 'Unknown',
      content: comment.content,
      like_count: comment.like_count,
      is_liked_by_user: comment.is_liked_by_user,
      created_at: comment.createdAt,
    }));

    return NextResponse.json({
      comments: commentsResponse,
      total_count: totalCount,
      page,
      page_size: PAGE_SIZE,
      has_more: totalCount > page * PAGE_SIZE,
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
 * POST /api/concepts/[slug]/comments
 * Create a new comment on a concept
 * Story 1.5.6.1 - Refactored to use Drizzle ORM and CommentService
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const commentService = new CommentService();
  const contentService = new ContentService();

  try {
    const { slug } = await params;
    const body = await request.json();
    const { content } = body;

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

    // Basic type validation (detailed validation in CommentService)
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get concept by slug to obtain concept ID
    const conceptResult = await contentService.getConceptBySlug(slug);
    if (!conceptResult.hasAccess || !conceptResult.data) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    // Create comment using CommentService
    // Service handles validation (empty check, 2000 char limit)
    const comment = await commentService.createComment(
      conceptResult.data.id,
      currentUserId,
      content
    );

    // Get comment with like status for response
    const commentWithLikes = await commentService.getCommentWithLikeStatus(
      comment.id,
      currentUserId
    );

    if (!commentWithLikes) {
      throw new Error('Failed to retrieve created comment');
    }

    return NextResponse.json(
      {
        id: commentWithLikes.id,
        user_id: commentWithLikes.userId,
        user_name: commentWithLikes.user_name?.split('@')[0] || 'Unknown',
        content: commentWithLikes.content,
        like_count: commentWithLikes.like_count,
        is_liked_by_user: commentWithLikes.is_liked_by_user,
        created_at: commentWithLikes.createdAt,
      },
      { status: 201 }
    );
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
