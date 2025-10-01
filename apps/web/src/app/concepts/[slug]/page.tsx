'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  CheckCircle as CompleteIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Quiz } from '@/components/Quiz';
import { Paywall } from '@/components/Paywall';
import { MarkdownContent } from '@/components/MarkdownContent';
import { ConceptWithQuestions } from '@/lib/db/services';

interface ConceptPageState {
  concept: ConceptWithQuestions | null;
  loading: boolean;
  error: string | null;
  showPaywall: boolean;
  chapterNumber?: number;
  isBookmarked: boolean;
  isCompleted: boolean;
}

/**
 * Concept viewer page following front-end spec user flow:
 * - Free Content (Ch 1-4): Display Concept & Quiz Viewer with full content
 * - Premium Content (Ch 5-8): Display 'Premium Content' message → Show 'Upgrade' button → Redirect to Subscription Page
 */
export default function ConceptPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [state, setState] = useState<ConceptPageState>({
    concept: null,
    loading: true,
    error: null,
    showPaywall: false,
    isBookmarked: false,
    isCompleted: false,
  });

  // Fetch concept data
  useEffect(() => {
    if (!slug) return;

    const fetchConcept = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch(`/api/concepts/${slug}`);
        const result = await response.json();

        if (response.status === 403 && result.premiumRequired) {
          // Following user flow: Premium Content → Display 'Premium Content' message
          setState(prev => ({
            ...prev,
            loading: false,
            showPaywall: true,
            chapterNumber: result.chapterNumber,
          }));
          return;
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch concept');
        }

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            concept: result.data,
            loading: false,
            showPaywall: false,
          }));
        } else {
          throw new Error(result.error || 'Failed to load concept');
        }
      } catch (err) {
        console.error('Error fetching concept:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load concept',
        }));
      }
    };

    fetchConcept();
  }, [slug]);

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  // Following user flow: Show 'Upgrade' button → Redirect to Subscription Page
  const handleUpgrade = () => {
    // TODO: Implement subscription/payment flow
    // For now, just show alert
    alert(
      'Upgrade functionality will be implemented with Maya Business payment integration.'
    );
  };

  const handleBookmarkToggle = () => {
    // TODO: Implement bookmark functionality in future story
    setState(prev => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
    }));
  };

  const handleMarkComplete = () => {
    // TODO: Implement progress tracking in future story
    setState(prev => ({
      ...prev,
      isCompleted: !prev.isCompleted,
    }));
  };

  const handleQuizComplete = () => {
    // Following user flow: "Option to go to Next Concept or back to List"
    // For now, mark as complete and show completion message
    handleMarkComplete();
  };

  if (state.loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={6}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading concept...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">{state.error}</Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleGoBack}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  // Following user flow: Premium Content → Paywall
  if (state.showPaywall) {
    return (
      <Container maxWidth="lg">
        <Paywall
          chapterNumber={state.chapterNumber}
          onUpgrade={handleUpgrade}
          onGoBack={handleGoBack}
        />
      </Container>
    );
  }

  if (!state.concept) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">Concept not found.</Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleGoBack}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const { concept } = state;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleGoBack}
          sx={{ mb: 2 }}
        >
          Back to Chapters
        </Button>

        {/* Breadcrumbs - Following front-end spec */}
        <Breadcrumbs separator="›" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/dashboard"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary">
            Chapter {concept.chapter.chapterNumber}: {concept.chapter.title}
          </Typography>
          <Typography color="text.primary" fontWeight={500}>
            {concept.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Concept Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h1" component="h1" sx={{ mr: 2 }}>
                {concept.title}
              </Typography>
              <Chip
                label={concept.isPremium ? 'Premium' : 'Free'}
                color={concept.isPremium ? 'warning' : 'success'}
                size="small"
                variant="filled"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Chapter {concept.chapter.chapterNumber} • Concept{' '}
              {concept.conceptNumber}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleBookmarkToggle}
              color={state.isBookmarked ? 'secondary' : 'default'}
              aria-label={
                state.isBookmarked ? 'Remove bookmark' : 'Add bookmark'
              }
            >
              {state.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>

            <Button
              variant={state.isCompleted ? 'contained' : 'outlined'}
              startIcon={<CompleteIcon />}
              onClick={handleMarkComplete}
              color={state.isCompleted ? 'success' : 'primary'}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              {state.isCompleted ? 'Completed' : 'Mark Complete'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Concept Content - Following front-end spec layout */}
        <Box
          sx={{
            fontSize: '1.1rem',
            lineHeight: 1.7,
          }}
        >
          <MarkdownContent content={concept.content} variant="body1" />
        </Box>
      </Paper>

      {/* Quiz Section - Following user flow: User reads concept → starts quiz */}
      {concept.questions && concept.questions.length > 0 && (
        <Box>
          <Typography variant="h2" component="h2" gutterBottom>
            Practice Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Test your understanding of this concept with{' '}
            {concept.questions.length} practice question
            {concept.questions.length !== 1 ? 's' : ''}.
          </Typography>

          <Quiz questions={concept.questions} onComplete={handleQuizComplete} />
        </Box>
      )}

      {/* Completion Message */}
      {state.isCompleted && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            🎉 Great job! You&apos;ve completed this concept.
            {concept.questions.length > 0 &&
              ' Keep practicing to reinforce your learning.'}
          </Typography>
        </Alert>
      )}

      {/* Navigation - Following user flow: "Option to go to Next Concept or back to List" */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="outlined"
          onClick={handleGoBack}
          sx={{
            textTransform: 'none',
            px: 4,
          }}
        >
          Back to All Concepts
        </Button>
      </Box>
    </Container>
  );
}
