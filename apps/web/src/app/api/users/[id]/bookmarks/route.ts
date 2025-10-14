import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';
import { getCurrentSession } from '@/lib/auth-utils';

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

    // Fetch bookmarks with joined data
    // Note: Supabase doesn't support direct LEFT JOIN syntax in the query builder,
    // so we'll use the relational query approach
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select(
        `
        id,
        user_id,
        concept_id,
        bookmarked_at,
        concepts!inner (
          id,
          title,
          slug,
          chapter_id,
          chapters!inner (
            chapter_number,
            title
          )
        )
      `
      )
      .eq('user_id', currentUserId)
      .order('bookmarked_at', { ascending: false });

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      );
    }

    // Fetch notes separately for these concepts
    const conceptIds = bookmarks?.map(b => b.concept_id) || [];
    let notesMap: Record<string, string> = {};

    if (conceptIds.length > 0) {
      const { data: notes } = await supabase
        .from('notes')
        .select('concept_id, content')
        .eq('user_id', currentUserId)
        .in('concept_id', conceptIds);

      if (notes) {
        notesMap = notes.reduce(
          (
            acc: Record<string, string>,
            note: { concept_id: string; content: string }
          ) => {
            // Get first 100 characters for preview
            acc[note.concept_id] = note.content.substring(0, 100);
            return acc;
          },
          {}
        );
      }
    }

    // Transform the data into the expected response format
    type BookmarkWithRelations = {
      id: string;
      user_id: string;
      concept_id: string;
      bookmarked_at: string;
      concepts: {
        id: string;
        title: string;
        slug: string;
        chapters: {
          chapter_number: number;
          title: string;
        };
      };
    };

    const formattedBookmarks: BookmarkResponse[] =
      bookmarks?.map((bookmark: BookmarkWithRelations) => {
        const concept = bookmark.concepts;
        const chapter = concept.chapters;

        return {
          id: bookmark.id,
          user_id: bookmark.user_id,
          concept_id: bookmark.concept_id,
          concept_title: concept.title,
          concept_slug: concept.slug,
          chapter_number: chapter.chapter_number,
          chapter_title: chapter.title,
          note_preview: notesMap[bookmark.concept_id] || '',
          bookmarked_at: bookmark.bookmarked_at,
        };
      }) || [];

    return NextResponse.json({
      bookmarks: formattedBookmarks,
    });
  } catch (error) {
    console.error('Bookmarks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
