'use client';

/**
 * ProgressDashboard Component
 * Story 1.5.8: Progress Dashboard
 *
 * Displays comprehensive user progress across all chapters with:
 * - Overall progress summary card
 * - Chapter-by-chapter progress with accordions
 * - Animated progress bars
 * - Completed concepts list with links
 * - Milestone messaging
 * - Accessibility features
 */

import React, { memo } from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  Typography,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import type { UserProgress, ChapterProgress } from '@/types/progress';

export interface ProgressDashboardProps {
  progress: UserProgress;
  isLoading?: boolean;
}

/**
 * Get motivational milestone message based on completion percentage
 */
const getMilestoneMessage = (percentage: number): string | null => {
  if (percentage >= 100)
    return "🎉 Congratulations! You've completed all concepts!";
  if (percentage >= 75) return "🌟 Amazing! You're almost there!";
  if (percentage >= 50) return "💪 Great work! You're halfway through!";
  if (percentage >= 25) return "🚀 Keep going! You're making great progress!";
  if (percentage >= 10) return '👍 Nice start! Keep up the momentum!';
  return null;
};

/**
 * ProgressDashboard Component
 */
export const ProgressDashboard: React.FC<ProgressDashboardProps> = memo(
  ({ progress, isLoading = false }) => {
    if (isLoading) {
      return <ProgressDashboardSkeleton />;
    }

    const { overall_progress, chapters } = progress;
    const milestoneMessage = getMilestoneMessage(
      overall_progress.completion_percentage
    );

    return (
      <Box
        sx={{
          maxWidth: 1000,
          mx: 'auto',
          p: { xs: 2, sm: 3 },
        }}
        role="main"
        aria-label="Progress Dashboard"
      >
        {/* Page Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: '#2c3e50',
              fontWeight: 600,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              mb: 1,
            }}
          >
            📊 Your Learning Progress
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#6c757d',
              fontSize: '1rem',
            }}
          >
            Track your mastery of NCLEX 311 concepts
          </Typography>
        </Box>

        {/* Overall Progress Summary Card */}
        <Card
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            border: '2px solid #e1e7f0',
            borderRadius: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
          }}
          role="region"
          aria-label="Overall Progress Summary"
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon sx={{ color: '#2c5aa0', fontSize: '2rem' }} />
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  color: '#2c3e50',
                  fontWeight: 600,
                }}
              >
                Overall Progress
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h3"
                component="span"
                sx={{
                  color: '#2c5aa0',
                  fontWeight: 700,
                  fontSize: { xs: '2rem', sm: '3rem' },
                }}
                aria-label={`${overall_progress.completed_concepts} out of ${overall_progress.total_concepts} concepts completed`}
              >
                {overall_progress.completed_concepts}
              </Typography>
              <Typography
                variant="h4"
                component="span"
                sx={{
                  color: '#6c757d',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                / {overall_progress.total_concepts}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={overall_progress.completion_percentage}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: '#e1e7f0',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #00b894 0%, #00a080 100%)',
                borderRadius: 6,
                transition: 'transform 0.8s ease-in-out',
              },
            }}
            aria-label={`${overall_progress.completion_percentage} percent complete`}
          />

          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: '#6c757d',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            {overall_progress.completion_percentage}% Complete
          </Typography>

          {/* Milestone Message */}
          {milestoneMessage && (
            <Alert
              severity="success"
              icon={<TrendingUpIcon />}
              sx={{
                mt: 3,
                backgroundColor: 'rgba(0, 184, 148, 0.1)',
                border: '2px solid #00b894',
                borderRadius: 1.5,
                '& .MuiAlert-icon': {
                  color: '#00b894',
                },
              }}
            >
              {milestoneMessage}
            </Alert>
          )}
        </Card>

        {/* Chapter Progress Sections */}
        <Box sx={{ mb: 3 }} role="region" aria-label="Chapter Progress List">
          <Typography
            variant="h5"
            component="h2"
            sx={{
              color: '#2c3e50',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Chapter Progress
          </Typography>

          {chapters.map(chapter => (
            <ChapterAccordion key={chapter.chapter_id} chapter={chapter} />
          ))}
        </Box>
      </Box>
    );
  }
);

