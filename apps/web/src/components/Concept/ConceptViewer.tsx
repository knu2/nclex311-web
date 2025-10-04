'use client';

import React, { useState, useEffect, memo } from 'react';
import { Box, Paper, Typography, Skeleton, Alert, Chip } from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { MarkdownContent } from '../MarkdownContent';

// TypeScript Interfaces
export interface ConceptViewerProps {
  conceptSlug: string;
}

interface ConceptData {
  id: string;
  title: string;
  slug: string;
  conceptNumber: number;
  content: string;
  chapterId: string;
  isPremium: boolean;
  questions: Question[];
  chapter: {
    id: string;
    title: string;
    chapterNumber: number;
    slug: string;
  };
}

interface Question {
  id: string;
  text: string;
  type: string;
  rationale: string | null;
  options: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ConceptViewerState {
  data: ConceptData | null;
  loading: boolean;
  error: string | null;
}

/**
 * ConceptViewer Component
 * Displays concept content with markdown rendering, images, and key points
 *
 * Features:
 * - Markdown content rendering with proper formatting
 * - Lazy-loaded responsive images
 * - Key points display section
 * - Visual arrow separator between READ THIS and quiz sections
 * - Loading and error states
 * - Freemium access control support
 */
export const ConceptViewer: React.FC<ConceptViewerProps> = memo(
  ({ conceptSlug }) => {
    const [state, setState] = useState<ConceptViewerState>({
      data: null,
      loading: true,
      error: null,
    });

    useEffect(() => {
      const fetchConceptData = async () => {
        try {
          setState(prev => ({ ...prev, loading: true, error: null }));

          const response = await fetch(`/api/concepts/${conceptSlug}`);

          if (!response.ok) {
            const errorData = await response.json();

            if (response.status === 403) {
              setState({
                data: null,
                loading: false,
                error: errorData.message || 'Premium access required',
              });
              return;
            }

            if (response.status === 404) {
              setState({
                data: null,
                loading: false,
                error: 'Concept not found',
              });
              return;
            }

            throw new Error(errorData.message || 'Failed to load concept');
          }

          const result = await response.json();

          if (!result.success || !result.data) {
            throw new Error('Invalid response format');
          }

          setState({
            data: result.data,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Failed to fetch concept:', error);
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
          });
        }
      };

      fetchConceptData();
    }, [conceptSlug]);

    // Loading state
    if (state.loading) {
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={300} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Box>
      );
    }

    // Error state
    if (state.error) {
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        </Box>
      );
    }

    // No data state
    if (!state.data) {
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Alert severity="info">No concept data available</Alert>
        </Box>
      );
    }

    const { data } = state;

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        {/* READ THIS Section */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            background: 'linear-gradient(135deg, #fff8f3 0%, #fef7f0 100%)',
            borderLeft: '4px solid #ff6b35',
            borderRadius: 2,
          }}
        >
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                color: '#ff6b35',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              📖 READ THIS
            </Typography>
            <Chip
              label={`Concept ${data.conceptNumber}`}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>

          {/* Concept Title */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              color: '#2c3e50',
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              mb: 3,
            }}
          >
            {data.title}
          </Typography>

          {/* Key Points Section - Extract from content if present */}
          {data.content.includes('Key Points:') && (
            <KeyPointsSection content={data.content} />
          )}

          {/* Main Content */}
          <Box
            sx={{
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                my: 2,
                borderRadius: 1,
                loading: 'lazy',
              },
              '& p': {
                lineHeight: 1.6,
                mb: 2,
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                mt: 3,
                mb: 2,
                color: '#2c5aa0',
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2,
              },
              '& li': {
                mb: 1,
              },
              '& code': {
                backgroundColor: '#f5f5f5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              },
              '& pre': {
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                mb: 2,
              },
            }}
          >
            <MarkdownContent content={data.content} variant="body1" />
          </Box>
        </Paper>

        {/* Visual Arrow Separator */}
        {data.questions.length > 0 && <SectionSeparator />}
      </Box>
    );
  }
);

ConceptViewer.displayName = 'ConceptViewer';

/**
 * KeyPointsSection Component
 * Extracts and displays key points from content
 */
const KeyPointsSection: React.FC<{ content: string }> = memo(({ content }) => {
  // Extract key points section if it exists
  const keyPointsMatch = content.match(
    /Key Points?:?\s*([\s\S]*?)(?=\n\n[A-Z]|\n\n#|$)/i
  );

  if (!keyPointsMatch) {
    return null;
  }

  const keyPointsText = keyPointsMatch[1].trim();

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        backgroundColor: '#f0f7ff',
        borderRadius: 2,
        borderLeft: '4px solid #2c5aa0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <LightbulbIcon sx={{ color: '#2c5aa0', mr: 1, fontSize: '1.2rem' }} />
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{
            color: '#2c5aa0',
            fontWeight: 700,
          }}
        >
          Key Points
        </Typography>
      </Box>
      <Box sx={{ pl: 1 }}>
        <MarkdownContent content={keyPointsText} variant="body2" />
      </Box>
    </Box>
  );
});

KeyPointsSection.displayName = 'KeyPointsSection';

/**
 * SectionSeparator Component
 * Visual separator between READ THIS and ANSWER THIS sections
 */
const SectionSeparator: React.FC = memo(() => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        my: 4,
      }}
    >
      {/* Gradient line */}
      <Box
        sx={{
          width: 4,
          height: 40,
          background: 'linear-gradient(180deg, #ff6b35 0%, #2c5aa0 100%)',
          borderRadius: 2,
          mb: 1,
        }}
      />

      {/* Arrow icon */}
      <ArrowDownIcon
        sx={{
          fontSize: 40,
          color: '#2c5aa0',
          mb: 1,
        }}
      />

      {/* Label */}
      <Chip
        label="Test your knowledge!"
        sx={{
          backgroundColor: '#2c5aa0',
          color: 'white',
          fontWeight: 600,
          px: 2,
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: '#234a87',
          },
        }}
      />

      {/* Bottom gradient line */}
      <Box
        sx={{
          width: 4,
          height: 40,
          background: 'linear-gradient(180deg, #2c5aa0 0%, #ff6b35 100%)',
          borderRadius: 2,
          mt: 1,
        }}
      />
    </Box>
  );
});

SectionSeparator.displayName = 'SectionSeparator';

export default ConceptViewer;
