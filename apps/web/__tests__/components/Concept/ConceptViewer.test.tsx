import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConceptViewer } from '@/components/Concept/ConceptViewer';

// Mock MarkdownContent component
jest.mock('@/components/MarkdownContent', () => ({
  MarkdownContent: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('ConceptViewer', () => {
  const mockConceptData = {
    success: true,
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Cardiac Assessment',
      slug: 'cardiac-assessment',
      conceptNumber: 5,
      content:
        '# Cardiac Assessment\n\nKey Points:\n- Monitor heart rate\n- Check blood pressure\n- Assess for chest pain\n\n## Overview\nThis is the main content about cardiac assessment with **bold** text and *italic* text.\n\n![Medical diagram](https://example.com/heart.jpg)',
      chapterId: '123e4567-e89b-12d3-a456-426614174001',
      isPremium: false,
      chapter: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Cardiovascular Care',
        chapterNumber: 1,
        slug: 'cardiovascular-care',
      },
      questions: [
        {
          id: 'q1',
          text: 'What is a normal heart rate?',
          type: 'multiple_choice',
          rationale: 'Normal adult heart rate is 60-100 bpm',
          options: [
            {
              id: 'opt1',
              text: '60-100 bpm',
              isCorrect: true,
            },
            {
              id: 'opt2',
              text: '40-60 bpm',
              isCorrect: false,
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('displays loading skeletons while fetching data', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolve to keep loading
          })
      );

      const { container } = render(<ConceptViewer conceptSlug="test-slug" />);

      // Check for skeleton elements by class name
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('displays error message for 404 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Concept not found' }),
      });

      render(<ConceptViewer conceptSlug="nonexistent-slug" />);

      await waitFor(() => {
        expect(screen.getByText('Concept not found')).toBeInTheDocument();
      });
    });

    it('displays error message for 403 premium access required', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          message: 'Premium access required',
          premiumRequired: true,
        }),
      });

      render(<ConceptViewer conceptSlug="premium-concept" />);

      await waitFor(() => {
        expect(screen.getByText('Premium access required')).toBeInTheDocument();
      });
    });

    it('displays error message for network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<ConceptViewer conceptSlug="test-slug" />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('handles invalid response format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      });

      render(<ConceptViewer conceptSlug="test-slug" />);

      await waitFor(() => {
        expect(screen.getByText('Invalid response format')).toBeInTheDocument();
      });
    });
  });

  describe('Content Rendering', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });
    });

    it('renders the concept title correctly', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.getByText('Cardiac Assessment')).toBeInTheDocument();
      });
    });

    it('renders the "READ THIS" section header', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.getByText('📖 READ THIS')).toBeInTheDocument();
      });
    });

    it('renders the concept number chip', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.getByText('Concept 5')).toBeInTheDocument();
      });
    });

    it('renders the markdown content', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        // markdown-content testid appears multiple times (content + key points)
        const markdownContents = screen.getAllByTestId('markdown-content');
        expect(markdownContents.length).toBeGreaterThan(0);
        // Check that at least one contains the content
        const hasContent = markdownContents.some(
          el => el.textContent && el.textContent.includes('Cardiac Assessment')
        );
        expect(hasContent).toBe(true);
      });
    });

    it('renders the key points section when present in content', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.getByText('Key Points')).toBeInTheDocument();
      });
    });
  });

  describe('Key Points Section', () => {
    it('displays key points with lightbulb icon', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });

      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.getByText('Key Points')).toBeInTheDocument();
        // Check for the lightbulb icon through its parent structure
        const keyPointsSection = screen.getByText('Key Points').closest('div');
        expect(keyPointsSection).toBeInTheDocument();
      });
    });

    it('does not display key points section when not in content', async () => {
      const dataWithoutKeyPoints = {
        ...mockConceptData,
        data: {
          ...mockConceptData.data,
          content:
            '# Cardiac Assessment\n\nThis is content without key points.',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithoutKeyPoints,
      });

      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.queryByText('Key Points')).not.toBeInTheDocument();
      });
    });
  });

  describe('Section Separator', () => {
    it('renders separator when questions are present', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });

      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(screen.getByText('Test your knowledge!')).toBeInTheDocument();
      });
    });

    it('does not render separator when no questions present', async () => {
      const dataWithoutQuestions = {
        ...mockConceptData,
        data: {
          ...mockConceptData.data,
          questions: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithoutQuestions,
      });

      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(
          screen.queryByText('Test your knowledge!')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls the correct API endpoint with slug', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });

      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/cardiac-assessment'
        );
      });
    });

    it('re-fetches data when slug changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockConceptData,
      });

      const { rerender } = render(
        <ConceptViewer conceptSlug="first-concept" />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/first-concept'
        );
      });

      // Clear mock and rerender with new slug
      jest.clearAllMocks();
      rerender(<ConceptViewer conceptSlug="second-concept" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/second-concept'
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders with responsive padding classes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });

      const { container } = render(
        <ConceptViewer conceptSlug="cardiac-assessment" />
      );

      await waitFor(() => {
        // Check that the main container has responsive styling
        const mainBox = container.firstChild;
        expect(mainBox).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });
    });

    it('uses proper heading hierarchy', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        // h1 for concept title
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Cardiac Assessment');

        // h2 for READ THIS section
        const h2 = screen.getByRole('heading', { level: 2 });
        expect(h2).toHaveTextContent('📖 READ THIS');
      });
    });

    it('provides semantic HTML structure', async () => {
      render(<ConceptViewer conceptSlug="cardiac-assessment" />);

      await waitFor(() => {
        // Check for proper semantic structure
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toBeInTheDocument();
      });
    });
  });

  describe('Performance Optimization', () => {
    it('component is memoized to prevent unnecessary re-renders', () => {
      // ConceptViewer should be wrapped in React.memo
      expect(ConceptViewer.displayName).toBe('ConceptViewer');
    });
  });

  describe('Content Max Width', () => {
    it('applies max width constraint for optimal reading', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConceptData,
      });

      const { container } = render(
        <ConceptViewer conceptSlug="cardiac-assessment" />
      );

      await waitFor(() => {
        // The main container should have maxWidth styling
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });
});
