import { MainLayout } from '@/components/Layout/MainLayout';
import { getCurrentSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Box, Typography, Container } from '@mui/material';
import { ChapterGrid } from '@/components/Chapters/ChapterGrid';

/**
 * Force dynamic rendering for this page since it uses authentication
 */
export const dynamic = 'force-dynamic';

/**
 * Chapters Page
 * Landing page for authenticated users showing all NCLEX 311 chapters
 * Story: 1.5.7 - Chapter Grid Component
 */
export default async function ChaptersPage() {
  // Require authentication - redirect to login if not authenticated
  const session = await getCurrentSession();

  if (!session || !session.user) {
    // Preserve the current URL as callbackUrl for post-login redirect
    redirect('/login?callbackUrl=/chapters');
  }

  // Transform session user to match MainLayout's expected interface
  const userSubscriptionStatus = (
    session.user as { subscriptionStatus?: string }
  )?.subscriptionStatus;

  const user = {
    id: (session.user as { id?: string }).id || '',
    name: session.user.name || session.user.email || 'User',
    email: session.user.email || '',
    avatar: (session.user as { image?: string }).image,
    is_premium: userSubscriptionStatus === 'premium',
    subscriptionStatus: userSubscriptionStatus || 'free',
  };

  return (
    <MainLayout user={user}>
      <Container maxWidth="lg">
        <Box
          sx={{
            py: 4,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontSize: {
                xs: '2rem',
                md: '2.5rem',
              },
              fontWeight: 600,
              color: '#2c3e50',
              mb: 1,
            }}
          >
            All NCLEX 311 Chapters
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            Select a chapter to begin your NCLEX-RN preparation journey
          </Typography>

          {/* Chapter Grid Component */}
          <ChapterGrid isPremiumUser={user.is_premium} />
        </Box>
      </Container>
    </MainLayout>
  );
}
