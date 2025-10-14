/**
 * Unit Tests for ProgressDashboard Component
 * Story 1.5.8: Progress Dashboard
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressDashboard } from '@/components/Dashboard/ProgressDashboard';
import type { UserProgress } from '@/types/progress';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

describe('ProgressDashboard', () => {
  const mockProgress: UserProgress = {
    user_id: 'user-123',
    overall_progress: {
      total_concepts: 323,
      completed_concepts: 100,
      completion_percentage: 31,
    },
    chapters: [
      {
        chapter_id: 'chapter-1',
        chapter_number: 1,
        chapter_title: 'Foundations of Nursing Practice',
        concept_count: 42,
        completed_concept_count: 20,
        completion_percentage: 48,
        completed_concepts: [
          {
            concept_id: 'concept-1',
            concept_title: 'Introduction to Nursing',
            concept_slug: 'intro-to-nursing',
            completed_at: '2025-10-01T10:00:00Z',
          },
          {
            concept_id: 'concept-2',
            concept_title: 'Professional Standards',
            concept_slug: 'professional-standards',
            completed_at: '2025-10-02T14:30:00Z',
          },
        ],
      },
      {
        chapter_id: 'chapter-2',
        chapter_number: 2,
        chapter_title: 'Health Assessment',
        concept_count: 38,
        completed_concept_count: 0,
        completion_percentage: 0,
        completed_concepts: [],
      },
    ],
  };

  describe('Rendering Tests', () => {
    it('should render dashboard with progress data', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      expect(screen.getByText('📊 Your Learning Progress')).toBeInTheDocument();
      expect(
        screen.getByText('Track your mastery of NCLEX 311 concepts')
      ).toBeInTheDocument();
    });

    it('should display overall progress summary', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('/ 323')).toBeInTheDocument();
      expect(screen.getByText('31% Complete')).toBeInTheDocument();
    });

    it('should render all chapter accordions', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const chapter1 = screen.getByText(
        /Chapter 1: Foundations of Nursing Practice/i
      );
      const chapter2 = screen.getByText(/Chapter 2: Health Assessment/i);

      expect(chapter1).toBeInTheDocument();
      expect(chapter2).toBeInTheDocument();
    });

    it('should display progress bars with correct percentages', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      // Overall progress bar
      const overallProgressBar = screen.getByRole('progressbar', {
        name: /31 percent complete/i,
      });
      expect(overallProgressBar).toHaveAttribute('aria-valuenow', '31');

      // Chapter progress bars
      const chapterProgressBars = screen.getAllByRole('progressbar');
      expect(chapterProgressBars.length).toBeGreaterThan(1);
    });

    it('should display loading skeleton when isLoading is true', () => {
      render(<ProgressDashboard progress={mockProgress} isLoading={true} />);

      // Check for skeleton elements (MUI Skeleton components)
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction Tests', () => {
    it('should expand accordion when clicked', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const accordionButton = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });

      // Initially, completed concepts should not be visible
      expect(
        screen.queryByText('Introduction to Nursing')
      ).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(accordionButton);

      // Now completed concepts should be visible
      expect(screen.getByText('Introduction to Nursing')).toBeInTheDocument();
      expect(screen.getByText('Professional Standards')).toBeInTheDocument();
    });

    it('should allow multiple accordions to be open simultaneously', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const chapter1Button = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });
      const chapter2Button = screen.getByRole('button', {
        name: /Chapter 2: Health Assessment/i,
      });

      // Open both chapters
      fireEvent.click(chapter1Button);
      fireEvent.click(chapter2Button);

      // Both should be expanded
      expect(screen.getByText('Introduction to Nursing')).toBeInTheDocument();
      expect(
        screen.getByText(
          'No concepts completed yet. Start learning to track your progress!'
        )
      ).toBeInTheDocument();
    });

    it('should navigate to concept when concept link is clicked', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const accordionButton = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });
      fireEvent.click(accordionButton);

      const conceptLink = screen.getByText('Introduction to Nursing');
      expect(conceptLink.closest('a')).toHaveAttribute(
        'href',
        '/concepts/intro-to-nursing'
      );
    });
  });

  describe('Progress Display Tests', () => {
    it('should calculate overall progress correctly', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('/ 323')).toBeInTheDocument();
      expect(screen.getByText('31% Complete')).toBeInTheDocument();
    });

    it('should display chapter progress correctly', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      // Find chapter 1 progress text
      expect(screen.getByText(/20\/42 - 48%/i)).toBeInTheDocument();

      // Find chapter 2 progress text
      expect(screen.getByText(/0\/38 - 0%/i)).toBeInTheDocument();
    });

    it('should display completed concepts list in each chapter', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const chapter1Button = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });
      fireEvent.click(chapter1Button);

      expect(screen.getByText('Completed Concepts (2)')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Nursing')).toBeInTheDocument();
      expect(screen.getByText('Professional Standards')).toBeInTheDocument();
    });

    it('should display message when no concepts completed in chapter', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const chapter2Button = screen.getByRole('button', {
        name: /Chapter 2: Health Assessment/i,
      });
      fireEvent.click(chapter2Button);

      expect(
        screen.getByText(
          'No concepts completed yet. Start learning to track your progress!'
        )
      ).toBeInTheDocument();
    });

    it('should display milestone message at appropriate thresholds', () => {
      const progressWithMilestone: UserProgress = {
        ...mockProgress,
        overall_progress: {
          total_concepts: 100,
          completed_concepts: 50,
          completion_percentage: 50,
        },
      };

      render(<ProgressDashboard progress={progressWithMilestone} />);

      expect(
        screen.getByText(/Great work! You're halfway through!/i)
      ).toBeInTheDocument();
    });

    it('should display correct milestone at 25%', () => {
      const progress25: UserProgress = {
        ...mockProgress,
        overall_progress: {
          total_concepts: 100,
          completed_concepts: 25,
          completion_percentage: 25,
        },
      };

      render(<ProgressDashboard progress={progress25} />);

      expect(
        screen.getByText(/Keep going! You're making great progress!/i)
      ).toBeInTheDocument();
    });

    it('should display correct milestone at 75%', () => {
      const progress75: UserProgress = {
        ...mockProgress,
        overall_progress: {
          total_concepts: 100,
          completed_concepts: 75,
          completion_percentage: 75,
        },
      };

      render(<ProgressDashboard progress={progress75} />);

      expect(
        screen.getByText(/Amazing! You're almost there!/i)
      ).toBeInTheDocument();
    });

    it('should display congratulations message at 100%', () => {
      const progress100: UserProgress = {
        ...mockProgress,
        overall_progress: {
          total_concepts: 100,
          completed_concepts: 100,
          completion_percentage: 100,
        },
      };

      render(<ProgressDashboard progress={progress100} />);

      expect(
        screen.getByText(/Congratulations! You've completed all concepts!/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      expect(
        screen.getByRole('main', { name: 'Progress Dashboard' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: 'Overall Progress Summary' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: 'Chapter Progress List' })
      ).toBeInTheDocument();
    });

    it('should have accessible progress bars with proper labels', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const overallProgressBar = screen.getByRole('progressbar', {
        name: /31 percent complete/i,
      });
      expect(overallProgressBar).toBeInTheDocument();
      expect(overallProgressBar).toHaveAttribute('aria-valuenow', '31');
    });

    it('should have accessible accordion headers', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const chapter1Accordion = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });

      expect(chapter1Accordion).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(chapter1Accordion);

      expect(chapter1Accordion).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have accessible concept links', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const accordionButton = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });
      fireEvent.click(accordionButton);

      const conceptLink = screen.getByRole('link', {
        name: /Go to Introduction to Nursing/i,
      });
      expect(conceptLink).toBeInTheDocument();
      expect(conceptLink).toHaveAttribute('href', '/concepts/intro-to-nursing');
    });

    it('should support keyboard navigation', () => {
      render(<ProgressDashboard progress={mockProgress} />);

      const accordionButton = screen.getByRole('button', {
        name: /Chapter 1: Foundations of Nursing Practice/i,
      });

      // Simulate keyboard navigation
      accordionButton.focus();
      expect(document.activeElement).toBe(accordionButton);
    });
  });
});
