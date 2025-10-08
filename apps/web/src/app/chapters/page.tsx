import { MainLayout } from '@/components/Layout/MainLayout';
import { getCurrentSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Box, Typography, Container } from '@mui/material';

/**
 * Force dynamic rendering for this page since it uses authentication
 */
export const dynamic = 'force-dynamic';

/**
 * Chapters Page
 * Landing page for authenticated users showing all NCLEX 311 chapters
 * Story: 1.5.3.5 - Page Integration & Route Migration
 */
export default async function ChaptersPage() {
  // Require authentication - redirect to login if not authenticated
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Transform session user to match MainLayout's expected interface
  const user = {
    id: (session.user as { id?: string }).id || '',
    name: session.user.name || session.user.email || 'User',
    email: session.user.email || '',
    avatar: (session.user as { image?: string }).image,
    is_premium: false, // TODO: Get from database in future story
  };

  return (
    <MainLayout user={user}>
      <Container maxWidth="md">
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
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
              mb: 2,
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
            Welcome to your NCLEX-RN preparation journey!
          </Typography>

          <Box
            sx={{
              p: 4,
              backgroundColor: '#f8f9fa',
              borderRadius: 2,
              border: '1px solid #e1e7f0',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 500,
                color: '#495057',
                mb: 2,
              }}
            >
              Chapter Grid View Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The chapter grid interface will be available in{' '}
              <strong>Story 1.5.7</strong>
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              💡 Use the sidebar navigation to browse concepts by chapter
            </Typography>
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
}
