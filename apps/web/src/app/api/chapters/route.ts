/**
 * API Route: GET /api/chapters
 * Returns all chapters with their concepts for the browsing interface
 * Story 1.5.7: Chapter Grid Component
 */

import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/db/services';

const contentService = new ContentService();

export interface ChapterGridItem {
  id: string;
  chapterNumber: number;
  title: string;
  slug: string;
  isPremium: boolean;
  conceptCount: number;
  firstConceptSlug: string;
}

export interface ChaptersResponse {
  chapters: ChapterGridItem[];
}

/**
 * GET /api/chapters
 * Returns all chapters formatted for the chapter grid view
 * Includes computed fields: isPremium, conceptCount, firstConceptSlug
 */
export async function GET() {
  try {
    const chaptersData = await contentService.getAllChaptersWithConcepts();

    // Transform to match story contract (Option A - no progress data)
    const chapters: ChapterGridItem[] = chaptersData.map(chapter => ({
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      slug: chapter.slug,
      isPremium: chapter.chapterNumber > 4, // Chapters 5-8 are premium
      conceptCount: chapter.concepts.length,
      firstConceptSlug: chapter.concepts[0]?.slug || '',
    }));

    return NextResponse.json({
      chapters,
    } satisfies ChaptersResponse);
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
