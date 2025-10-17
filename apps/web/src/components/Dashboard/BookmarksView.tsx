'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from '@mui/material';
import { BookmarkBorder as BookmarkBorderIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import BookmarkCard from './BookmarkCard';

/**
 * Bookmark data interface
 */
export interface Bookmark {
  id: string;
  user_id: string;
  concept_id: string;
  concept_title: string;
  concept_slug: string;
  chapter_number: number;
  chapter_title: string;
  note_preview: string;
  bookmarked_at: string;
}

/**
 * BookmarksView Props
 */
export interface BookmarksViewProps {
  userId: string;
}

/**
 * BookmarksView Component
 *
 * Displays a responsive grid of bookmarked concepts
 * Story 1.5.9: Bookmarks View
 * Story 1.5.13: UX Enhancement - Removed Edit Note integration for clarity
 *
 * Features:
 * - Responsive MUI Grid (3 columns desktop, 2 tablet, 1 mobile)
 * - Empty state for no bookmarks
 * - Loading and error states
 * - Remove bookmark with confirmation
 * - Users can edit notes by navigating to concept page directly
 */
export default function BookmarksView({ userId }: BookmarksViewProps) {
  const router = useRouter();

  // State management
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch bookmarks on mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/bookmarks`);

        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks');
        }

        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load bookmarks'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [userId, router]);

  // Handle view concept
  const handleView = (slug: string) => {
    router.push(`/concepts/${slug}`);
  };

  // Handle remove bookmark
  const handleRemove = async (bookmarkId: string) => {
    // Confirmation is handled by BookmarkCard component
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
        setSnackbar({
          open: true,
          message: 'Bookmark removed successfully',
          severity: 'success',
        });
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || 'Failed to remove bookmark',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred. Please try again.',
        severity: 'error',
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Empty state
  if (bookmarks.length === 0) {
    return (
      <>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600, color: '#2c3e50' }}
          >
            🔖 My Bookmarks
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Your saved concepts for quick reference and review
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            bgcolor: '#f8f9fc',
            borderRadius: 2,
            p: 4,
          }}
        >
          <BookmarkBorderIcon sx={{ fontSize: 80, color: '#6c757d', mb: 2 }} />
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: '#2c3e50' }}
          >
            No Bookmarks Yet
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ mb: 3, maxWidth: 500 }}
          >
            Start bookmarking concepts to quickly access them later. Click the
            bookmark button on any concept page to save it here.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/chapters')}
            sx={{
              bgcolor: '#2c5aa0',
              '&:hover': {
                bgcolor: '#234a85',
              },
            }}
          >
            Browse Chapters
          </Button>
        </Box>
      </>
    );
  }

  // Main bookmarks grid
  return (
    <>
      {/* Page Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 600, color: '#2c3e50' }}
        >
          🔖 My Bookmarks
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
          Your saved concepts for quick reference and review
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
        </Typography>
      </Box>

      {/* Bookmarks Grid */}
      <Grid container spacing={3}>
        {bookmarks.map(bookmark => (
          <Grid
            key={bookmark.id}
            size={{ xs: 12, sm: 6, md: 4 }} // Responsive: 1 col mobile, 2 tablet, 3 desktop
          >
            <BookmarkCard
              bookmark={bookmark}
              onView={handleView}
              onRemove={handleRemove}
            />
          </Grid>
        ))}
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
