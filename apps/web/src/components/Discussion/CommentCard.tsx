'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  IconButton,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';

import { CommentCardProps, getUserInitials, getRelativeTime } from './types';

/**
 * CommentCard Component
 * Displays individual comment with avatar, user info, like button
 * Story 1.5.6 - AC 4, 6: Comment card with user avatar and like functionality
 */
export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  onLike,
  onUnlike,
}) => {
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const isOwnComment = comment.user_id === currentUserId;
  const userInitials = getUserInitials(comment.user_name);
  const relativeTime = getRelativeTime(comment.created_at);

  const handleLikeToggle = async (): Promise<void> => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (comment.is_liked_by_user) {
        await onUnlike(comment.id);
      } else {
        await onLike(comment.id);
      }
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card
      data-testid={`comment-${comment.id}`}
      sx={{
        backgroundColor: isOwnComment ? '#f8f9fc' : 'white',
        border: '2px solid #e1e7f0',
        borderRadius: '6px',
        marginBottom: '0.75rem',
        transition: 'box-shadow 150ms ease-out',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '0.75rem',
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#2c5aa0',
              width: 40,
              height: 40,
              marginRight: '12px',
              fontSize: '0.875rem',
            }}
            aria-label={`${comment.user_name} avatar`}
          >
            {userInitials}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: '#2c3e50',
                marginBottom: '2px',
              }}
            >
              {comment.user_name}
              {isOwnComment && (
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    marginLeft: '8px',
                    color: '#6c757d',
                    fontWeight: 400,
                  }}
                >
                  (You)
                </Typography>
              )}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#6c757d',
                fontSize: '0.875rem',
              }}
            >
              {relativeTime}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: '#2c3e50',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            marginBottom: '1rem',
          }}
        >
          {comment.content}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconButton
            onClick={handleLikeToggle}
            disabled={isLiking}
            aria-label={
              comment.is_liked_by_user ? 'Unlike comment' : 'Like comment'
            }
            aria-pressed={comment.is_liked_by_user}
            sx={{
              minHeight: '36px',
              minWidth: '36px',
              padding: '6px',
              color: comment.is_liked_by_user ? '#2c5aa0' : 'inherit',
              transition: 'all 150ms ease-out',
              '&:hover': {
                backgroundColor: '#e8f0fe',
              },
            }}
          >
            {comment.is_liked_by_user ? (
              <ThumbUpIcon />
            ) : (
              <ThumbUpOutlinedIcon />
            )}
          </IconButton>

          <Typography
            variant="body2"
            sx={{
              marginLeft: '4px',
              color: '#6c757d',
            }}
            aria-label={`${comment.like_count} ${comment.like_count === 1 ? 'like' : 'likes'}`}
          >
            {comment.like_count}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
