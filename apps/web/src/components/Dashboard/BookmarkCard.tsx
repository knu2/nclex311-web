'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import type { Bookmark } from './BookmarksView';

/**
 * BookmarkCard Props
 */
export interface BookmarkCardProps {
  bookmark: Bookmark;
  onView: (slug: string) => void;
  onEditNote: (conceptSlug: string, conceptTitle: string) => void;
  onRemove: (bookmarkId: string) => void;
}

/**
 * BookmarkCard Component
 *
 * Displays a single bookmark card with concept information and action buttons
 * Story 1.5.9: Bookmarks View
 *
 * Features:
 * - Concept title and chapter badge
 * - Note preview (first 100 characters with ellipsis)
 * - Quick action buttons (View, Edit Note, Remove)
 * - Confirmation dialog for removal
 * - Accessible with ARIA labels
 */
export default function BookmarkCard({
  bookmark,
  onView,
  onEditNote,
  onRemove,
}: BookmarkCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Handle view button click
  const handleViewClick = () => {
    onView(bookmark.concept_slug);
  };

  // Handle edit note button click
  const handleEditNoteClick = () => {
    onEditNote(bookmark.concept_slug, bookmark.concept_title);
  };

  // Handle remove button click - open confirmation
  const handleRemoveClick = () => {
    setConfirmDialogOpen(true);
  };

  // Handle confirm remove
  const handleConfirmRemove = () => {
    setConfirmDialogOpen(false);
    onRemove(bookmark.id);
  };

  // Handle cancel remove
  const handleCancelRemove = () => {
    setConfirmDialogOpen(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card
        elevation={2}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.15s ease-out',
          border: '2px solid #e1e7f0',
          borderRadius: 2,
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Card Header with Star Icon */}
        <Box
          sx={{
            bgcolor: '#f8f9fc',
            p: 2,
            borderBottom: '1px solid #e1e7f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Chip
            label={`Chapter ${bookmark.chapter_number}`}
            size="small"
            sx={{
              bgcolor: 'white',
              border: '1px solid #e1e7f0',
              fontWeight: 500,
            }}
          />
          <StarIcon sx={{ color: '#ff6b35', fontSize: 24 }} />
        </Box>

        {/* Card Content */}
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Concept Title */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: '#2c3e50',
              fontWeight: 600,
              fontSize: '1.1rem',
              mb: 1,
            }}
          >
            {bookmark.concept_title}
          </Typography>

          {/* Chapter Info */}
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 1, fontSize: '0.875rem' }}
          >
            {bookmark.chapter_title}
          </Typography>

          {/* Bookmarked Date */}
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', mb: 2, fontSize: '0.8125rem' }}
          >
            Bookmarked {formatDate(bookmark.bookmarked_at)}
          </Typography>

          {/* Note Preview */}
          {bookmark.note_preview && (
            <Box
              sx={{
                bgcolor: '#fff9e6',
                border: '2px solid #ff6b35',
                borderRadius: '6px',
                p: 1.5,
                mt: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                }}
              >
                <span style={{ flexShrink: 0 }}>📝</span>
                <span
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {bookmark.note_preview}
                  {bookmark.note_preview.length >= 100 && '...'}
                </span>
              </Typography>
            </Box>
          )}

          {!bookmark.note_preview && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontStyle: 'italic', mt: 2 }}
            >
              No note yet
            </Typography>
          )}
        </CardContent>

        {/* Card Actions */}
        <CardActions
          sx={{
            justifyContent: 'space-between',
            p: 2,
            borderTop: '1px solid #e1e7f0',
            gap: 1,
          }}
        >
          <Tooltip title="View concept" arrow>
            <IconButton
              aria-label="view concept"
              onClick={handleViewClick}
              sx={{
                color: '#2c5aa0',
                '&:hover': {
                  bgcolor: 'rgba(44, 90, 160, 0.08)',
                },
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit note" arrow>
            <IconButton
              aria-label="edit note"
              onClick={handleEditNoteClick}
              sx={{
                color: '#2c5aa0',
                '&:hover': {
                  bgcolor: 'rgba(44, 90, 160, 0.08)',
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Remove bookmark" arrow>
            <IconButton
              aria-label="remove bookmark"
              onClick={handleRemoveClick}
              sx={{
                color: '#e17055',
                '&:hover': {
                  bgcolor: 'rgba(225, 112, 85, 0.08)',
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelRemove}
        aria-labelledby="remove-bookmark-dialog-title"
        aria-describedby="remove-bookmark-dialog-description"
      >
        <DialogTitle id="remove-bookmark-dialog-title">
          Remove Bookmark?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-bookmark-dialog-description">
            Are you sure you want to remove this bookmark? Your note will be
            preserved and you can bookmark this concept again later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove} sx={{ color: '#6c757d' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            variant="contained"
            sx={{
              bgcolor: '#e17055',
              '&:hover': {
                bgcolor: '#d35f47',
              },
            }}
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
