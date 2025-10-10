'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import {
  CommentModalProps,
  CommentModalState,
  GetCommentsResponse,
} from './types';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { ErrorState } from './ErrorState';

/**
 * CommentModal Component
 * Main modal for viewing and creating comments on concepts
 * Story 1.5.6 - Simplified commenting system (no roles, no nested replies)
 */
export const CommentModal: React.FC<CommentModalProps> = ({
  conceptSlug,
  conceptTitle,
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<CommentModalState>({
    comments: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: false,
    submitting: false,
  });

  // Get user from session
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id || '';
  const currentUserName = session?.user?.email?.split('@')[0] || 'Current User';

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchComments(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, conceptSlug]);

  const fetchComments = async (page: number): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/concepts/${conceptSlug}/comments?page=${page}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data: GetCommentsResponse = await response.json();

      setState(prev => ({
        ...prev,
        comments:
          page === 1 ? data.comments : [...prev.comments, ...data.comments],
        loading: false,
        page,
        hasMore: data.has_more,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const handleLoadMore = (): void => {
    fetchComments(state.page + 1);
  };

  const handleRetry = (): void => {
    fetchComments(1);
  };

  const handleCreatePost = (): void => {
    // Scroll to form or focus on it
    // For now, form is always visible at top
  };

  const handleSubmit = async (content: string): Promise<void> => {
    setState(prev => ({ ...prev, submitting: true }));

    try {
      const response = await fetch(`/api/concepts/${conceptSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      // Refresh comments after successful creation
      setState(prev => ({ ...prev, submitting: false }));
      await fetchComments(1);
    } catch (error) {
      setState(prev => ({ ...prev, submitting: false }));
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  const handleLike = useCallback(async (commentId: string): Promise<void> => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              is_liked_by_user: true,
              like_count: comment.like_count + 1,
            }
          : comment
      ),
    }));

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert on error
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  is_liked_by_user: false,
                  like_count: comment.like_count - 1,
                }
              : comment
          ),
        }));
        throw new Error('Failed to like comment');
      }

      const data = await response.json();
      // Update with server response
      setState(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, like_count: data.like_count }
            : comment
        ),
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }, []);

  const handleUnlike = useCallback(async (commentId: string): Promise<void> => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              is_liked_by_user: false,
              like_count: comment.like_count - 1,
            }
          : comment
      ),
    }));

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on error
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  is_liked_by_user: true,
                  like_count: comment.like_count + 1,
                }
              : comment
          ),
        }));
        throw new Error('Failed to unlike comment');
      }

      const data = await response.json();
      // Update with server response
      setState(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, like_count: data.like_count }
            : comment
        ),
      }));
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen
      aria-labelledby="comment-modal-title"
      aria-modal="true"
    >
      <DialogTitle
        id="comment-modal-title"
        sx={{
          backgroundColor: '#2c5aa0',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          fontSize: '1.2rem',
          fontWeight: 600,
        }}
      >
        <Box component="span">💬 Discussion: {conceptTitle}</Box>

        <IconButton
          onClick={onClose}
          aria-label="Close modal"
          sx={{
            color: 'white',
            minWidth: '44px',
            minHeight: '44px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: '#f8f9fc',
          padding: '24px',
        }}
      >
        {/* Loading State */}
        {state.loading && state.comments.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px',
              backgroundColor: '#f8f9fc',
            }}
          >
            <CircularProgress />
          </Box>
        ) : state.error ? (
          /* Error State */
          <ErrorState onRetry={handleRetry} onCreatePost={handleCreatePost} />
        ) : (
          /* Success State */
          <>
            <CommentForm
              currentUserName={currentUserName}
              onSubmit={handleSubmit}
              submitting={state.submitting}
            />

            <CommentList
              comments={state.comments}
              currentUserId={currentUserId}
              loading={state.loading}
              hasMore={state.hasMore}
              onLoadMore={handleLoadMore}
              onLike={handleLike}
              onUnlike={handleUnlike}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
