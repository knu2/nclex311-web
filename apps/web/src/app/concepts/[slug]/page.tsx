import { MainLayout } from '@/components/Layout/MainLayout';
import { ConceptViewer } from '@/components/Concept/ConceptViewer';
import { getCurrentSession } from '@/lib/auth-utils';
import { ContentService } from '@/lib/db/services';
import { redirect, notFound } from 'next/navigation';

/**
 * Force dynamic rendering for this page since it uses authentication
 */
export const dynamic = 'force-dynamic';

/**
 * Concept Page
 * Server component that fetches concept data and wraps with MainLayout
 * Story: 1.5.3.5 - Page Integration & Route Migration
 */
export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await params in Next.js 15
  const { slug } = await params;

  // Require authentication - redirect to login if not authenticated
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch concept data server-side
  const contentService = new ContentService();
  let concept;

  try {
    // Get user for access control
    const result = await contentService.getConceptBySlug(slug, {
      id: (session.user as { id?: string }).id || '',
      email: session.user.email || '',
      passwordHash: '', // Not used for access control
      subscription: 'FREE', // TODO: Get from database in future story
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!result.hasAccess) {
      // TODO: Redirect to paywall or show premium message
      // For now, redirect to chapters
      redirect('/chapters');
    }

    concept = result.data;
  } catch (error) {
    console.error('Failed to fetch concept:', error);
    notFound();
  }

  if (!concept) {
    notFound();
  }

  // Transform session user to match MainLayout's expected interface
  const user = {
    id: (session.user as { id?: string }).id || '',
    name: session.user.name || session.user.email || 'User',
    email: session.user.email || '',
    avatar: (session.user as { image?: string }).image,
    is_premium: false, // TODO: Get from database in future story
  };

  // Transform concept data to match ConceptViewer's expected interface
  const conceptData = {
    id: concept.id,
    title: concept.title,
    slug: concept.slug,
    conceptNumber: concept.conceptNumber,
    content: concept.content,
    keyPoints: concept.keyPoints || null,
    reference: concept.reference || null,
    chapterId: concept.chapterId,
    isPremium: concept.isPremium,
    questions: concept.questions || [],
    chapter: {
      id: concept.chapter.id,
      title: concept.chapter.title,
      chapterNumber: concept.chapter.chapterNumber,
      slug: concept.chapter.slug,
    },
  };

  return (
    <MainLayout
      user={user}
      chapterId={concept.chapter.id}
      currentConceptSlug={slug}
    >
      <ConceptViewer initialConcept={conceptData} />
    </MainLayout>
  );
}
