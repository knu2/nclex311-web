'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

import { ErrorStateProps } from './types';

/**
 * ErrorState Component
 * Displays when comment loading fails, with recovery options
 * Story 1.5.6 - AC 10: Error state with retry and post buttons
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  onRetry,
  onCreatePost,
}) => {
  return (
    <Box
      role="alert"
      aria-live="assertive"
      sx={{
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '2px solid #ffeaa7',
        margin: '16px 0',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#e17055',
          marginBottom: 2,
          fontWeight: 600,
        }}
      >
        ⚠️ Unable to load comments
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: '#6c757d',
          marginBottom: 3,
          lineHeight: 1.6,
        }}
      >
        We couldn&apos;t load the discussion comments right now. You can still
        create a new comment or try refreshing.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          aria-label="Retry loading comments"
          sx={{
            textTransform: 'none',
            borderColor: '#2c5aa0',
            color: '#2c5aa0',
            minHeight: '40px',
            '&:hover': {
              borderColor: '#234a85',
              backgroundColor: '#e8f0fe',
            },
          }}
        >
          Retry
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreatePost}
          aria-label="Create new comment"
          sx={{
            textTransform: 'none',
            backgroundColor: '#2c5aa0',
            minHeight: '40px',
            '&:hover': {
              backgroundColor: '#244a85',
            },
          }}
        >
          Post Comment
        </Button>
      </Box>
    </Box>
  );
};
