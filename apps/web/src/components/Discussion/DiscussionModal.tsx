'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { DiscussionModalProps, DiscussionState, TabType } from './types';
import { PostList } from './PostList';
import { CreatePostForm } from './CreatePostForm';

export const DiscussionModal: React.FC<DiscussionModalProps> = ({
  conceptId,
  conceptTitle,
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<DiscussionState>({
    posts: [],
    loading: false,
    error: null,
    selectedTab: 'all',
    page: 1,
    hasMore: true,
  });

  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Fetch posts when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, state.selectedTab, conceptId]);

  const fetchPosts = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/concepts/${conceptId}/discuss?tab=${state.selectedTab}&page=${state.page}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        posts: data.posts || [],
        loading: false,
        hasMore: data.posts.length === data.page_size,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: TabType
  ): void => {
    setState(prev => ({
      ...prev,
      selectedTab: newValue,
      page: 1,
      posts: [],
    }));
  };

  const handleCreatePost = async (
    postType: 'question' | 'discussion',
    content: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/concepts/${conceptId}/discuss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_type: postType,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Refresh posts after successful creation
      setShowCreateForm(false);
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const handleLikePost = async (
    postId: string,
    isLiked: boolean
  ): Promise<void> => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              is_liked_by_user: !isLiked,
              like_count: isLiked ? post.like_count - 1 : post.like_count + 1,
            }
          : post
      ),
    }));

    try {
      const url = `/api/discuss/${postId}/like`;
      const response = isLiked
        ? await fetch(url, { method: 'DELETE' })
        : await fetch(url, { method: 'POST' });

      if (!response.ok) {
        // Revert on error
        setState(prev => ({
          ...prev,
          posts: prev.posts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  is_liked_by_user: isLiked,
                  like_count: isLiked
                    ? post.like_count + 1
                    : post.like_count - 1,
                }
              : post
          ),
        }));
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      // Update with server response
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post =>
          post.id === postId ? { ...post, like_count: data.like_count } : post
        ),
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReplyToPost = async (
    postId: string,
    content: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/discuss/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      // Refresh posts to show new reply
      await fetchPosts();
    } catch (error) {
      console.error('Error posting reply:', error);
      throw error;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen
      aria-labelledby="discussion-modal-title"
      aria-describedby="discussion-modal-description"
    >
      <DialogTitle
        id="discussion-modal-title"
        sx={{
          backgroundColor: '#2c5aa0',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ fontSize: '1.2rem', fontWeight: 600 }}
        >
          💬 Discussion: {conceptTitle}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'white',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'white',
          }}
        >
          <Tabs
            value={state.selectedTab}
            onChange={handleTabChange}
            aria-label="discussion tabs"
            sx={{
              '& .MuiTab-root': {
                fontSize: '16px',
                minHeight: '48px',
                textTransform: 'none',
                color: '#6c757d',
              },
              '& .Mui-selected': {
                color: '#2c5aa0',
                fontWeight: 600,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#2c5aa0',
                height: '3px',
              },
            }}
          >
            <Tab label="All" value="all" />
            <Tab label="Questions" value="questions" />
            <Tab label="Discussions" value="discussions" />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f8f9fc',
            padding: '24px',
          }}
        >
          {state.loading && state.posts.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                padding: '48px',
              }}
            >
              <CircularProgress />
            </Box>
          ) : state.error ? (
            <Box sx={{ textAlign: 'center', padding: '48px' }}>
              <Typography color="error">{state.error}</Typography>
            </Box>
          ) : (
            <>
              <CreatePostForm
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                onSubmit={handleCreatePost}
              />

              <PostList
                posts={state.posts}
                onLike={handleLikePost}
                onReply={handleReplyToPost}
                onShowCreateForm={() => setShowCreateForm(true)}
                showCreateButton={!showCreateForm}
              />
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DiscussionModal;
