'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Button,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { QuestionWithOptions } from '@/lib/db/services';

interface QuizProps {
  questions: QuestionWithOptions[];
  onComplete?: () => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string[]>; // questionId -> selected option ids
  submitted: Record<string, boolean>; // questionId -> submitted
  showFeedback: Record<string, boolean>; // questionId -> show feedback
}

/**
 * Quiz component following the front-end spec user flow:
 * User reads concept → starts quiz → answers questions → gets immediate feedback → sees rationale
 */
export const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    submitted: {},
    showFeedback: {},
  });

  if (!questions || questions.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No practice questions available for this concept.
        </Typography>
      </Alert>
    );
  }

  const currentQuestion = questions[state.currentQuestionIndex];
  const questionId = currentQuestion.id;
  const userAnswer = state.answers[questionId] || [];
  const isSubmitted = state.submitted[questionId] || false;
  const showFeedback = state.showFeedback[questionId] || false;

  const handleAnswerChange = (optionId: string, checked: boolean = true) => {
    if (isSubmitted) return; // Don't allow changes after submission

    setState(prev => {
      const currentAnswers = prev.answers[questionId] || [];
      let newAnswers: string[];

      if (currentQuestion.type === 'SELECT_ALL_THAT_APPLY') {
        // Multi-select question
        if (checked) {
          newAnswers = [
            ...currentAnswers.filter(id => id !== optionId),
            optionId,
          ];
        } else {
          newAnswers = currentAnswers.filter(id => id !== optionId);
        }
      } else {
        // Single-select question
        newAnswers = checked ? [optionId] : [];
      }

      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: newAnswers,
        },
      };
    });
  };

  // Following user flow: "Show immediate Correct/Incorrect feedback" → "Display detailed rationale"
  const handleSubmit = () => {
    if (userAnswer.length === 0) return;

    setState(prev => ({
      ...prev,
      submitted: {
        ...prev.submitted,
        [questionId]: true,
      },
      showFeedback: {
        ...prev.showFeedback,
        [questionId]: true,
      },
    }));
  };

  const handleNext = () => {
    if (state.currentQuestionIndex < questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    } else {
      // Quiz completed - following user flow: "Option to go to Next Concept or back to List"
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  // Determine if answer is correct
  const correctOptions = currentQuestion.options.filter(opt => opt.isCorrect);
  const correctOptionIds = correctOptions.map(opt => opt.id);
  const isCorrect =
    showFeedback &&
    userAnswer.length === correctOptionIds.length &&
    userAnswer.every(id => correctOptionIds.includes(id)) &&
    correctOptionIds.every(id => userAnswer.includes(id));

  const getOptionStatus = (optionId: string, isCorrectOption: boolean) => {
    if (!showFeedback) return 'default';

    const isSelected = userAnswer.includes(optionId);

    if (isCorrectOption) {
      return 'correct';
    } else if (isSelected && !isCorrectOption) {
      return 'incorrect';
    }

    return 'default';
  };

  const getOptionColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'success.light';
      case 'incorrect':
        return 'error.light';
      default:
        return 'transparent';
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Question Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <QuizIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h3" component="h3">
              Practice Question {state.currentQuestionIndex + 1} of{' '}
              {questions.length}
            </Typography>
            <Chip
              label={currentQuestion.type.replace(/_/g, ' ')}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.6,
              mb: 2,
            }}
          >
            {currentQuestion.text}
          </Typography>

          {currentQuestion.type === 'SELECT_ALL_THAT_APPLY' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Select all that apply:</strong> This question may have
                multiple correct answers.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Answer Options */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          {currentQuestion.type === 'SELECT_ALL_THAT_APPLY' ? (
            <FormGroup>
              {currentQuestion.options.map(option => {
                const status = getOptionStatus(option.id, option.isCorrect);
                const isSelected = userAnswer.includes(option.id);

                return (
                  <FormControlLabel
                    key={option.id}
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={e =>
                          handleAnswerChange(option.id, e.target.checked)
                        }
                        disabled={isSubmitted}
                      />
                    }
                    label={option.text}
                    sx={{
                      mb: 1,
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: getOptionColor(status),
                      border: `2px solid ${
                        status === 'correct'
                          ? 'success.main'
                          : status === 'incorrect'
                            ? 'error.main'
                            : 'transparent'
                      }`,
                      '&:hover': {
                        backgroundColor: isSubmitted
                          ? getOptionColor(status)
                          : 'action.hover',
                        transition: 'all 0.15s ease-out',
                      },
                      '& .MuiFormControlLabel-label': {
                        fontSize: '1rem',
                        lineHeight: 1.5,
                      },
                    }}
                  />
                );
              })}
            </FormGroup>
          ) : (
            <RadioGroup
              value={userAnswer[0] || ''}
              onChange={e => handleAnswerChange(e.target.value)}
            >
              {currentQuestion.options.map(option => {
                const status = getOptionStatus(option.id, option.isCorrect);

                return (
                  <FormControlLabel
                    key={option.id}
                    value={option.id}
                    control={<Radio disabled={isSubmitted} />}
                    label={option.text}
                    sx={{
                      mb: 1,
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: getOptionColor(status),
                      border: `2px solid ${
                        status === 'correct'
                          ? 'success.main'
                          : status === 'incorrect'
                            ? 'error.main'
                            : 'transparent'
                      }`,
                      '&:hover': {
                        backgroundColor: isSubmitted
                          ? getOptionColor(status)
                          : 'action.hover',
                        transition: 'all 0.15s ease-out',
                      },
                      '& .MuiFormControlLabel-label': {
                        fontSize: '1rem',
                        lineHeight: 1.5,
                      },
                    }}
                  />
                );
              })}
            </RadioGroup>
          )}
        </FormControl>

        {/* Submit Button */}
        {!isSubmitted && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={userAnswer.length === 0}
              sx={{
                minWidth: 140,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Submit Answer
            </Button>
          </Box>
        )}

        {/* Immediate Feedback - Following user flow spec */}
        {showFeedback && (
          <Box sx={{ mb: 3 }}>
            <Alert
              severity={isCorrect ? 'success' : 'error'}
              icon={isCorrect ? <CorrectIcon /> : <IncorrectIcon />}
              sx={{
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '1rem',
                },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Typography>
            </Alert>

            {/* Detailed Rationale - Following user flow spec */}
            {currentQuestion.explanation && (
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.25s ease-in-out',
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Rationale:
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {currentQuestion.explanation}
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Navigation - Following user flow: "Option to go to Next Concept or back to List" */}
        {isSubmitted && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={state.currentQuestionIndex === 0}
              sx={{ textTransform: 'none' }}
            >
              Previous Question
            </Button>

            <Typography variant="body2" color="text.secondary">
              Question {state.currentQuestionIndex + 1} of {questions.length}
            </Typography>

            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {state.currentQuestionIndex < questions.length - 1
                ? 'Next Question'
                : 'Complete Quiz'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Quiz;
