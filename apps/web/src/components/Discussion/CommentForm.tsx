'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { CommentFormProps } from './types';

const MAX_COMMENT_LENGTH = 2000;

/**
 * CommentForm Component
 * Allows users to create new comments with character limit validation
 * Story 1.5.6 - AC 3, 5: Comment input form with validation
 */
export const CommentForm: React.FC<CommentFormProps> = ({
  currentUserName,
  onSubmit,
  submitting,
}) => {
  const [content, setContent] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validation
    if (!content.trim()) {
      setLocalError('Comment cannot be empty');
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      setLocalError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    setLocalError(null);

    try {
      await onSubmit(content);
      // Clear form on success
      setContent('');
    } catch {
      setLocalError('Failed to post comment. Please try again.');
    }
  };

  const handleContentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setContent(e.target.value);
    // Clear error when user starts typing
    if (localError) {
      setLocalError(null);
    }
  };

  const isOverLimit = content.length > MAX_COMMENT_LENGTH;
  const isDisabled = submitting || !content.trim() || isOverLimit;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        backgroundColor: '#f8f9fc',
        padding: '1rem',
        borderRadius: '6px',
        marginBottom: '1rem',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: '#6c757d',
          marginBottom: '0.5rem',
        }}
      >
        Posting as: <strong>{currentUserName}</strong> (Student)
      </Typography>

      <TextField
        multiline
        rows={4}
        value={content}
        onChange={handleContentChange}
        placeholder="Share your thoughts, insights, or questions about this concept..."
        disabled={submitting}
        error={!!localError || isOverLimit}
        helperText={localError}
        fullWidth
        sx={{
          backgroundColor: 'white',
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#2c5aa0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2c5aa0',
            },
          },
        }}
        aria-label="Comment content"
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: isOverLimit ? '#d32f2f' : '#6c757d',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {content.length} / {MAX_COMMENT_LENGTH}
        </Typography>

        <Button
          type="submit"
          variant="contained"
          disabled={isDisabled}
          sx={{
            textTransform: 'none',
            backgroundColor: '#2c5aa0',
            minHeight: '36px',
            '&:hover': {
              backgroundColor: '#244a85',
            },
            '&:disabled': {
              backgroundColor: '#e1e7f0',
            },
          }}
        >
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ marginRight: '8px' }} />
              Posting...
            </>
          ) : (
            'Post Comment'
          )}
        </Button>
      </Box>
    </Box>
  );
};
