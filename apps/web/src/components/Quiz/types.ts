/**
 * Shared TypeScript interfaces for Quiz components
 * Story 1.5.4: Inline Quiz Interaction
 */

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SELECT_ALL_THAT_APPLY'
  | 'FILL_IN_THE_BLANK'
  | 'MATRIX_GRID';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctAnswer: string;
  rationale: string | null;
  matrixRows?: string[];
  matrixColumns?: string[];
}

export interface AnswerState {
  selectedAnswer: string | string[] | Record<string, string>;
  isSubmitted: boolean;
  isCorrect: boolean | null;
  showRationale: boolean;
  retryCount: number;
}

export interface QuizState {
  [questionId: string]: AnswerState;
}

export interface InlineQuizProps {
  questions: Question[];
  conceptId: string;
  conceptKeyPoints?: string | null;
  onAllQuestionsAnswered?: () => void;
}

export interface QuestionComponentProps {
  question: Question;
  answerState: AnswerState;
  onAnswerChange: (answer: string | string[] | Record<string, string>) => void;
  disabled: boolean;
}
