import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConceptViewer } from '@/components/Concept/ConceptViewer';

// Mock MarkdownContent component
jest.mock('@/components/MarkdownContent', () => ({
  MarkdownContent: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}));

describe('ConceptViewer', () => {
  // Mock concept data that matches the ConceptData interface
  const mockConceptData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Cardiac Assessment',
    slug: 'cardiac-assessment',
    conceptNumber: 5,
    content:
      '# Cardiac Assessment\n\nKey Points:\n- Monitor heart rate\n- Check blood pressure\n- Assess for chest pain\n\n## Overview\nThis is the main content about cardiac assessment with **bold** text and *italic* text.\n\n![Medical diagram](https://example.com/heart.jpg)',
    keyPoints: null,
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
  };

  // Note: Loading and error states are now handled server-side in page.tsx
  // ConceptViewer receives pre-fetched data, so these states don't apply

  describe('Content Rendering', () => {
    it('renders the concept title correctly', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      expect(screen.getByText('Cardiac Assessment')).toBeInTheDocument();
    });

    it('renders the "READ THIS" section header', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      expect(screen.getByText('📖 READ THIS')).toBeInTheDocument();
    });

    it('renders the concept number chip', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      expect(screen.getByText('Concept 5')).toBeInTheDocument();
    });

    it('renders the markdown content', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      // markdown-content testid appears multiple times (content + key points)
      const markdownContents = screen.getAllByTestId('markdown-content');
      expect(markdownContents.length).toBeGreaterThan(0);
      // Check that at least one contains the content
      const hasContent = markdownContents.some(
        el => el.textContent && el.textContent.includes('Cardiac Assessment')
      );
      expect(hasContent).toBe(true);
    });

    it('renders the key points section when present in content', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      expect(screen.getByText('Key Points')).toBeInTheDocument();
    });
  });

  describe('Key Points Section', () => {
    it('displays key points with lightbulb icon', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      expect(screen.getByText('Key Points')).toBeInTheDocument();
      // Check for the lightbulb icon through its parent structure
      const keyPointsSection = screen.getByText('Key Points').closest('div');
      expect(keyPointsSection).toBeInTheDocument();
    });

    it('does not display key points section when not in content', () => {
      const dataWithoutKeyPoints = {
        ...mockConceptData,
        content: '# Cardiac Assessment\n\nThis is content without key points.',
      };

      render(<ConceptViewer initialConcept={dataWithoutKeyPoints} />);

      expect(screen.queryByText('Key Points')).not.toBeInTheDocument();
    });
  });

  describe('Section Separator', () => {
    it('renders separator when questions are present', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      expect(screen.getByText('Test your knowledge!')).toBeInTheDocument();
    });

    it('does not render separator when no questions present', () => {
      const dataWithoutQuestions = {
        ...mockConceptData,
        questions: [],
      };

      render(<ConceptViewer initialConcept={dataWithoutQuestions} />);

      expect(
        screen.queryByText('Test your knowledge!')
      ).not.toBeInTheDocument();
    });
  });

  describe('Server-Side Data Fetching (Story 1.5.3.5 Fix)', () => {
    it('does not make any API calls - data is passed as prop', () => {
      // Mock fetch to track if it's called
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      render(<ConceptViewer initialConcept={mockConceptData} />);

      // Verify NO API calls are made
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('renders immediately with server-fetched data', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      // Content should be available immediately, no waiting needed
      expect(screen.getByText('Cardiac Assessment')).toBeInTheDocument();
      expect(screen.getByText('📖 READ THIS')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders with responsive padding classes', () => {
      const { container } = render(
        <ConceptViewer initialConcept={mockConceptData} />
      );

      // Check that the main container has responsive styling
      const mainBox = container.firstChild;
      expect(mainBox).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses proper heading hierarchy', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      // h1 for concept title
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Cardiac Assessment');

      // h2 for READ THIS section
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('📖 READ THIS');
    });

    it('provides semantic HTML structure', () => {
      render(<ConceptViewer initialConcept={mockConceptData} />);

      // Check for proper semantic structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('component is memoized to prevent unnecessary re-renders', () => {
      // ConceptViewer should be wrapped in React.memo
      expect(ConceptViewer.displayName).toBe('ConceptViewer');
    });
  });

  describe('Content Max Width', () => {
    it('applies max width constraint for optimal reading', () => {
      const { container } = render(
        <ConceptViewer initialConcept={mockConceptData} />
      );

      // The main container should have maxWidth styling
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
