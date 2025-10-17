'use client';

import React, { memo, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Forum as ForumIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';

interface ConceptActionsProps {
  conceptSlug: string;
  isCompleted: boolean;
  onMarkCompleteChange?: (isCompleted: boolean) => void;
  onDiscussionClick?: () => void;
  onNotesClick?: () => void;
}

/**
 * ConceptActions Component
 * Displays action buttons at the bottom of concept content
 * - Discussion: Trigger comment modal
 * - Mark Complete: Toggle completion status
 * - Take Notes: Trigger notes modal
 *
 * Story: 1.5.3.1 - Concept Button Reorganization
 */
export const ConceptActions: React.FC<ConceptActionsProps> = memo(
  ({
    conceptSlug,
    isCompleted: initialIsCompleted,
    onMarkCompleteChange,
    onDiscussionClick,
    onNotesClick,
  }) => {
    const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
    const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<
      'success' | 'error'
    >('success');

    // Sync isCompleted prop with state
    useEffect(() => {
      setIsCompleted(initialIsCompleted);
    }, [initialIsCompleted]);

    // Handle mark as complete toggle
    const handleToggleCompletion = async () => {
      setIsTogglingCompletion(true);

      try {
        const method = isCompleted ? 'DELETE' : 'POST';
        const response = await fetch(`/api/concepts/${conceptSlug}/complete`, {
          method,
        });

        if (response.ok) {
          const newCompletionStatus = !isCompleted;
          setIsCompleted(newCompletionStatus);

          setSnackbarMessage(
            newCompletionStatus
              ? 'Concept marked as complete! 🎉'
              : 'Concept unmarked as complete'
          );
          setSnackbarSeverity('success');
          setSnackbarOpen(true);

          // Notify parent and dispatch event
          if (onMarkCompleteChange) {
            onMarkCompleteChange(newCompletionStatus);
          }
          window.dispatchEvent(new Event('conceptCompletionChanged'));
        } else {
          const errorData = await response.json();
          setSnackbarMessage(
            errorData.message || 'Failed to update completion'
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error toggling completion:', error);
        setSnackbarMessage('An error occurred. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsTogglingCompletion(false);
      }
    };

    return (
      <>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 4,
            mb: 4,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: '100%' }}
          >
            {/* Discussion Button */}
            <Button
              variant="outlined"
              startIcon={<ForumIcon />}
              onClick={onDiscussionClick}
              fullWidth
              sx={{
                borderColor: '#2c5aa0',
                color: '#2c5aa0',
                fontWeight: 500,
                minHeight: '44px',
                '&:hover': {
                  borderColor: '#234a85',
                  bgcolor: 'rgba(44, 90, 160, 0.04)',
                },
              }}
            >
              💬 Discussion
            </Button>

            {/* Mark Complete Button */}
            <Button
              variant={isCompleted ? 'contained' : 'outlined'}
              startIcon={
                isTogglingCompletion ? (
                  <CircularProgress size={16} />
                ) : isCompleted ? (
                  <CheckCircleIcon />
                ) : (
                  <UncheckedIcon />
                )
              }
              onClick={handleToggleCompletion}
              disabled={isTogglingCompletion}
              fullWidth
              sx={{
                borderColor: isCompleted ? '#00b894' : '#2c5aa0',
                color: isCompleted ? 'white' : '#2c5aa0',
                bgcolor: isCompleted ? '#00b894' : 'transparent',
                fontWeight: 500,
                minHeight: '44px',
                '&:hover': {
                  borderColor: isCompleted ? '#00a080' : '#234a85',
                  bgcolor: isCompleted ? '#00a080' : 'rgba(44, 90, 160, 0.04)',
                },
                '&.Mui-disabled': {
                  borderColor: '#ccc',
                  color: '#999',
                },
              }}
            >
              {isCompleted ? '✅ Completed' : '✅ Mark Complete'}
            </Button>

            {/* Take Notes Button */}
            <Button
              variant="outlined"
              startIcon={<NotesIcon />}
              onClick={onNotesClick}
              fullWidth
              sx={{
                borderColor: '#2c5aa0',
                color: '#2c5aa0',
                fontWeight: 500,
                minHeight: '44px',
                '&:hover': {
                  borderColor: '#234a85',
                  bgcolor: 'rgba(44, 90, 160, 0.04)',
                },
              }}
            >
              📝 Take Notes
            </Button>
          </Stack>
        </Box>

        {/* Snackbar for feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }
);

ConceptActions.displayName = 'ConceptActions';

export default ConceptActions;
