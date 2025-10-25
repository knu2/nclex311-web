import { MainLayout } from '@/components/Layout/MainLayout';
import { ConceptViewer } from '@/components/Concept/ConceptViewer';
import { getCurrentSession } from '@/lib/auth-utils';
import { ContentService, UserService } from '@/lib/db/services';
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

  // Validate slug
  if (!slug || typeof slug !== 'string') {
    notFound();
  }

  // Return 404 for image/asset files immediately
  // This prevents the database query when browsers request missing images
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|zip|css|js)$/i.test(slug)) {
    notFound();
  }

  // Require authentication - redirect to login if not authenticated
  const session = await getCurrentSession();

  if (!session?.user) {
    // Preserve the current URL as callbackUrl for post-login redirect
    redirect(`/login?callbackUrl=${encodeURIComponent(`/concepts/${slug}`)}`);
  }

  // Fetch user from database for proper access control
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect('/login');
  }

  const userService = new UserService();
  const dbUser = await userService.findUserById(userId);

  if (!dbUser) {
    redirect('/login');
  }

  const isPremiumUser = dbUser.subscriptionStatus === 'premium';

  // Fetch concept data server-side
  const contentService = new ContentService();
  let concept;

  try {
    // Get user for access control
    const result = await contentService.getConceptBySlug(slug, dbUser);

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
    id: dbUser.id,
    name: session.user.name || dbUser.email,
    email: dbUser.email,
    avatar: (session.user as { image?: string }).image,
    is_premium: isPremiumUser,
    subscriptionStatus: dbUser.subscriptionStatus,
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
