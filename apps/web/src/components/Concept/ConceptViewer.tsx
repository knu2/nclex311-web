'use client';

import React, { memo, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Lightbulb as LightbulbIcon,
  Notes as NotesIcon,
  Forum as ForumIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
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
    const { data: session } = useSession();

    // Modal states
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);

    // Bookmark states
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkId, setBookmarkId] = useState<string | null>(null);
    const [isLoadingBookmark, setIsLoadingBookmark] = useState(true);
    const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

    // Completion tracking states
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoadingCompletion, setIsLoadingCompletion] = useState(true);
    const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<
      'success' | 'error'
    >('success');

    // Fetch initial completion status
    useEffect(() => {
      const fetchCompletionStatus = async () => {
        if (!session?.user) {
          setIsLoadingCompletion(false);
          return;
        }

        try {
          // Use the direct completion status endpoint
          const response = await fetch(`/api/concepts/${data.slug}/complete`);
          if (response.ok) {
            const { is_completed } = await response.json();
            setIsCompleted(is_completed);
          }
        } catch (error) {
          console.error('Error fetching completion status:', error);
        } finally {
          setIsLoadingCompletion(false);
        }
      };

      fetchCompletionStatus();
    }, [data.slug, session]);

    // Fetch initial bookmark status
    useEffect(() => {
      const fetchBookmarkStatus = async () => {
        if (!session?.user?.id) {
          setIsLoadingBookmark(false);
          return;
        }

        try {
          const response = await fetch(
            `/api/users/${session.user.id}/bookmarks`
          );
          if (response.ok) {
            const {
              bookmarks,
            }: { bookmarks: Array<{ id: string; concept_id: string }> } =
              await response.json();
            const bookmark = bookmarks.find(b => b.concept_id === data.id);
            if (bookmark) {
              setIsBookmarked(true);
              setBookmarkId(bookmark.id);
            }
          }
        } catch (error) {
          console.error('Error fetching bookmark status:', error);
        } finally {
          setIsLoadingBookmark(false);
        }
      };

      fetchBookmarkStatus();
    }, [data.id, session]);

    // Handle mark as complete toggle
    const handleToggleCompletion = async () => {
      if (!session?.user) {
        setSnackbarMessage('Please log in to track your progress');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      setIsTogglingCompletion(true);

      try {
        const method = isCompleted ? 'DELETE' : 'POST';
        const response = await fetch(`/api/concepts/${data.slug}/complete`, {
          method,
        });

        if (response.ok) {
          setIsCompleted(!isCompleted);
          setSnackbarMessage(
            isCompleted
              ? 'Concept unmarked as complete'
              : 'Concept marked as complete! 🎉'
          );
          setSnackbarSeverity('success');
          setSnackbarOpen(true);

          // Dispatch custom event to notify sidebar of completion change
          window.dispatchEvent(new Event('conceptCompletionChanged'));
        } else {
          const errorData = await response.json();
          setSnackbarMessage(
            errorData.message || 'Failed to update completion'
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error toggling completion:', error);
        setSnackbarMessage('An error occurred. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsTogglingCompletion(false);
      }
    };

    // Handle bookmark toggle
    const handleToggleBookmark = async () => {
      if (!session?.user?.id) {
        setSnackbarMessage('Please log in to bookmark concepts');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      setIsTogglingBookmark(true);

      try {
        if (isBookmarked && bookmarkId) {
          // Remove bookmark
          const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setIsBookmarked(false);
            setBookmarkId(null);
            setSnackbarMessage('Bookmark removed');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } else {
            const errorData = await response.json();
            setSnackbarMessage(errorData.error || 'Failed to remove bookmark');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        } else {
          // Add bookmark
          const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concept_id: data.id }),
          });

          if (response.ok) {
            const { bookmark } = await response.json();
            setIsBookmarked(true);
            setBookmarkId(bookmark.id);
            setSnackbarMessage('Concept bookmarked! 🔖');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } else {
            const errorData = await response.json();
            setSnackbarMessage(errorData.error || 'Failed to add bookmark');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        setSnackbarMessage('An error occurred. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsTogglingBookmark(false);
      }
    };

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
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={isCompleted ? 'contained' : 'outlined'}
                startIcon={
                  isLoadingCompletion || isTogglingCompletion ? (
                    <CircularProgress size={16} />
                  ) : isCompleted ? (
                    <CheckCircleIcon />
                  ) : (
                    <UncheckedIcon />
                  )
                }
                onClick={handleToggleCompletion}
                disabled={isLoadingCompletion || isTogglingCompletion}
                sx={{
                  borderColor: isCompleted ? '#00b894' : '#2c5aa0',
                  color: isCompleted ? 'white' : '#2c5aa0',
                  bgcolor: isCompleted ? '#00b894' : 'transparent',
                  '&:hover': {
                    borderColor: isCompleted ? '#00a080' : '#234a85',
                    bgcolor: isCompleted
                      ? '#00a080'
                      : 'rgba(44, 90, 160, 0.04)',
                  },
                  '&.Mui-disabled': {
                    borderColor: '#ccc',
                    color: '#999',
                  },
                }}
              >
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </Button>
              <Button
                variant={isBookmarked ? 'contained' : 'outlined'}
                startIcon={
                  isLoadingBookmark || isTogglingBookmark ? (
                    <CircularProgress size={16} />
                  ) : isBookmarked ? (
                    <BookmarkIcon />
                  ) : (
                    <BookmarkBorderIcon />
                  )
                }
                onClick={handleToggleBookmark}
                disabled={isLoadingBookmark || isTogglingBookmark}
                sx={{
                  borderColor: isBookmarked ? '#ff6b35' : '#2c5aa0',
                  color: isBookmarked ? 'white' : '#2c5aa0',
                  bgcolor: isBookmarked ? '#ff6b35' : 'transparent',
                  '&:hover': {
                    borderColor: isBookmarked ? '#e65e2f' : '#234a85',
                    bgcolor: isBookmarked
                      ? '#e65e2f'
                      : 'rgba(44, 90, 160, 0.04)',
                  },
                  '&.Mui-disabled': {
                    borderColor: '#ccc',
                    color: '#999',
                  },
                }}
              >
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
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

        {/* Snackbar for completion feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
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
