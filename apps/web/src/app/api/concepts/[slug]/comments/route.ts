import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentSession } from '@/lib/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 20;

// Type for Supabase user relation
type CommentUser = {
  id: string;
  email: string;
};

/**
 * GET /api/concepts/[slug]/comments
 * Fetch comments for a concept with pagination
 * Story 1.5.6 - AC 3, 7: Get comments API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * PAGE_SIZE;

    // Get current user from auth session
    const session = await getCurrentSession();
    const currentUserId = (session?.user as { id?: string })?.id || null;

    // First, get the concept ID from slug
    const { data: concept, error: conceptError } = await supabase
      .from('concepts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (conceptError || !concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    // Fetch comments with pagination
    const {
      data: comments,
      error,
      count,
    } = await supabase
      .from('comments')
      .select(
        `
        id,
        user_id,
        content,
        created_at,
        users!inner (
          id,
          email
        )
      `,
        { count: 'exact' }
      )
      .eq('concept_id', concept.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Get like counts and user's like status for each comment
    const commentIds = comments?.map(c => c.id) || [];
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds);

    // Build response with like information
    const commentsWithLikes =
      comments?.map(comment => {
        const commentLikes =
          likes?.filter(l => l.comment_id === comment.id) || [];
        // Supabase returns joined relations as arrays, take first element
        const usersArray = comment.users as unknown as CommentUser[];
        const userData = Array.isArray(usersArray) ? usersArray[0] : usersArray;
        return {
          id: comment.id,
          user_id: comment.user_id,
          user_name: userData?.email?.split('@')[0] || 'Unknown',
          content: comment.content,
          like_count: commentLikes.length,
          is_liked_by_user: commentLikes.some(l => l.user_id === currentUserId),
          created_at: comment.created_at,
        };
      }) || [];

    return NextResponse.json({
      comments: commentsWithLikes,
      total_count: count || 0,
      page,
      page_size: PAGE_SIZE,
      has_more: (count || 0) > offset + PAGE_SIZE,
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
 * POST /api/concepts/[slug]/comments
 * Create a new comment on a concept
 * Story 1.5.6 - AC 5, 7: Create comment API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
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

    // Validation
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // First, get the concept ID from slug
    const { data: concept, error: conceptError } = await supabase
      .from('concepts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (conceptError || !concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: currentUserId,
        concept_id: concept.id,
        content: content.trim(),
      })
      .select(
        `
        id,
        user_id,
        content,
        created_at,
        users!inner (
          id,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Supabase returns joined relations as arrays, take first element
    const usersArray = comment.users as unknown as CommentUser[];
    const userData = Array.isArray(usersArray) ? usersArray[0] : usersArray;
    return NextResponse.json(
      {
        id: comment.id,
        user_id: comment.user_id,
        user_name: userData?.email?.split('@')[0] || 'Unknown',
        content: comment.content,
        like_count: 0,
        is_liked_by_user: false,
        created_at: comment.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
