import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { NotesService, ContentService, ServiceError } from '@/lib/db/services';
import { handleApiError } from '@/lib/errors';
import { getCurrentSession } from '@/lib/auth-utils';

const NoteContentSchema = z.object({
  content: z.string().min(1).max(2000),
});

/**
 * GET /api/concepts/[slug]/notes
 * Retrieves the authenticated user's note for a specific concept
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const userId = session.user.id;

    // Get concept ID from slug
    const contentService = new ContentService();
    const concept = await contentService.getConceptBySlug(slug, null);

    if (!concept.data) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    const conceptId = concept.data.id;

    // Retrieve note
    const notesService = new NotesService();
    const note = await notesService.getUserNote(userId, conceptId);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return handleApiError(error, 'concepts.notes.GET');
  }
}

/**
 * POST /api/concepts/[slug]/notes
 * Creates or updates a note for the authenticated user on a specific concept
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const userId = session.user.id;

    // Get concept ID from slug
    const contentService = new ContentService();
    const concept = await contentService.getConceptBySlug(slug, null);

    if (!concept.data) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    const conceptId = concept.data.id;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const validatedData = NoteContentSchema.parse(body);

    // Create or update note
    const notesService = new NotesService();
    const note = await notesService.upsertNote(
      userId,
      conceptId,
      validatedData.content
    );

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return handleApiError(error, 'concepts.notes.POST');
  }
}

/**
 * DELETE /api/concepts/[slug]/notes
 * Deletes the authenticated user's note for a specific concept
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const userId = session.user.id;

    // Get concept ID from slug
    const contentService = new ContentService();
    const concept = await contentService.getConceptBySlug(slug, null);

    if (!concept.data) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    const conceptId = concept.data.id;

    // Delete note
    const notesService = new NotesService();
    const deleted = await notesService.deleteNote(userId, conceptId);

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return handleApiError(error, 'concepts.notes.DELETE');
  }
}
