'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import { Psychology as BrainIcon } from '@mui/icons-material';
import { MarkdownContent } from '../MarkdownContent';
import { MultipleChoice } from './MultipleChoice';
import { SelectAllThatApply } from './SelectAllThatApply';
import { FillInBlank } from './FillInBlank';
import { MatrixQuestion } from './MatrixQuestion';
import type {
  Question,
  AnswerState,
  QuizState,
  InlineQuizProps,
} from './types';

/**
 * InlineQuiz Component
 * Displays all quiz questions inline below concept content
 * Features: immediate feedback, state persistence, retry functionality, accessibility
 * Story 1.5.4: Inline Quiz Interaction
 */
export const InlineQuiz: React.FC<InlineQuizProps> = memo(
  ({ questions, conceptId, onAllQuestionsAnswered }) => {
    // Initialize state from localStorage if available
    const [quizState, setQuizState] = useState<QuizState>(() => {
      if (typeof window === 'undefined') return {};

      const savedState = localStorage.getItem(`nclex_quiz_state_${conceptId}`);
      if (savedState) {
        try {
          return JSON.parse(savedState);
        } catch (error) {
          console.error('Failed to parse saved quiz state:', error);
          return {};
        }
      }
      return {};
    });

    // Persist state to localStorage whenever it changes
    useEffect(() => {
      if (typeof window === 'undefined') return;

      try {
        localStorage.setItem(
          `nclex_quiz_state_${conceptId}`,
          JSON.stringify(quizState)
        );
      } catch (error) {
        console.error('Failed to save quiz state:', error);
      }
    }, [quizState, conceptId]);

    // Check if all questions are answered
    useEffect(() => {
      const allAnswered = questions.every(q => {
        const state = quizState[q.id];
        return state?.isSubmitted && state?.isCorrect;
      });

      if (allAnswered && questions.length > 0) {
        onAllQuestionsAnswered?.();
      }
    }, [quizState, questions, onAllQuestionsAnswered]);

    const handleAnswerChange = useCallback(
      (
        questionId: string,
        answer: string | string[] | Record<string, string>
      ) => {
        setQuizState(prev => ({
          ...prev,
          [questionId]: {
            ...(prev[questionId] || {
              isSubmitted: false,
              isCorrect: null,
              showRationale: false,
              retryCount: 0,
            }),
            selectedAnswer: answer,
          },
        }));
      },
      []
    );

    const checkAnswer = useCallback(
      (
        question: Question,
        userAnswer: string | string[] | Record<string, string>
      ): boolean => {
        switch (question.type) {
          case 'MULTIPLE_CHOICE': {
            const correctOption = question.options.find(opt => opt.isCorrect);
            return userAnswer === correctOption?.id;
          }

          case 'SELECT_ALL_THAT_APPLY': {
            const correctOptionIds = question.options
              .filter(opt => opt.isCorrect)
              .map(opt => opt.id)
              .sort();
            const userAnswerArray = (userAnswer as string[]).sort();

            return (
              correctOptionIds.length === userAnswerArray.length &&
              correctOptionIds.every(
                (id, index) => id === userAnswerArray[index]
              )
            );
          }

          case 'FILL_IN_THE_BLANK': {
            const correctAnswers = question.correctAnswer
              .split('|')
              .map(ans => ans.trim().toLowerCase());
            const normalizedAnswer = (userAnswer as string)
              .trim()
              .toLowerCase();
            return correctAnswers.includes(normalizedAnswer);
          }

          case 'MATRIX_GRID': {
            const correctAnswers = JSON.parse(question.correctAnswer);
            const userAnswers = userAnswer as Record<string, string>;

            return Object.keys(correctAnswers).every(
              key => correctAnswers[key] === userAnswers[key]
            );
          }

          default:
            return false;
        }
      },
      []
    );

    const handleSubmit = useCallback(
      async (questionId: string) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        const currentState = quizState[questionId];
        if (!currentState?.selectedAnswer) return;

        const isCorrect = checkAnswer(question, currentState.selectedAnswer);

        // Optimistic UI update
        setQuizState(prev => ({
          ...prev,
          [questionId]: {
            ...currentState,
            isSubmitted: true,
            isCorrect,
            showRationale: true,
          },
        }));

        // Background API call (non-blocking)
        try {
          const response = await fetch(`/api/questions/${questionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              answer: currentState.selectedAnswer,
              is_correct: isCorrect,
            }),
          });

          if (!response.ok) {
            console.error('Failed to submit answer to API');
          }
        } catch (error) {
          console.error('Error submitting answer:', error);
          // Continue with optimistic update even if API fails
        }
      },
      [questions, quizState, checkAnswer]
    );

    const handleRetry = useCallback((questionId: string) => {
      setQuizState(prev => {
        const currentState = prev[questionId];
        return {
          ...prev,
          [questionId]: {
            selectedAnswer: '',
            isSubmitted: false,
            isCorrect: null,
            showRationale: false,
            retryCount: (currentState?.retryCount || 0) + 1,
          },
        };
      });
    }, []);

    const isAnswerSelected = (questionId: string): boolean => {
      const state = quizState[questionId];
      if (!state?.selectedAnswer) return false;

      if (typeof state.selectedAnswer === 'string') {
        return state.selectedAnswer.length > 0;
      } else if (Array.isArray(state.selectedAnswer)) {
        return state.selectedAnswer.length > 0;
      } else if (typeof state.selectedAnswer === 'object') {
        return Object.keys(state.selectedAnswer).length > 0;
      }

      return false;
    };

    if (!questions || questions.length === 0) {
      return null;
    }

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
            borderLeft: '4px solid #2c5aa0',
            borderRadius: 2,
          }}
        >
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BrainIcon sx={{ color: '#2c5aa0', fontSize: 28, mr: 1 }} />
            <Typography
              variant="h6"
              component="h2"
              sx={{
                color: '#2c5aa0',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              🧠 ANSWER THIS
            </Typography>
            <Chip
              label={`${questions.length} Question${questions.length > 1 ? 's' : ''}`}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Questions */}
          {questions.map((question, index) => {
            const answerState: AnswerState = quizState[question.id] || {
              selectedAnswer:
                question.type === 'SELECT_ALL_THAT_APPLY' ? [] : '',
              isSubmitted: false,
              isCorrect: null,
              showRationale: false,
              retryCount: 0,
            };

            const disabled = answerState.isSubmitted;
            const canSubmit = isAnswerSelected(question.id) && !disabled;

            return (
              <Box
                key={question.id}
                sx={{
                  mb: 4,
                  pb: 4,
                  borderBottom:
                    index < questions.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
                role="region"
                aria-labelledby={`question-${index + 1}-text`}
              >
                {/* Question Number and Text */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#2c5aa0',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Question {index + 1}
                  </Typography>
                  <Box
                    id={`question-${index + 1}-text`}
                    sx={{
                      fontSize: '1.05rem',
                      lineHeight: 1.6,
                      mb: 2,
                    }}
                  >
                    <MarkdownContent content={question.text} variant="body1" />
                  </Box>
                </Box>

                {/* Question Component based on type */}
                {question.type === 'MULTIPLE_CHOICE' && (
                  <MultipleChoice
                    question={question}
                    answerState={answerState}
                    onAnswerChange={answer =>
                      handleAnswerChange(question.id, answer)
                    }
                    disabled={disabled}
                  />
                )}

                {question.type === 'SELECT_ALL_THAT_APPLY' && (
                  <SelectAllThatApply
                    question={question}
                    answerState={answerState}
                    onAnswerChange={answer =>
                      handleAnswerChange(question.id, answer)
                    }
                    disabled={disabled}
                  />
                )}

                {question.type === 'FILL_IN_THE_BLANK' && (
                  <FillInBlank
                    question={question}
                    answerState={answerState}
                    onAnswerChange={answer =>
                      handleAnswerChange(question.id, answer)
                    }
                    disabled={disabled}
                  />
                )}

                {question.type === 'MATRIX_GRID' && (
                  <MatrixQuestion
                    question={question}
                    answerState={answerState}
                    onAnswerChange={answer =>
                      handleAnswerChange(question.id, answer)
                    }
                    disabled={disabled}
                  />
                )}

                {/* Submit Button */}
                {!answerState.isSubmitted && (
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => handleSubmit(question.id)}
                      disabled={!canSubmit}
                      sx={{
                        minWidth: 140,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: '#2c5aa0',
                        '&:hover': {
                          backgroundColor: '#234a87',
                        },
                      }}
                      aria-label="Submit answer"
                    >
                      Submit Answer
                    </Button>
                  </Box>
                )}

                {/* Feedback */}
                {answerState.showRationale && (
                  <Box
                    sx={{ mt: 3 }}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {/* Correct/Incorrect Alert */}
                    <Alert
                      severity={answerState.isCorrect ? 'success' : 'error'}
                      sx={{
                        mb: 2,
                        animation: 'fadeIn 0.25s ease-in-out',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(-10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {answerState.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </Typography>
                    </Alert>

                    {/* Rationale */}
                    {question.rationale && (
                      <Paper
                        sx={{
                          p: 3,
                          backgroundColor: '#f8f9fc',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 2,
                          animation: 'expandIn 0.25s ease-in-out',
                          '@keyframes expandIn': {
                            from: { opacity: 0, maxHeight: 0 },
                            to: { opacity: 1, maxHeight: 500 },
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          gutterBottom
                          sx={{ color: '#2c3e50' }}
                        >
                          📋 Rationale
                        </Typography>
                        <Box sx={{ lineHeight: 1.6 }}>
                          <MarkdownContent
                            content={question.rationale}
                            variant="body2"
                          />
                        </Box>
                      </Paper>
                    )}

                    {/* Try Again Button */}
                    <Button
                      variant="outlined"
                      onClick={() => handleRetry(question.id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: '#2c5aa0',
                        color: '#2c5aa0',
                        '&:hover': {
                          borderColor: '#234a87',
                          backgroundColor: 'rgba(44, 90, 160, 0.04)',
                        },
                      }}
                      aria-label="Try again"
                    >
                      Try Again
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })}
        </Paper>
      </Box>
    );
  }
);

InlineQuiz.displayName = 'InlineQuiz';

export default InlineQuiz;
