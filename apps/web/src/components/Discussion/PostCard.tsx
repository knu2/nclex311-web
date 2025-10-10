'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  Chip,
  Box,
  Collapse,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ForumIcon from '@mui/icons-material/Forum';
import PushPinIcon from '@mui/icons-material/PushPin';

import { Post } from './types';
import { ReplyForm } from './ReplyForm';
import { ReplyList } from './ReplyList';

interface PostCardProps {
  post: Post;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onReply: (postId: string, content: string) => Promise<void>;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onReply,
}) => {
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const isInstructor = post.user_role === 'instructor';

  const handleLikeClick = async (): Promise<void> => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post.id, post.is_liked_by_user);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReplySubmit = async (content: string): Promise<void> => {
    await onReply(post.id, content);
    setShowReplyForm(false);
  };

  const getPostTypeIcon = (): React.ReactNode => {
    if (post.post_type === 'question') {
      return <HelpOutlineIcon sx={{ color: '#2c5aa0', fontSize: '20px' }} />;
    }
    return <ForumIcon sx={{ color: '#6c757d', fontSize: '20px' }} />;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      sx={{
        backgroundColor: isInstructor ? 'rgba(0, 184, 148, 0.08)' : 'white',
        border: isInstructor ? '2px solid #00b894' : '2px solid #e1e7f0',
        borderLeft: isInstructor ? '4px solid #00b894' : '2px solid #e1e7f0',
        borderRadius: '6px',
        transition: 'all 150ms ease-out',
        '&:hover': {
          backgroundColor: isInstructor ? 'rgba(0, 184, 148, 0.12)' : '#f8f9fc',
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            sx={{
              backgroundColor: isInstructor ? '#00b894' : '#2c5aa0',
              width: 40,
              height: 40,
            }}
          >
            {post.user_name.charAt(0).toUpperCase()}
          </Avatar>
        }
        title={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: '#2c3e50',
              }}
            >
              {post.user_name}
            </Typography>
            {isInstructor && (
              <Chip
                label="Instructor"
                size="small"
                sx={{
                  backgroundColor: '#00b894',
                  color: 'white',
                  fontWeight: 600,
                  height: '20px',
                  fontSize: '0.75rem',
                }}
              />
            )}
            {post.is_pinned && (
              <Chip
                icon={<PushPinIcon sx={{ fontSize: '14px' }} />}
                label="Pinned"
                size="small"
                sx={{
                  backgroundColor: '#ffeaa7',
                  color: '#2c3e50',
                  fontWeight: 600,
                  height: '20px',
                  fontSize: '0.75rem',
                }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {getPostTypeIcon()}
              <Typography
                variant="caption"
                sx={{
                  color: '#6c757d',
                  textTransform: 'capitalize',
                }}
              >
                {post.post_type}
              </Typography>
            </Box>
          </Box>
        }
        subheader={
          <Typography
            variant="caption"
            sx={{ color: '#6c757d', fontSize: '14px' }}
          >
            {formatTimestamp(post.created_at)}
          </Typography>
        }
        sx={{ padding: '16px 16px 8px 16px' }}
      />

      <CardContent sx={{ padding: '0 16px 8px 16px' }}>
        <Typography
          variant="body1"
          sx={{
            color: '#2c3e50',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {post.content}
        </Typography>
      </CardContent>

      <CardActions
        sx={{ padding: '8px 16px 16px 16px', display: 'flex', gap: '8px' }}
      >
        <Button
          size="small"
          startIcon={
            post.is_liked_by_user ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />
          }
          onClick={handleLikeClick}
          disabled={isLiking}
          aria-label={post.is_liked_by_user ? 'unlike post' : 'like post'}
          sx={{
            textTransform: 'none',
            color: post.is_liked_by_user ? '#2c5aa0' : '#6c757d',
            minHeight: '36px',
            borderRadius: '4px',
            padding: '6px 12px',
            '&:hover': {
              backgroundColor: 'rgba(44, 90, 160, 0.08)',
            },
            transition: 'all 150ms ease-out',
          }}
        >
          {post.like_count} {post.like_count === 1 ? 'Like' : 'Likes'}
        </Button>

        <Button
          size="small"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => setShowReplyForm(!showReplyForm)}
          aria-label="reply to post"
          sx={{
            textTransform: 'none',
            color: '#6c757d',
            minHeight: '36px',
            borderRadius: '4px',
            padding: '6px 12px',
            '&:hover': {
              backgroundColor: 'rgba(44, 90, 160, 0.08)',
            },
          }}
        >
          {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
        </Button>
      </CardActions>

      {/* Reply Form */}
      <Collapse in={showReplyForm}>
        <Box sx={{ padding: '0 16px 16px 16px' }}>
          <ReplyForm
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyForm(false)}
          />
        </Box>
      </Collapse>

      {/* Replies List */}
      {post.replies && post.replies.length > 0 && (
        <Box sx={{ padding: '0 16px 16px 16px' }}>
          <ReplyList replies={post.replies} />
        </Box>
      )}
    </Card>
  );
};

export default PostCard;
