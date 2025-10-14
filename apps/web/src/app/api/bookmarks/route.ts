import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';
import { getCurrentSession } from '@/lib/auth-utils';

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

    // Verify concept exists
    const { data: concept, error: conceptError } = await supabase
      .from('concepts')
      .select('id')
      .eq('id', concept_id)
      .single();

    if (conceptError || !concept) {
      return NextResponse.json(
        { success: false, error: 'Concept not found' },
        { status: 404 }
      );
    }

    // Check if bookmark already exists (upsert behavior)
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id, bookmarked_at')
      .eq('user_id', userId)
      .eq('concept_id', concept_id)
      .maybeSingle();

    if (existingBookmark) {
      // Return existing bookmark
      return NextResponse.json({
        success: true,
        bookmark: {
          id: existingBookmark.id,
          concept_id,
          bookmarked_at: existingBookmark.bookmarked_at,
        },
        message: 'Bookmark already exists',
      });
    }

    // Create new bookmark
    const { data: newBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userId,
          concept_id,
        },
      ])
      .select('id, bookmarked_at')
      .single();

    if (insertError || !newBookmark) {
      console.error('Error creating bookmark:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create bookmark' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookmark: {
        id: newBookmark.id,
        concept_id,
        bookmarked_at: newBookmark.bookmarked_at,
      },
    });
  } catch (error) {
    console.error('Bookmark creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
