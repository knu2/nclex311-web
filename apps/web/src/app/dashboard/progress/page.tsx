/**
 * Progress Dashboard Page
 * Route: /dashboard/progress
 * Story 1.5.8: Progress Dashboard
 *
 * Displays comprehensive user progress across all chapters
 * Requires authentication
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth-utils';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ProgressDashboard } from '@/components/Dashboard/ProgressDashboard';
import { ProgressService } from '@/lib/db/services';
import type { UserProgress } from '@/types/progress';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';

const progressService = new ProgressService();

/**
 * Fetch user progress data using ProgressService
 */
async function fetchUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const progressData = await progressService.getUserProgress(userId);
    return progressData;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}

/**
 * Progress Dashboard Page Component
 */
export default async function ProgressDashboardPage() {
  // Require authentication
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/progress');
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect('/login?callbackUrl=/dashboard/progress');
  }

  // Fetch progress data
  const progressData = await fetchUserProgress(userId);

  // Transform session user to match MainLayout's expected interface
  const user = {
    id: userId,
    name: session.user.name || session.user.email || 'User',
    email: session.user.email || '',
    avatar: (session.user as { image?: string }).image,
    is_premium: false, // TODO: Get from database in future story
  };

  // Handle error state
  if (!progressData) {
    return (
      <MainLayout user={user}>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom color="error">
              Unable to Load Progress
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We encountered an error while loading your progress data. Please
              try again later.
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/chapters"
              startIcon={<ArrowBackIcon />}
              sx={{
                bgcolor: '#2c5aa0',
                '&:hover': {
                  bgcolor: '#234a87',
                },
              }}
            >
              Back to Chapters
            </Button>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <Box>
        {/* Back Navigation */}
        <Container maxWidth="lg" sx={{ pt: 2, pb: 1 }}>
          <Button
            component={Link}
            href="/chapters"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: '#2c5aa0',
              '&:hover': {
                bgcolor: 'rgba(44, 90, 160, 0.04)',
              },
            }}
          >
            Back to Chapters
          </Button>
        </Container>

        {/* Progress Dashboard Component */}
        <ProgressDashboard progress={progressData} />
      </Box>
    </MainLayout>
  );
}

/**
 * Metadata for the page
 */
export const metadata = {
  title: 'Your Progress | NCLEX 311',
  description: 'Track your learning progress across all NCLEX 311 concepts',
};
