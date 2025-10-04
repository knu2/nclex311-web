'use client';

import React, { memo } from 'react';
import { Box, TextField, Alert, Typography } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { QuestionComponentProps } from './types';

/**
 * FillInBlank Component
 * Handles fill-in-the-blank text input questions
 * Story 1.5.4 - Task 4
 */
export const FillInBlank: React.FC<QuestionComponentProps> = memo(
  ({ question, answerState, onAnswerChange, disabled }) => {
    const userAnswer = (answerState.selectedAnswer as string) || '';
    const showFeedback = answerState.showRationale;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
      onAnswerChange(event.target.value);
    };

    // Parse pipe-separated alternatives for correct answer
    const correctAnswers = question.correctAnswer
      .split('|')
      .map(ans => ans.trim().toLowerCase());

    const isAnswerCorrect = (): boolean => {
      const normalizedAnswer = userAnswer.trim().toLowerCase();
      return correctAnswers.includes(normalizedAnswer);
    };

    const getInputColor = ():
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
      | undefined => {
      if (!showFeedback) return undefined;
      return isAnswerCorrect() ? 'success' : 'error';
    };

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Fill in the blank:</strong> Type your answer in the text
            field below.
          </Typography>
        </Alert>

        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField
            fullWidth
            value={userAnswer}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Type your answer here..."
            variant="outlined"
            color={getInputColor()}
            aria-label="Fill in the blank answer"
            inputProps={{
              'aria-describedby': 'fill-blank-instructions',
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: 56,
                fontSize: '1rem',
                backgroundColor: 'white',
                '&:hover': disabled
                  ? {}
                  : {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2c5aa0',
                      },
                    },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px',
                  },
                },
              },
            }}
          />

          {showFeedback && (
            <Box
              sx={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              {isAnswerCorrect() ? (
                <CheckCircle
                  sx={{ color: '#00b894', fontSize: 28 }}
                  aria-label="Correct answer"
                />
              ) : (
                <Cancel
                  sx={{ color: '#e17055', fontSize: 28 }}
                  aria-label="Incorrect answer"
                />
              )}
            </Box>
          )}
        </Box>

        {showFeedback && !isAnswerCorrect() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Correct answer(s):</strong> {correctAnswers.join(', ')}
            </Typography>
          </Alert>
        )}
      </Box>
    );
  }
);

FillInBlank.displayName = 'FillInBlank';

export default FillInBlank;
