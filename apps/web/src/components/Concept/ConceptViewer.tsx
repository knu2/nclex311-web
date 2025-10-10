'use client';

import React, { memo, useState } from 'react';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Lightbulb as LightbulbIcon,
  Notes as NotesIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';
import { MarkdownContent } from '../MarkdownContent';
import { InlineQuiz } from '../Quiz/InlineQuiz';
import { NotesModal } from '../Notes/NotesModal';
import { CommentModal } from '../Discussion';
import type { Question } from '../Quiz/types';

// TypeScript Interfaces
export interface ConceptViewerProps {
  initialConcept: ConceptData; // Pass server-fetched data directly
}

export interface ConceptData {
  id: string;
  title: string;
  slug: string;
  conceptNumber: number;
  content: string;
  keyPoints: string | null;
  reference: string | null;
  chapterId: string;
  isPremium: boolean;
  questions: LegacyQuestion[];
  chapter: {
    id: string;
    title: string;
    chapterNumber: number;
    slug: string;
  };
}

// Deprecated: Use Question from Quiz/types instead
// Keeping for backwards compatibility during migration
interface LegacyQuestion {
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
  orderIndex?: number;
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
 * - Server-side data fetching (no client-side API calls)
 * - Freemium access control support (handled server-side)
 *
 * Story 1.5.3.5 Fix: Refactored to accept server-fetched data as prop
 * to eliminate redundant API calls and improve performance.
 */
export const ConceptViewer: React.FC<ConceptViewerProps> = memo(
  ({ initialConcept }) => {
    // Use server-fetched data directly - no client-side fetching needed
    const data = initialConcept;

    // Modal states
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);

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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<NotesIcon />}
                onClick={() => setIsNotesOpen(true)}
                sx={{
                  borderColor: '#2c5aa0',
                  color: '#2c5aa0',
                  '&:hover': {
                    borderColor: '#234a85',
                    bgcolor: 'rgba(44, 90, 160, 0.04)',
                  },
                }}
              >
                Notes
              </Button>
              <Button
                variant="outlined"
                startIcon={<ForumIcon />}
                onClick={() => setIsDiscussionOpen(true)}
                sx={{
                  borderColor: '#2c5aa0',
                  color: '#2c5aa0',
                  '&:hover': {
                    borderColor: '#234a85',
                    bgcolor: 'rgba(44, 90, 160, 0.04)',
                  },
                }}
              >
                Discussion
              </Button>
            </Box>
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

        {/* Inline Quiz Section */}
        {data.questions.length > 0 && (
          <InlineQuiz
            questions={transformToQuizQuestions(data.questions)}
            conceptId={data.id}
            conceptKeyPoints={data.keyPoints}
            conceptReference={data.reference}
          />
        )}

        {/* Notes Modal */}
        <NotesModal
          conceptSlug={data.slug}
          conceptTitle={data.title}
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
        />

        {/* Discussion Modal */}
        <CommentModal
          conceptSlug={data.slug}
          conceptTitle={data.title}
          isOpen={isDiscussionOpen}
          onClose={() => setIsDiscussionOpen(false)}
        />
      </Box>
    );
  }
);

/**
 * Transform legacy question format to Quiz question format
 */
function transformToQuizQuestions(
  legacyQuestions: LegacyQuestion[]
): Question[] {
  return legacyQuestions.map(q => ({
    id: q.id,
    type: q.type as Question['type'],
    text: q.text,
    options: q.options.map((opt, idx) => ({
      ...opt,
      orderIndex: opt.orderIndex ?? idx,
    })),
    correctAnswer: q.options.find(opt => opt.isCorrect)?.id || '',
    rationale: q.rationale,
  }));
}

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
