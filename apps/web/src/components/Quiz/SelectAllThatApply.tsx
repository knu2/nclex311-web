'use client';

import React, { memo } from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
  Typography,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { MarkdownContent } from '../MarkdownContent';
import { QuestionComponentProps } from './types';

/**
 * SelectAllThatApply Component
 * Handles multi-select SATA questions
 * Story 1.5.4 - Task 3
 */
export const SelectAllThatApply: React.FC<QuestionComponentProps> = memo(
  ({ question, answerState, onAnswerChange, disabled }) => {
    const selectedAnswers = (answerState.selectedAnswer as string[]) || [];
    const showFeedback = answerState.showRationale;

    const handleChange = (optionId: string, checked: boolean): void => {
      let newAnswers: string[];

      if (checked) {
        // Add to selections
        newAnswers = [...selectedAnswers, optionId];
      } else {
        // Remove from selections
        newAnswers = selectedAnswers.filter(id => id !== optionId);
      }

      onAnswerChange(newAnswers);
    };

    const getOptionStatus = (optionId: string, isCorrect: boolean) => {
      if (!showFeedback) return 'default';

      const isSelected = selectedAnswers.includes(optionId);

      if (isCorrect) {
        return 'correct';
      } else if (isSelected && !isCorrect) {
        return 'incorrect';
      }

      return 'default';
    };

    const getOptionStyles = (status: string) => {
      const baseStyles = {
        mb: 1.5,
        p: 2,
        borderRadius: 1,
        border: '2px solid',
        borderColor: 'transparent',
        transition: 'all 0.15s ease-out',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
      };

      switch (status) {
        case 'correct':
          return {
            ...baseStyles,
            backgroundColor: '#e8f5e9',
            borderColor: '#00b894',
          };
        case 'incorrect':
          return {
            ...baseStyles,
            backgroundColor: '#ffeaa7',
            borderColor: '#e17055',
          };
        default:
          return {
            ...baseStyles,
            backgroundColor: 'white',
            borderColor: '#e1e7f0',
            '&:hover': disabled
              ? {}
              : {
                  borderColor: '#2c5aa0',
                  backgroundColor: '#e8f0fe',
                  transform: 'translateY(-2px)',
                },
          };
      }
    };

    return (
      <FormControl component="fieldset" fullWidth>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Select all that apply:</strong> This question may have
            multiple correct answers.
          </Typography>
        </Alert>

        <FormGroup aria-label={question.text}>
          {question.options.map(option => {
            const status = getOptionStatus(option.id, option.isCorrect);
            const isSelected = selectedAnswers.includes(option.id);

            return (
              <Box
                key={option.id}
                sx={getOptionStyles(status)}
                role="group"
                aria-label={`Option: ${option.text}`}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={e => handleChange(option.id, e.target.checked)}
                      disabled={disabled}
                      sx={{
                        '&.Mui-checked': {
                          color:
                            status === 'correct'
                              ? '#00b894'
                              : status === 'incorrect'
                                ? '#e17055'
                                : '#2c5aa0',
                        },
                      }}
                    />
                  }
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <MarkdownContent
                          content={option.text}
                          variant="body1"
                        />
                      </Box>
                      {showFeedback && status === 'correct' && (
                        <CheckCircle
                          sx={{ color: '#00b894', ml: 1 }}
                          aria-label="Correct answer"
                        />
                      )}
                      {showFeedback && status === 'incorrect' && isSelected && (
                        <Cancel
                          sx={{ color: '#e17055', ml: 1 }}
                          aria-label="Incorrect answer"
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    width: '100%',
                    ml: 0,
                    mr: 0,
                    '& .MuiFormControlLabel-label': {
                      width: '100%',
                      fontSize: '1rem',
                      lineHeight: 1.5,
                    },
                  }}
                />
              </Box>
            );
          })}
        </FormGroup>
      </FormControl>
    );
  }
);

SelectAllThatApply.displayName = 'SelectAllThatApply';

export default SelectAllThatApply;
