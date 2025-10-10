'use client';

import React from 'react';
import { Box, Avatar, Typography, Chip, Divider } from '@mui/material';
import { Reply } from './types';

interface ReplyListProps {
  replies: Reply[];
}

export const ReplyList: React.FC<ReplyListProps> = ({ replies }) => {
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

  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <Box>
      <Divider sx={{ marginBottom: '12px' }} />
      <Typography
        variant="subtitle2"
        sx={{
          color: '#6c757d',
          marginBottom: '12px',
          fontWeight: 600,
        }}
      >
        Replies ({replies.length})
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {replies.map(reply => {
          const isInstructor = reply.user_role === 'instructor';

          return (
            <Box
              key={reply.id}
              sx={{
                paddingLeft: '16px',
                borderLeft: '3px solid #e1e7f0',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            >
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <Avatar
                  sx={{
                    backgroundColor: isInstructor ? '#00b894' : '#2c5aa0',
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem',
                  }}
                >
                  {reply.user_name.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#2c3e50',
                      }}
                    >
                      {reply.user_name}
                    </Typography>

                    {isInstructor && (
                      <Chip
                        label="Instructor"
                        size="small"
                        sx={{
                          backgroundColor: '#00b894',
                          color: 'white',
                          fontWeight: 600,
                          height: '18px',
                          fontSize: '0.65rem',
                        }}
                      />
                    )}

                    <Typography
                      variant="caption"
                      sx={{ color: '#6c757d', fontSize: '12px' }}
                    >
                      {formatTimestamp(reply.created_at)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#2c3e50',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {reply.content}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReplyList;
