import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChapterCard } from '@/components/Chapters/ChapterCard';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ChapterCard', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFreeChapter = {
    id: 'chapter-1',
    chapterNumber: 1,
    title: 'Fundamentals of Nursing',
    isPremium: false,
    conceptCount: 42,
    firstConceptSlug: 'fundamentals-intro',
  };

  const mockPremiumChapter = {
    id: 'chapter-5',
    chapterNumber: 5,
    title: 'Advanced Pharmacology',
    isPremium: true,
    conceptCount: 38,
    firstConceptSlug: 'pharmacology-intro',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Rendering', () => {
    it('renders chapter number and title correctly', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Fundamentals of Nursing')).toBeInTheDocument();
    });

    it('renders concept count with correct pluralization', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(screen.getByText('42 concepts')).toBeInTheDocument();
    });

    it('renders concept count with singular form when count is 1', () => {
      const singleConceptChapter = {
        ...mockFreeChapter,
        conceptCount: 1,
      };

      render(
        <ChapterCard
          chapter={singleConceptChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(screen.getByText('1 concept')).toBeInTheDocument();
    });

    it('renders Free badge for free chapters', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('renders Premium badge for premium chapters', () => {
      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={true}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('does not render lock icon for free chapters', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.queryByLabelText('Premium content locked')
      ).not.toBeInTheDocument();
    });

    it('renders lock icon for premium chapters when user is not premium', () => {
      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.getByLabelText('Premium content locked')
      ).toBeInTheDocument();
    });

    it('does not render lock icon for premium chapters when user is premium', () => {
      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={true}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.queryByLabelText('Premium content locked')
      ).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to first concept when free chapter is clicked', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      const card = screen.getByLabelText(
        /Navigate to Fundamentals of Nursing/i
      );
      fireEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/concepts/fundamentals-intro'
      );
    });

    it('navigates to first concept when premium user clicks premium chapter', () => {
      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={true}
          onUpgradeClick={jest.fn()}
        />
      );

      const card = screen.getByLabelText(/Navigate to Advanced Pharmacology/i);
      fireEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/concepts/pharmacology-intro'
      );
    });

    it('calls onUpgradeClick when non-premium user clicks premium chapter', () => {
      const mockUpgradeClick = jest.fn();

      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={false}
          onUpgradeClick={mockUpgradeClick}
        />
      );

      const card = screen.getByLabelText(/Upgrade to access Chapter 5/i);
      fireEvent.click(card);

      expect(mockUpgradeClick).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('does not navigate when chapter has no firstConceptSlug', () => {
      const chapterWithoutSlug = {
        ...mockFreeChapter,
        firstConceptSlug: '',
      };

      render(
        <ChapterCard
          chapter={chapterWithoutSlug}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label for free chapter', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.getByLabelText('Chapter 1: Fundamentals of Nursing')
      ).toBeInTheDocument();
    });

    it('has proper ARIA label for locked premium chapter', () => {
      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.getByLabelText(
          'Chapter 5: Advanced Pharmacology - Premium content, upgrade required'
        )
      ).toBeInTheDocument();
    });

    it('has descriptive ARIA label for concept count', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.getByLabelText('42 concepts in this chapter')
      ).toBeInTheDocument();
    });

    it('has descriptive ARIA label for Free badge', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.getByLabelText('Free chapter - available to all users')
      ).toBeInTheDocument();
    });

    it('has descriptive ARIA label for Premium badge', () => {
      render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={true}
          onUpgradeClick={jest.fn()}
        />
      );

      expect(
        screen.getByLabelText('Premium chapter - subscription required')
      ).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();

      // Card should be focusable
      card.focus();
      expect(card).toHaveFocus();
    });
  });

  describe('Visual States', () => {
    it('applies reduced opacity to locked premium chapters', () => {
      const { container } = render(
        <ChapterCard
          chapter={mockPremiumChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ opacity: 0.7 });
    });

    it('applies normal opacity to accessible chapters', () => {
      const { container } = render(
        <ChapterCard
          chapter={mockFreeChapter}
          isPremiumUser={false}
          onUpgradeClick={jest.fn()}
        />
      );

      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ opacity: 1 });
    });
  });
});
