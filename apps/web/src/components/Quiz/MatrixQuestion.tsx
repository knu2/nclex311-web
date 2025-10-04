'use client';

import React, { memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  Paper,
  Alert,
  Typography,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { QuestionComponentProps } from './types';

/**
 * MatrixQuestion Component
 * Handles matrix/grid questions with row-column selections
 * Story 1.5.4 - Task 5
 */
export const MatrixQuestion: React.FC<QuestionComponentProps> = memo(
  ({ question, answerState, onAnswerChange, disabled }) => {
    const userAnswers =
      (answerState.selectedAnswer as Record<string, string>) || {};
    const showFeedback = answerState.showRationale;

    // Parse correct answer from JSON string
    const correctAnswers: Record<string, string> = question.correctAnswer
      ? JSON.parse(question.correctAnswer)
      : {};

    const rows = question.matrixRows || [];
    const columns = question.matrixColumns || [];

    const handleSelectionChange = (
      rowIndex: number,
      columnValue: string
    ): void => {
      const newAnswers = {
        ...userAnswers,
        [rowIndex]: columnValue,
      };
      onAnswerChange(newAnswers);
    };

    const getSelectionStatus = (
      rowIndex: number,
      columnValue: string
    ): string => {
      if (!showFeedback) return 'default';

      const userSelection = userAnswers[rowIndex];
      const correctSelection = correctAnswers[rowIndex];

      if (columnValue === correctSelection) {
        return 'correct';
      } else if (
        userSelection === columnValue &&
        columnValue !== correctSelection
      ) {
        return 'incorrect';
      }

      return 'default';
    };

    const getCellStyles = (status: string) => {
      switch (status) {
        case 'correct':
          return {
            backgroundColor: '#e8f5e9',
            borderColor: '#00b894',
          };
        case 'incorrect':
          return {
            backgroundColor: '#ffeaa7',
            borderColor: '#e17055',
          };
        default:
          return {
            backgroundColor: 'white',
          };
      }
    };

    const isRowCorrect = (rowIndex: number): boolean => {
      return userAnswers[rowIndex] === correctAnswers[rowIndex];
    };

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Matrix question:</strong> Select one option for each row.
          </Typography>
        </Alert>

        <TableContainer
          component={Paper}
          sx={{
            mb: 2,
            overflowX: 'auto',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: { xs: 300, sm: 600 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    backgroundColor: '#f5f7fa',
                    minWidth: 150,
                  }}
                >
                  Item
                </TableCell>
                {columns.map((column, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f5f7fa',
                      minWidth: { xs: 80, sm: 100 },
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
                {showFeedback && (
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f5f7fa',
                      width: 60,
                    }}
                  >
                    Result
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.9rem',
                    }}
                  >
                    {row}
                  </TableCell>
                  {columns.map((column, colIndex) => {
                    const status = getSelectionStatus(rowIndex, column);
                    const isSelected = userAnswers[rowIndex] === column;

                    return (
                      <TableCell
                        key={colIndex}
                        align="center"
                        sx={{
                          ...getCellStyles(status),
                          transition: 'all 0.15s ease-out',
                        }}
                      >
                        <Radio
                          checked={isSelected}
                          onChange={() =>
                            handleSelectionChange(rowIndex, column)
                          }
                          disabled={disabled}
                          value={column}
                          name={`matrix-row-${rowIndex}`}
                          aria-label={`${row}: ${column}`}
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
                      </TableCell>
                    );
                  })}
                  {showFeedback && (
                    <TableCell align="center">
                      {isRowCorrect(rowIndex) ? (
                        <CheckCircle
                          sx={{ color: '#00b894', fontSize: 24 }}
                          aria-label="Correct"
                        />
                      ) : (
                        <Cancel
                          sx={{ color: '#e17055', fontSize: 24 }}
                          aria-label="Incorrect"
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
);

MatrixQuestion.displayName = 'MatrixQuestion';

export default MatrixQuestion;
