import { redirect } from 'next/navigation';
import { Box, Container } from '@mui/material';
import { getCurrentSession } from '@/lib/auth-utils';
import BookmarksView from '@/components/Dashboard/BookmarksView';

/**
 * Bookmarks Dashboard Page
 * Route: /dashboard/bookmarks
 *
 * Displays all bookmarked concepts for the logged-in user
 * Story 1.5.9: Bookmarks View
 *
 * Server-side rendered with authentication check
 */
export default async function BookmarksPage() {
  // Require authentication
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/bookmarks');
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect('/login?callbackUrl=/dashboard/bookmarks');
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '80vh',
          py: { xs: 3, sm: 4 },
        }}
      >
        <BookmarksView userId={userId} />
      </Box>
    </Container>
  );
}

/**
 * Page metadata for SEO
 */
export const metadata = {
  title: 'My Bookmarks | NCLEX311',
  description:
    'View and manage your bookmarked NCLEX concepts for quick access',
};
