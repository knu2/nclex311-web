'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
} from '@mui/material';
import { PostType } from './types';

interface CreatePostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postType: PostType, content: string) => Promise<void>;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [postType, setPostType] = useState<PostType>('discussion');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    if (content.trim().length < 10) {
      setError('Post must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(postType, content.trim());
      // Reset form on success
      setContent('');
      setPostType('discussion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setContent('');
    setError('');
    onClose();
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        backgroundColor: '#f8f9fc',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '24px',
        border: '2px solid #e1e7f0',
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: '16px', fontWeight: 600 }}>
        Create New Post
      </Typography>

      {/* Post Type Selector */}
      <Box sx={{ marginBottom: '16px' }}>
        <Typography
          variant="body2"
          sx={{ marginBottom: '8px', color: '#6c757d' }}
        >
          Post Type
        </Typography>
        <ToggleButtonGroup
          value={postType}
          exclusive
          onChange={(event, newType) => {
            if (newType !== null) {
              setPostType(newType);
            }
          }}
          aria-label="post type"
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              borderRadius: '20px',
              padding: '6px 16px',
              marginRight: '8px',
              border: '2px solid #e1e7f0',
              '&.Mui-selected': {
                backgroundColor: '#2c5aa0',
                color: 'white',
                borderColor: '#2c5aa0',
                '&:hover': {
                  backgroundColor: '#244a85',
                },
              },
            },
          }}
        >
          <ToggleButton value="question" aria-label="question">
            ❓ Question
          </ToggleButton>
          <ToggleButton value="discussion" aria-label="discussion">
            💬 Discussion
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content Text Area */}
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder={
          postType === 'question'
            ? 'Ask a question about this concept...'
            : 'Start a discussion...'
        }
        value={content}
        onChange={e => setContent(e.target.value)}
        error={!!error}
        helperText={error || `${content.length} characters`}
        disabled={isSubmitting}
        sx={{
          marginBottom: '16px',
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'white',
            '& fieldset': {
              borderColor: '#e1e7f0',
              borderWidth: '2px',
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
          'aria-label': 'post content',
        }}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isSubmitting}
          sx={{
            textTransform: 'none',
            borderColor: '#e1e7f0',
            color: '#6c757d',
            '&:hover': {
              borderColor: '#2c5aa0',
              backgroundColor: 'rgba(44, 90, 160, 0.04)',
            },
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
            '&:disabled': {
              backgroundColor: '#e1e7f0',
            },
          }}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreatePostForm;
