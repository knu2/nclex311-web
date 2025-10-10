'use client';

import React from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

import { CommentListProps } from './types';
import { CommentCard } from './CommentCard';

/**
 * CommentList Component
 * Displays list of comments with pagination
 * Story 1.5.6 - AC 3, 11: Comment list with empty state and load more
 */
export const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
  onLike,
  onUnlike,
}) => {
  // Empty state
  if (comments.length === 0 && !loading) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '2px dashed #e1e7f0',
          margin: '16px 0',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#6c757d',
            marginBottom: 1,
          }}
        >
          No comments yet
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6c757d',
          }}
        >
          Be the first to share your thoughts on this concept!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        marginTop: '1rem',
      }}
    >
      {/* Comment count */}
      <Typography
        variant="body2"
        sx={{
          color: '#6c757d',
          marginBottom: '1rem',
        }}
        aria-live="polite"
      >
        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </Typography>

      {/* Comment cards */}
      <Box>
        {comments.map(comment => (
          <CommentCard
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onLike={onLike}
            onUnlike={onUnlike}
          />
        ))}
      </Box>

      {/* Load More button */}
      {hasMore && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem',
          }}
        >
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loading}
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
            {loading ? (
              <>
                <CircularProgress size={16} sx={{ marginRight: '8px' }} />
                Loading...
              </>
            ) : (
              'Load More Comments'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};
