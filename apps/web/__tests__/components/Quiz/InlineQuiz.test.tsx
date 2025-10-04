/**
 * InlineQuiz Component Tests
 * Story 1.5.4: Inline Quiz Interaction
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InlineQuiz } from '@/components/Quiz/InlineQuiz';
import type { Question } from '@/components/Quiz/types';

// Mock MarkdownContent component
jest.mock('@/components/MarkdownContent', () => ({
  MarkdownContent: ({ content }: { content: string }) => <div>{content}</div>,
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('InlineQuiz', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  const mockMultipleChoiceQuestions: Question[] = [
    {
      id: 'q1',
      type: 'MULTIPLE_CHOICE',
      text: 'What is the capital of France?',
      options: [
        { id: 'opt1', text: 'London', isCorrect: false, orderIndex: 0 },
        { id: 'opt2', text: 'Paris', isCorrect: true, orderIndex: 1 },
        { id: 'opt3', text: 'Berlin', isCorrect: false, orderIndex: 2 },
      ],
      correctAnswer: 'opt2',
      rationale: 'Paris is the capital and largest city of France.',
    },
  ];

  const mockSATAQuestions: Question[] = [
    {
      id: 'q2',
      type: 'SELECT_ALL_THAT_APPLY',
      text: 'Which are primary colors?',
      options: [
        { id: 'opt1', text: 'Red', isCorrect: true, orderIndex: 0 },
        { id: 'opt2', text: 'Blue', isCorrect: true, orderIndex: 1 },
        { id: 'opt3', text: 'Green', isCorrect: false, orderIndex: 2 },
        { id: 'opt4', text: 'Yellow', isCorrect: true, orderIndex: 3 },
      ],
      correctAnswer: 'opt1,opt2,opt4',
      rationale: 'Red, blue, and yellow are the primary colors.',
    },
  ];

  const mockFillBlankQuestions: Question[] = [
    {
      id: 'q3',
      type: 'FILL_IN_THE_BLANK',
      text: 'The mitochondria is the _____ of the cell.',
      options: [],
      correctAnswer: 'powerhouse|power house',
      rationale: 'The mitochondria produces ATP energy for the cell.',
    },
  ];

  describe('Rendering', () => {
    it('renders multiple choice question with options', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      expect(screen.getByText('🧠 ANSWER THIS')).toBeInTheDocument();
      expect(screen.getByText('1 Question')).toBeInTheDocument();
      expect(
        screen.getByText('What is the capital of France?')
      ).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
    });

    it('renders SATA question with checkboxes', () => {
      render(
        <InlineQuiz questions={mockSATAQuestions} conceptId="concept-1" />
      );

      expect(screen.getByText('Which are primary colors?')).toBeInTheDocument();
      expect(screen.getByText('Select all that apply:')).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
      expect(screen.getByText('Yellow')).toBeInTheDocument();
    });

    it('renders fill-in-blank question with text field', () => {
      render(
        <InlineQuiz questions={mockFillBlankQuestions} conceptId="concept-1" />
      );

      expect(
        screen.getByText('The mitochondria is the _____ of the cell.')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Type your answer here...')
      ).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
    });

    it('returns null when no questions provided', () => {
      const { container } = render(
        <InlineQuiz questions={[]} conceptId="concept-1" />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Interaction Tests', () => {
    it('allows selecting a multiple choice option', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      expect(parisOption).toBeChecked();
    });

    it('allows selecting multiple SATA options', () => {
      render(
        <InlineQuiz questions={mockSATAQuestions} conceptId="concept-1" />
      );

      const redCheckbox = screen.getByRole('checkbox', { name: /red/i });
      const blueCheckbox = screen.getByRole('checkbox', { name: /blue/i });

      fireEvent.click(redCheckbox);
      fireEvent.click(blueCheckbox);

      expect(redCheckbox).toBeChecked();
      expect(blueCheckbox).toBeChecked();
    });

    it('allows typing in fill-in-blank text field', () => {
      render(
        <InlineQuiz questions={mockFillBlankQuestions} conceptId="concept-1" />
      );

      const textField = screen.getByPlaceholderText('Type your answer here...');
      fireEvent.change(textField, { target: { value: 'powerhouse' } });

      expect(textField).toHaveValue('powerhouse');
    });

    it('enables submit button when answer is selected', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeDisabled();

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      expect(submitButton).toBeEnabled();
    });
  });

  describe('Feedback Tests', () => {
    it('shows correct feedback after submitting correct answer', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
      });
    });

    it('shows incorrect feedback after submitting wrong answer', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const londonOption = screen.getByRole('radio', { name: /london/i });
      fireEvent.click(londonOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();
      });
    });

    it('displays rationale after submission', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Paris is the capital and largest city of France.')
        ).toBeInTheDocument();
      });
    });

    it('shows Try Again button after submission', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Retry Functionality', () => {
    it('clears answer and feedback when Try Again is clicked', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      // Submit wrong answer
      const londonOption = screen.getByRole('radio', { name: /london/i });
      fireEvent.click(londonOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();
      });

      // Click Try Again
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Feedback should be cleared
      expect(screen.queryByText('✗ Incorrect')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Paris is the capital and largest city of France.')
      ).not.toBeInTheDocument();

      // Submit button should reappear
      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
    });
  });

  describe('State Persistence', () => {
    it('persists quiz state to localStorage', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const savedState = mockLocalStorage.getItem(
          'nclex_quiz_state_concept-1'
        );
        expect(savedState).toBeTruthy();

        const parsedState = JSON.parse(savedState!);
        expect(parsedState.q1).toBeDefined();
        expect(parsedState.q1.isSubmitted).toBe(true);
        expect(parsedState.q1.isCorrect).toBe(true);
      });
    });

    it('restores quiz state from localStorage on mount', () => {
      // Pre-populate localStorage
      const savedState = {
        q1: {
          selectedAnswer: 'opt2',
          isSubmitted: true,
          isCorrect: true,
          showRationale: true,
          retryCount: 0,
        },
      };
      mockLocalStorage.setItem(
        'nclex_quiz_state_concept-1',
        JSON.stringify(savedState)
      );

      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      // Should show feedback from restored state
      expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
      expect(
        screen.getByText('Paris is the capital and largest city of France.')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on radio buttons', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      expect(
        screen.getByRole('radio', { name: /london/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /paris/i })).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /berlin/i })
      ).toBeInTheDocument();
    });

    it('has proper ARIA labels on submit button', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /submit answer/i,
      });
      expect(submitButton).toBeInTheDocument();
    });

    it('has aria-live region for feedback', async () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveAttribute('aria-live', 'polite');
        expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('supports keyboard navigation', () => {
      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });

      // Focus element
      parisOption.focus();
      expect(parisOption).toHaveFocus();

      // Press space to select
      fireEvent.keyDown(parisOption, { key: ' ', code: 'Space' });
      expect(parisOption).toBeChecked();
    });
  });

  describe('Callback Tests', () => {
    it('calls onAllQuestionsAnswered when all questions are answered correctly', async () => {
      const mockCallback = jest.fn();

      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
          onAllQuestionsAnswered={mockCallback}
        />
      );

      const parisOption = screen.getByRole('radio', { name: /paris/i });
      fireEvent.click(parisOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });
    });

    it('does not call onAllQuestionsAnswered when questions are incorrect', async () => {
      const mockCallback = jest.fn();

      render(
        <InlineQuiz
          questions={mockMultipleChoiceQuestions}
          conceptId="concept-1"
          onAllQuestionsAnswered={mockCallback}
        />
      );

      const londonOption = screen.getByRole('radio', { name: /london/i });
      fireEvent.click(londonOption);

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
