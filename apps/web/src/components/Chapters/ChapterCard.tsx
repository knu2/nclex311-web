'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/navigation';

export interface ChapterCardProps {
  chapter: {
    id: string;
    chapterNumber: number;
    title: string;
    isPremium: boolean;
    conceptCount: number;
    firstConceptSlug: string;
  };
  isPremiumUser: boolean;
  onUpgradeClick?: () => void;
}

/**
 * ChapterCard Component
 * Displays a single chapter card with title, concept count, and premium badge
 * Story 1.5.7: Chapter Grid Component
 */
export function ChapterCard({
  chapter,
  isPremiumUser,
  onUpgradeClick,
}: ChapterCardProps) {
  const router = useRouter();
  const isPremiumLocked = chapter.isPremium && !isPremiumUser;

  const handleClick = () => {
    if (isPremiumLocked) {
      onUpgradeClick?.();
    } else if (chapter.firstConceptSlug) {
      router.push(`/concepts/${chapter.firstConceptSlug}`);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: isPremiumLocked ? 0.7 : 1,
        cursor: isPremiumLocked ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: isPremiumLocked ? 'none' : 'translateY(-4px)',
          boxShadow: isPremiumLocked ? 2 : 6,
        },
      }}
      aria-label={`Chapter ${chapter.chapterNumber}: ${chapter.title}${
        isPremiumLocked ? ' - Premium content, upgrade required' : ''
      }`}
    >
      <CardActionArea
        onClick={handleClick}
        disabled={isPremiumLocked && !onUpgradeClick}
        sx={{ height: '100%' }}
        aria-label={
          isPremiumLocked
            ? `Upgrade to access Chapter ${chapter.chapterNumber}`
            : `Navigate to ${chapter.title}`
        }
      >
        <CardContent sx={{ p: 3, height: '100%' }}>
          {/* Lock Icon for Premium Locked Chapters */}
          {isPremiumLocked && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
              }}
              aria-label="Premium content locked"
            >
              <LockIcon color="warning" fontSize="medium" />
            </Box>
          )}

          {/* Chapter Number */}
          <Typography
            variant="overline"
            component="div"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: 1,
              mb: 1,
            }}
          >
            Chapter {chapter.chapterNumber}
          </Typography>

          {/* Chapter Title */}
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#2c3e50',
              mb: 2,
              pr: isPremiumLocked ? 5 : 0,
            }}
          >
            {chapter.title}
          </Typography>

          {/* Concept Count */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
            aria-label={`${chapter.conceptCount} concepts in this chapter`}
          >
            {chapter.conceptCount}{' '}
            {chapter.conceptCount === 1 ? 'concept' : 'concepts'}
          </Typography>

          {/* Free/Premium Badge */}
          <Box sx={{ mt: 'auto' }}>
            <Chip
              label={chapter.isPremium ? 'Premium' : 'Free'}
              size="small"
              color={chapter.isPremium ? 'primary' : 'success'}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
              aria-label={
                chapter.isPremium
                  ? 'Premium chapter - subscription required'
                  : 'Free chapter - available to all users'
              }
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
