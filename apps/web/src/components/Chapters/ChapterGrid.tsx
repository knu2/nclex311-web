'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Alert,
  Skeleton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { ChapterCard } from './ChapterCard';
import type { ChapterGridItem } from '@/app/api/chapters/route';

export interface ChapterGridProps {
  isPremiumUser?: boolean;
}

interface ChaptersApiResponse {
  chapters: ChapterGridItem[];
}

/**
 * ChapterGrid Component
 * Displays a responsive grid of all chapters with concept counts
 * Story 1.5.7: Chapter Grid Component
 */
export function ChapterGrid({ isPremiumUser = false }: ChapterGridProps) {
  const [chapters, setChapters] = useState<ChapterGridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/chapters');

        if (!response.ok) {
          throw new Error(`Failed to fetch chapters: ${response.statusText}`);
        }

        const data: ChaptersApiResponse = await response.json();

        if (!data.chapters || !Array.isArray(data.chapters)) {
          throw new Error('Invalid response format from API');
        }

        setChapters(data.chapters);
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load chapters'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  const handleUpgradeClick = () => {
    setUpgradeDialogOpen(true);
  };

  const handleCloseUpgradeDialog = () => {
    setUpgradeDialogOpen(false);
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(index => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 1 }}
              aria-label="Loading chapter card"
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box sx={{ width: '100%', py: 4 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          aria-live="assertive"
          role="alert"
        >
          <Typography variant="body1" fontWeight={600}>
            Failed to Load Chapters
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          aria-label="Retry loading chapters"
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Empty State
  if (chapters.length === 0) {
    return (
      <Box sx={{ width: '100%', py: 4, textAlign: 'center' }}>
        <Alert severity="info" aria-live="polite">
          No chapters available at this time.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4 }}>
      {/* Chapter Grid - Story 1.5.12: Updated to 350px min-width with 1.5rem gap */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
        }}
        role="list"
        aria-label="Chapter grid with 8 chapters"
      >
        {chapters.map(chapter => (
          <Box key={chapter.id} role="listitem">
            <ChapterCard
              chapter={chapter}
              isPremiumUser={isPremiumUser}
              onUpgradeClick={handleUpgradeClick}
            />
          </Box>
        ))}
      </Box>

      {/* Upgrade Dialog */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={handleCloseUpgradeDialog}
        aria-labelledby="upgrade-dialog-title"
        aria-describedby="upgrade-dialog-description"
      >
        <DialogTitle id="upgrade-dialog-title">Premium Content</DialogTitle>
        <DialogContent>
          <DialogContentText id="upgrade-dialog-description">
            This chapter is part of our premium content. Upgrade to access all 8
            chapters and unlock the complete NCLEX-RN preparation experience.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpgradeDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleCloseUpgradeDialog();
              window.location.href = '/upgrade';
            }}
            variant="contained"
            color="primary"
            autoFocus
          >
            Upgrade Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
