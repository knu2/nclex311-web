'use client';

import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, onCancel }) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter a reply');
      return;
    }

    if (content.trim().length < 5) {
      setError('Reply must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        backgroundColor: '#f8f9fc',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #e1e7f0',
      }}
    >
      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder="Write a reply..."
        value={content}
        onChange={e => setContent(e.target.value)}
        error={!!error}
        helperText={error}
        disabled={isSubmitting}
        sx={{
          marginBottom: '12px',
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'white',
            '& fieldset': {
              borderColor: '#e1e7f0',
            },
            '&:hover fieldset': {
              borderColor: '#2c5aa0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2c5aa0',
            },
          },
        }}
        inputProps={{
          'aria-label': 'reply content',
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button
          variant="text"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{
            textTransform: 'none',
            color: '#6c757d',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting || !content.trim()}
          sx={{
            textTransform: 'none',
            backgroundColor: '#2c5aa0',
            '&:hover': {
              backgroundColor: '#244a85',
            },
          }}
        >
          {isSubmitting ? 'Posting...' : 'Reply'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReplyForm;
