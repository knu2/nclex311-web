/**
 * API Route: GET /api/concepts/[slug]
 * Returns concept content with freemium access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentService, UserService } from '@/lib/db/services';
import { getCurrentSession } from '@/lib/auth-utils';

const contentService = new ContentService();
const userService = new UserService();

/**
 * GET /api/concepts/[slug]
 * Returns concept content with freemium access control
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Concept slug is required',
        },
        { status: 400 }
      );
    }

    // Get user session for access control
    let currentUser = null;
    try {
      const session = await getCurrentSession();
      if (session?.user?.email) {
        currentUser = await userService.findUserByEmail(session.user.email);
      }
    } catch (sessionError) {
      console.warn('Failed to get user session:', sessionError);
      // Continue without user context (guest access)
    }

    // Get concept with freemium access control
    const result = await contentService.getConceptBySlug(slug, currentUser);

    if (!result.hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Premium access required',
          premiumRequired: true,
          chapterNumber: result.chapterNumber,
          message: `This concept is part of Chapter ${result.chapterNumber} which requires a premium subscription. Upgrade to access all content.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    const params = await context.params;
    console.error(`Failed to fetch concept ${params.slug}:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Concept not found',
          message: 'The requested concept could not be found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch concept',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