ProgressDashboard.displayName = 'ProgressDashboard';

/**
 * ChapterAccordion Component
 * Expandable section for each chapter showing progress and completed concepts
 */
interface ChapterAccordionProps {
  chapter: ChapterProgress;
}

const ChapterAccordion: React.FC<ChapterAccordionProps> = memo(
  ({ chapter }) => {
    return (
      <Accordion
        sx={{
          mb: 2,
          border: '2px solid #e1e7f0',
          borderRadius: '8px !important',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            my: 2,
          },
        }}
        aria-label={`Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#2c5aa0' }} />}
          sx={{
            px: 2,
            py: 1,
            '&:hover': {
              backgroundColor: '#f8f9fc',
            },
            '& .MuiAccordionSummary-content': {
              my: 1.5,
            },
            transition: 'background-color 250ms ease-in-out',
          }}
          aria-controls={`chapter-${chapter.chapter_number}-content`}
          id={`chapter-${chapter.chapter_number}-header`}
        >
          <Box sx={{ width: '100%' }}>
            <Typography
              variant="h6"
              sx={{
                color: '#2c3e50',
                fontWeight: 600,
                fontSize: '1.1rem',
                mb: 1,
              }}
            >
              Chapter {chapter.chapter_number}: {chapter.chapter_title}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                pr: 2,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={chapter.completion_percentage}
                sx={{
                  flexGrow: 1,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#e1e7f0',
                  '& .MuiLinearProgress-bar': {
                    background:
                      'linear-gradient(90deg, #00b894 0%, #00a080 100%)',
                    borderRadius: 5,
                    transition: 'transform 0.8s ease-in-out',
                  },
                }}
                aria-label={`${chapter.completion_percentage} percent complete`}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#6c757d',
                  fontSize: '0.875rem',
                  minWidth: 100,
                  textAlign: 'right',
                }}
              >
                {chapter.completed_concept_count}/{chapter.concept_count} -{' '}
                {chapter.completion_percentage}%
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>

        <AccordionDetails
          sx={{
            px: 2,
            py: 2,
            backgroundColor: '#fafbfc',
          }}
        >
          {chapter.completed_concepts.length > 0 ? (
            <>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#6c757d',
                  fontWeight: 600,
                  mb: 1,
                  px: 1,
                }}
              >
                Completed Concepts ({chapter.completed_concepts.length})
              </Typography>
              <List sx={{ py: 0 }}>
                {chapter.completed_concepts.map(concept => (
                  <ListItem
                    key={concept.concept_id}
                    component={Link}
                    href={`/concepts/${concept.concept_slug}`}
                    sx={{
                      py: 1,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: '#e8f4f8',
                      },
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      transition: 'background-color 200ms ease-in-out',
                    }}
                    aria-label={`Go to ${concept.concept_title}`}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon
                        sx={{ color: '#00b894', fontSize: '1.125rem' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={concept.concept_title}
                      primaryTypographyProps={{
                        sx: {
                          color: '#2c5aa0',
                          fontSize: '1rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: '#6c757d',
                fontStyle: 'italic',
                px: 1,
                py: 2,
                textAlign: 'center',
              }}
            >
              No concepts completed yet. Start learning to track your progress!
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    );
  }
);

ChapterAccordion.displayName = 'ChapterAccordion';

/**
 * Loading skeleton for ProgressDashboard
 */
const ProgressDashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mx: 'auto' }} />
      </Box>

      <Card elevation={3} sx={{ p: 3, mb: 4 }}>
        <Skeleton variant="text" width="50%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={12} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="20%" height={20} sx={{ mx: 'auto' }} />
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>
        <Skeleton width="30%" />
      </Typography>

      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={80}
          sx={{ mb: 2, borderRadius: 2 }}
        />
      ))}
    </Box>
  );
};

export default ProgressDashboard;
