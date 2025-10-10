'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { Post } from './types';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: Post[];
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onReply: (postId: string, content: string) => Promise<void>;
  onShowCreateForm: () => void;
  showCreateButton: boolean;
}

export const PostList: React.FC<PostListProps> = ({
  posts,
  onLike,
  onReply,
  onShowCreateForm,
  showCreateButton,
}) => {
  if (posts.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '2px dashed #e1e7f0',
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: '#6c757d', marginBottom: '16px' }}
        >
          No posts yet
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#6c757d', marginBottom: '24px' }}
        >
          Be the first to start a discussion!
        </Typography>
        {showCreateButton && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onShowCreateForm}
            sx={{
              textTransform: 'none',
              backgroundColor: '#2c5aa0',
              '&:hover': {
                backgroundColor: '#244a85',
              },
            }}
          >
            Create Post
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Create Post Button */}
      {showCreateButton && (
        <Box
          sx={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onShowCreateForm}
            sx={{
              textTransform: 'none',
              backgroundColor: '#2c5aa0',
              '&:hover': {
                backgroundColor: '#244a85',
              },
            }}
          >
            New Post
          </Button>
        </Box>
      )}

      {/* Posts List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onLike={onLike}
            onReply={onReply}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PostList;
