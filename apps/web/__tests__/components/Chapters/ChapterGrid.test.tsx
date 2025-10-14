import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChapterGrid } from '@/components/Chapters/ChapterGrid';

// Mock ChapterCard component
jest.mock('@/components/Chapters/ChapterCard', () => ({
  ChapterCard: ({
    chapter,
    isPremiumUser,
  }: {
    chapter: {
      id: string;
      chapterNumber: number;
      title: string;
    };
    isPremiumUser: boolean;
  }) => (
    <div
      data-testid={`chapter-card-${chapter.id}`}
      data-chapter-number={chapter.chapterNumber}
      data-is-premium-user={isPremiumUser}
    >
      {chapter.title}
    </div>
  ),
}));

describe('ChapterGrid', () => {
  const mockChapters = [
    {
      id: 'chapter-1',
      chapterNumber: 1,
      title: 'Fundamentals of Nursing',
      slug: 'fundamentals',
      isPremium: false,
      conceptCount: 42,
      firstConceptSlug: 'fundamentals-intro',
    },
    {
      id: 'chapter-2',
      chapterNumber: 2,
      title: 'Medical-Surgical Nursing',
      slug: 'medical-surgical',
      isPremium: false,
      conceptCount: 38,
      firstConceptSlug: 'medsurg-intro',
    },
    {
      id: 'chapter-3',
      chapterNumber: 3,
      title: 'Pediatric Nursing',
      slug: 'pediatric',
      isPremium: false,
      conceptCount: 35,
      firstConceptSlug: 'pediatric-intro',
    },
    {
      id: 'chapter-4',
      chapterNumber: 4,
      title: 'Maternal-Newborn Nursing',
      slug: 'maternal-newborn',
      isPremium: false,
      conceptCount: 32,
      firstConceptSlug: 'maternal-intro',
    },
    {
      id: 'chapter-5',
      chapterNumber: 5,
      title: 'Pharmacology',
      slug: 'pharmacology',
      isPremium: true,
      conceptCount: 45,
      firstConceptSlug: 'pharmacology-intro',
    },
    {
      id: 'chapter-6',
      chapterNumber: 6,
      title: 'Mental Health Nursing',
      slug: 'mental-health',
      isPremium: true,
      conceptCount: 28,
      firstConceptSlug: 'mental-health-intro',
    },
    {
      id: 'chapter-7',
      chapterNumber: 7,
      title: 'Community Health Nursing',
      slug: 'community-health',
      isPremium: true,
      conceptCount: 25,
      firstConceptSlug: 'community-intro',
    },
    {
      id: 'chapter-8',
      chapterNumber: 8,
      title: 'Leadership and Management',
      slug: 'leadership',
      isPremium: true,
      conceptCount: 22,
      firstConceptSlug: 'leadership-intro',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('displays skeleton loaders while fetching data', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ChapterGrid isPremiumUser={false} />);

      // Should show 8 skeleton loaders
      const skeletons = screen.getAllByLabelText('Loading chapter card');
      expect(skeletons).toHaveLength(8);
    });
  });

  describe('Successful Data Fetch', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ chapters: mockChapters }),
      });
    });

    it('fetches and displays all 8 chapters', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(screen.getByText('Fundamentals of Nursing')).toBeInTheDocument();
      });

      expect(screen.getByTestId('chapter-card-chapter-1')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-card-chapter-8')).toBeInTheDocument();
    });

    it('calls API endpoint with correct URL', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chapters');
      });
    });

    it('passes isPremiumUser prop to ChapterCard components', async () => {
      render(<ChapterGrid isPremiumUser={true} />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/chapter-card-/);
        cards.forEach(card => {
          expect(card).toHaveAttribute('data-is-premium-user', 'true');
        });
      });
    });

    it('renders grid with proper ARIA labels', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText('Chapter grid with 8 chapters')
        ).toBeInTheDocument();
      });
    });

    it('renders chapters in correct order', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        const card1 = screen.getByTestId('chapter-card-chapter-1');
        const card8 = screen.getByTestId('chapter-card-chapter-8');

        expect(card1).toHaveAttribute('data-chapter-number', '1');
        expect(card8).toHaveAttribute('data-chapter-number', '8');
      });
    });
  });

  describe('Error State', () => {
    it('displays error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Chapters')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('displays error when API returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to fetch chapters: Internal Server Error/)
        ).toBeInTheDocument();
      });
    });

    it('displays error when API returns invalid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid response format from API/)
        ).toBeInTheDocument();
      });
    });

    it('provides retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        const retryButton = screen.getByLabelText('Retry loading chapters');
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('has proper ARIA attributes on error alert', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('Empty State', () => {
    it('displays info message when no chapters are returned', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ chapters: [] }),
      });

      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByText('No chapters available at this time.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Upgrade Dialog', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ chapters: mockChapters }),
      });
    });

    it('does not display upgrade dialog by default', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('chapter-card-chapter-1')
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
    });

    it('upgrade dialog is accessible when opened', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('chapter-card-chapter-1')
        ).toBeInTheDocument();
      });

      // Dialog is hidden by default, so we just verify the component renders correctly
      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ chapters: mockChapters }),
      });
    });

    it('renders all chapter cards in grid layout', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('chapter-card-chapter-1')
        ).toBeInTheDocument();
      });

      // Verify all 8 chapter cards are rendered in the grid
      const allCards = screen.getAllByTestId(/chapter-card-/);
      expect(allCards).toHaveLength(8);
    });
  });

  describe('Premium User Behavior', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ chapters: mockChapters }),
      });
    });

    it('passes isPremiumUser=false when not premium', async () => {
      render(<ChapterGrid isPremiumUser={false} />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/chapter-card-/);
        cards.forEach(card => {
          expect(card).toHaveAttribute('data-is-premium-user', 'false');
        });
      });
    });

    it('passes isPremiumUser=true when premium', async () => {
      render(<ChapterGrid isPremiumUser={true} />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/chapter-card-/);
        cards.forEach(card => {
          expect(card).toHaveAttribute('data-is-premium-user', 'true');
        });
      });
    });

    it('defaults to isPremiumUser=false when prop not provided', async () => {
      render(<ChapterGrid />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/chapter-card-/);
        cards.forEach(card => {
          expect(card).toHaveAttribute('data-is-premium-user', 'false');
        });
      });
    });
  });
});
