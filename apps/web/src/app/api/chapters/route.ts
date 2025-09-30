/**
 * API Route: GET /api/chapters
 * Returns all chapters with their concepts for the browsing interface
 */

import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/db/services';

const contentService = new ContentService();

/**
 * GET /api/chapters
 * Returns all chapters with concept previews including premium indicators
 */
export async function GET() {
  try {
    const chapters = await contentService.getAllChaptersWithConcepts();
    
    return NextResponse.json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chapters',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}