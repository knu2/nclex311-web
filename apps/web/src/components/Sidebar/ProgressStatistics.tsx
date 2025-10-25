'use client';

/**
 * ProgressStatistics Component
 * Displays user progress overview in the sidebar on /chapters page
 * Story 1.5.13: UX Enhancement - Sidebar & Bookmark Polish
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress } from '@mui/material';

/**
 * User Progress Data Interface
 */
export interface UserProgressData {
  completedConceptsCount: number;
  bookmarksCount: number;
  freeConceptsTotal: number;
  premiumConceptsTotal: number;
}

/**
 * ProgressStatistics Props
 */
export interface ProgressStatisticsProps {
  userId: string;
  subscriptionStatus?: string; // 'free' | 'premium' | 'expired' | 'cancelled'
}

/**
 * ProgressStatistics Component
 * Displays 4 key statistics with icons in the sidebar
 */
export const ProgressStatistics: React.FC<ProgressStatisticsProps> = ({
  userId,
  subscriptionStatus = 'free',
}) => {
  const isPremium = subscriptionStatus === 'premium';
  const [progressData, setProgressData] = useState<UserProgressData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${userId}/progress`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load progress');
        }

        setProgressData(data.data);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProgressData();
    }
  }, [userId]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="error" sx={{ fontSize: '0.875rem' }}>
          Unable to load progress
        </Typography>
      </Box>
    );
  }

  // No data state
  if (!progressData) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 3,
        borderBottom: '1px solid #e1e7f0',
        backgroundColor: '#fff',
      }}
    >
      {/* Section Heading */}
      <Typography
        variant="h6"
        sx={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#6c757d',
          mb: 2,
          letterSpacing: '0.025em',
        }}
      >
        📚 Your Progress
      </Typography>

      {/* Statistics Stack */}
      <Stack spacing={2}>
        {/* Completed Concepts */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              color: '#6c757d',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Completed
          </Typography>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#00b894',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span>🟢</span>
            {progressData.completedConceptsCount}
            <Typography
              component="span"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: '#6c757d',
                ml: 0.5,
              }}
            >
              Concepts
            </Typography>
          </Typography>
        </Box>

        {/* Free Concepts Available */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              color: '#6c757d',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Free Available
          </Typography>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#2c5aa0',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span>📖</span>
            {progressData.freeConceptsTotal}
            <Typography
              component="span"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: '#6c757d',
                ml: 0.5,
              }}
            >
              Concepts
            </Typography>
          </Typography>
        </Box>

        {/* Premium Concepts - Show as Unlocked for premium users, Locked for free users */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              color: '#6c757d',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {isPremium ? 'Premium Unlocked' : 'Premium Locked'}
          </Typography>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: isPremium ? '#00b894' : '#ff6b35',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span>{isPremium ? '🔓' : '🔒'}</span>
            {isPremium
              ? progressData.freeConceptsTotal +
                progressData.premiumConceptsTotal
              : progressData.premiumConceptsTotal}
            <Typography
              component="span"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: '#6c757d',
                ml: 0.5,
              }}
            >
              {isPremium ? 'Total' : 'Concepts'}
            </Typography>
          </Typography>
        </Box>

        {/* Bookmarks Count */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              color: '#6c757d',
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Bookmarks
          </Typography>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span>🔖</span>
            {progressData.bookmarksCount}
            <Typography
              component="span"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: '#6c757d',
                ml: 0.5,
              }}
            >
              Saved
            </Typography>
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default ProgressStatistics;
