/**
 * API Route: /api/concepts/{slug}/complete
 * GET: Check if a concept is complete
 * POST: Mark a concept as complete
 * DELETE: Unmark a concept as complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { ProgressService, ContentService } from '@/lib/db/services';

const progressService = new ProgressService();
const contentService = new ContentService();

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Check if a concept is complete
 * GET /api/concepts/{slug}/complete
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ is_completed: false }, { status: 200 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ is_completed: false }, { status: 200 });
    }

    // Get concept slug from params
    const { slug } = await context.params;

    // Look up concept by slug without user context (public access)
    // Note: Access control is handled at page level, this endpoint only checks completion
    const conceptResult = await contentService.getConceptBySlug(slug);
    // Handle FreemiumAccessResult - check both hasAccess and data
    if (!conceptResult.hasAccess || !conceptResult.data) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Concept not found' },
        { status: 404 }
      );
    }

    // Check if concept is completed
    const isCompleted = await progressService.isConceptCompleted(
      userId,
      conceptResult.data.id
    );

    return NextResponse.json(
      {
        is_completed: isCompleted,
        concept_id: conceptResult.data.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'Unexpected error in GET /api/concepts/[slug]/complete:',
      error
    );
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Mark a concept as complete
 * POST /api/concepts/{slug}/complete
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to mark concepts as complete',
        },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid Session', message: 'User ID not found in session' },
        { status: 401 }
      );
    }

    // Get concept slug from params
    const { slug } = await context.params;

    // Look up concept by slug without user context (public access)
    // Note: Access control is handled at page level, this endpoint only marks completion
    const conceptResult = await contentService.getConceptBySlug(slug);
    // Handle FreemiumAccessResult - check both hasAccess and data
    if (!conceptResult.hasAccess || !conceptResult.data) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Concept not found' },
        { status: 404 }
      );
    }

    // Mark concept as complete
    const result = await progressService.markConceptComplete(
      userId,
      conceptResult.data.id
    );

    return NextResponse.json(
      {
        success: true,
        completed_at: result.completed_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'Unexpected error in POST /api/concepts/[slug]/complete:',
      error
    );
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Unmark a concept as complete
 * DELETE /api/concepts/{slug}/complete
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to unmark concepts',
        },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid Session', message: 'User ID not found in session' },
        { status: 401 }
      );
    }

    // Get concept slug from params
    const { slug } = await context.params;

    // Look up concept by slug without user context (public access)
    // Note: Access control is handled at page level, this endpoint only marks deletion
    const conceptResult = await contentService.getConceptBySlug(slug);
    // Handle FreemiumAccessResult - check both hasAccess and data
    if (!conceptResult.hasAccess || !conceptResult.data) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Concept not found' },
        { status: 404 }
      );
    }

    // Unmark concept as complete
    await progressService.unmarkConceptComplete(userId, conceptResult.data.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Concept unmarked as complete',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'Unexpected error in DELETE /api/concepts/[slug]/complete:',
      error
    );
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
