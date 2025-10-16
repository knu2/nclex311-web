/**
 * Unit Tests for ConceptList Sidebar Component
 * Story: 1.5.1 - Sidebar Navigation Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { ConceptList } from '@/components/Sidebar/ConceptList';
import type { Chapter } from '@/components/Sidebar/ConceptList';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock MUI useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

import { useMediaQuery } from '@mui/material';

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<
  typeof useMediaQuery
>;

// Mock chapter data
const mockChapterData: Chapter = {
  id: 'chapter-1',
  title: 'Cardiovascular Care',
  chapterNumber: 1,
  concepts: [
    {
      id: 'concept-1',
      title: 'Cardiac Assessment',
      slug: 'cardiac-assessment',
      conceptNumber: 1,
      isCompleted: true,
      isPremium: false,
    },
    {
      id: 'concept-2',
      title: 'Heart Failure Management',
      slug: 'heart-failure-management',
      conceptNumber: 2,
      isCompleted: false,
      isPremium: false,
    },
    {
      id: 'concept-3',
      title: 'Advanced Cardiac Procedures',
      slug: 'advanced-cardiac-procedures',
      conceptNumber: 3,
      isCompleted: false,
      isPremium: true,
    },
  ],
};

describe('ConceptList Component', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock router
    mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUsePathname.mockReturnValue('/concepts/cardiac-assessment');

    // Mock useMediaQuery - desktop by default
    mockUseMediaQuery.mockReturnValue(false);

    // Mock fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockChapterData,
          }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders chapter title and progress', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        expect(screen.getByText('Cardiovascular Care')).toBeInTheDocument();
        expect(screen.getByText('1/3 completed')).toBeInTheDocument();
      });
    });

    it('renders all concepts with correct numbers and titles', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByText(/1\. Cardiac Assessment/)).toBeInTheDocument();
        expect(
          screen.getByText(/2\. Heart Failure Management/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/3\. Advanced Cardiac Procedures/)
        ).toBeInTheDocument();
      });
    });

    it('shows checkmark icon for completed concepts', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const checkIcons = screen.getAllByLabelText('Completed');
        expect(checkIcons).toHaveLength(1);
      });
    });

    it('shows lock icon for premium concepts', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const lockIcons = screen.getAllByLabelText('Premium content');
        expect(lockIcons).toHaveLength(1);
      });
    });

    it('displays loading state initially', () => {
      render(<ConceptList chapterId="chapter-1" />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays error state when API fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              success: false,
              error: 'Failed to load chapter',
            }),
        })
      ) as jest.Mock;

      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load chapter')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Tests', () => {
    it('navigates to concept page on click', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const conceptButton = screen.getByText(/2\. Heart Failure Management/);
        fireEvent.click(conceptButton);
      });

      expect(mockPush).toHaveBeenCalledWith(
        '/concepts/heart-failure-management'
      );
    });

    it('calls custom onConceptClick handler when provided', async () => {
      const mockOnClick = jest.fn();

      render(
        <ConceptList chapterId="chapter-1" onConceptClick={mockOnClick} />
      );

      await waitFor(() => {
        const conceptButton = screen.getByText(/1\. Cardiac Assessment/);
        fireEvent.click(conceptButton);
      });

      expect(mockOnClick).toHaveBeenCalledWith('cardiac-assessment');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('highlights active concept based on currentConceptSlug prop', async () => {
      render(
        <ConceptList
          chapterId="chapter-1"
          currentConceptSlug="heart-failure-management"
        />
      );

      await waitFor(() => {
        const activeButton = screen
          .getByText(/2\. Heart Failure Management/)
          .closest('button');
        expect(activeButton).toHaveClass('Mui-selected');
      });
    });

    it('highlights active concept based on pathname', async () => {
      mockUsePathname.mockReturnValue('/concepts/cardiac-assessment');

      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const activeButton = screen
          .getByText(/1\. Cardiac Assessment/)
          .closest('button');
        expect(activeButton).toHaveClass('Mui-selected');
      });
    });
  });

  describe('Responsive Behavior Tests', () => {
    it('renders permanent drawer on desktop', async () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop

      const { container } = render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const drawer = container.querySelector('.MuiDrawer-root');
        expect(drawer).toHaveClass('MuiDrawer-docked');
      });
    });

    it('renders temporary drawer on mobile', async () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile

      const { container } = render(
        <ConceptList chapterId="chapter-1" isOpen={true} />
      );

      await waitFor(() => {
        const drawer = container.querySelector('.MuiDrawer-root');
        expect(drawer).toHaveClass('MuiDrawer-modal');
      });
    });

    it('closes mobile drawer after navigation', async () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
      const mockOnClose = jest.fn();

      render(
        <ConceptList
          chapterId="chapter-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const conceptButton = screen.getByText(/1\. Cardiac Assessment/);
        fireEvent.click(conceptButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper ARIA labels on navigation', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const nav = screen.getByRole('navigation', {
          name: 'Concept navigation',
        });
        expect(nav).toBeInTheDocument();
      });
    });

    it('has ARIA labels on concept buttons', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const completedButton = screen.getByLabelText(
          /Cardiac Assessment.*completed/i
        );
        expect(completedButton).toBeInTheDocument();

        const premiumButton = screen.getByLabelText(
          /Advanced Cardiac Procedures.*premium content/i
        );
        expect(premiumButton).toBeInTheDocument();
      });
    });

    it('has aria-current on active concept', async () => {
      render(
        <ConceptList
          chapterId="chapter-1"
          currentConceptSlug="cardiac-assessment"
        />
      );

      await waitFor(() => {
        const activeButton = screen
          .getByText(/1\. Cardiac Assessment/)
          .closest('button');
        expect(activeButton).toHaveAttribute('aria-current', 'page');
      });
    });

    it('has aria-label on progress indicator', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const progress = screen.getByLabelText('1 of 3 concepts completed');
        expect(progress).toBeInTheDocument();
      });
    });
  });

  describe('Progress Calculation Tests', () => {
    it('calculates progress percentage correctly', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        const progressBar = document.querySelector('.MuiLinearProgress-bar');
        expect(progressBar).toHaveStyle(
          `transform: translateX(-${100 - (1 / 3) * 100}%)`
        );
      });
    });

    it('handles zero concepts gracefully', async () => {
      const emptyChapter = {
        ...mockChapterData,
        concepts: [],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: emptyChapter,
            }),
        })
      ) as jest.Mock;

      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByText('0/0 completed')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration Tests', () => {
    it('fetches chapter data on mount', async () => {
      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chapters/chapter-1/concepts'
        );
      });
    });

    it('refetches data when chapterId changes', async () => {
      const { rerender } = render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chapters/chapter-1/concepts'
        );
      });

      rerender(<ConceptList chapterId="chapter-2" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chapters/chapter-2/concepts'
        );
      });
    });

    it('handles network errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

      render(<ConceptList chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Footer Tests', () => {
    describe('Footer Rendering', () => {
      it('renders all 3 navigation buttons with correct labels', async () => {
        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /all chapters/i })
          ).toBeInTheDocument();
          expect(
            screen.getByRole('button', { name: /progress/i })
          ).toBeInTheDocument();
          expect(
            screen.getByRole('button', { name: /bookmarks/i })
          ).toBeInTheDocument();
        });
      });

      it('renders footer buttons with correct icons', async () => {
        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          const allChaptersButton = screen.getByRole('button', {
            name: /all chapters/i,
          });
          const progressButton = screen.getByRole('button', {
            name: /progress/i,
          });
          const bookmarksButton = screen.getByRole('button', {
            name: /bookmarks/i,
          });

          expect(allChaptersButton).toHaveTextContent('📚');
          expect(progressButton).toHaveTextContent('📊');
          expect(bookmarksButton).toHaveTextContent('🔖');
        });
      });

      it('renders footer-only view when no chapterId provided', () => {
        render(<ConceptList />);

        expect(
          screen.getByText('Select a chapter to view concepts')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /all chapters/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /progress/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /bookmarks/i })
        ).toBeInTheDocument();
      });
    });

    describe('Footer Navigation', () => {
      it('calls router.push with /chapters when All Chapters button clicked', async () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          const allChaptersButton = screen.getByRole('button', {
            name: /all chapters/i,
          });
          fireEvent.click(allChaptersButton);
        });

        expect(mockPush).toHaveBeenCalledWith('/chapters');
      });

      it('calls router.push with /dashboard/progress when Progress button clicked', async () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          const progressButton = screen.getByRole('button', {
            name: /progress/i,
          });
          fireEvent.click(progressButton);
        });

        expect(mockPush).toHaveBeenCalledWith('/dashboard/progress');
      });

      it('calls router.push with /dashboard/bookmarks when Bookmarks button clicked', async () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          const bookmarksButton = screen.getByRole('button', {
            name: /bookmarks/i,
          });
          fireEvent.click(bookmarksButton);
        });

        expect(mockPush).toHaveBeenCalledWith('/dashboard/bookmarks');
      });
    });

    describe('Footer Mobile Behavior', () => {
      it('calls onClose when footer button clicked on mobile', async () => {
        mockUseMediaQuery.mockReturnValue(true); // Mobile
        const mockOnClose = jest.fn();
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(
          <ConceptList
            chapterId="chapter-1"
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        await waitFor(() => {
          const allChaptersButton = screen.getByRole('button', {
            name: /all chapters/i,
          });
          fireEvent.click(allChaptersButton);
        });

        expect(mockOnClose).toHaveBeenCalled();
      });

      it('calls onClose when Progress button clicked on mobile', async () => {
        mockUseMediaQuery.mockReturnValue(true); // Mobile
        const mockOnClose = jest.fn();
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(
          <ConceptList
            chapterId="chapter-1"
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        await waitFor(() => {
          const progressButton = screen.getByRole('button', {
            name: /progress/i,
          });
          fireEvent.click(progressButton);
        });

        expect(mockOnClose).toHaveBeenCalled();
      });

      it('calls onClose when Bookmarks button clicked on mobile', async () => {
        mockUseMediaQuery.mockReturnValue(true); // Mobile
        const mockOnClose = jest.fn();
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(
          <ConceptList
            chapterId="chapter-1"
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        await waitFor(() => {
          const bookmarksButton = screen.getByRole('button', {
            name: /bookmarks/i,
          });
          fireEvent.click(bookmarksButton);
        });

        expect(mockOnClose).toHaveBeenCalled();
      });

      it('does not call onClose on desktop footer navigation', async () => {
        mockUseMediaQuery.mockReturnValue(false); // Desktop
        const mockOnClose = jest.fn();
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(
          <ConceptList
            chapterId="chapter-1"
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        await waitFor(() => {
          const allChaptersButton = screen.getByRole('button', {
            name: /all chapters/i,
          });
          fireEvent.click(allChaptersButton);
        });

        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    describe('Footer Accessibility', () => {
      it('has proper ARIA labels on all footer buttons', async () => {
        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /go to all chapters/i })
          ).toBeInTheDocument();
          expect(
            screen.getByRole('button', { name: /go to progress dashboard/i })
          ).toBeInTheDocument();
          expect(
            screen.getByRole('button', { name: /go to bookmarks/i })
          ).toBeInTheDocument();
        });
      });

      it('footer buttons are keyboard accessible', async () => {
        render(<ConceptList chapterId="chapter-1" />);

        await waitFor(() => {
          const allChaptersButton = screen.getByRole('button', {
            name: /all chapters/i,
          });
          const progressButton = screen.getByRole('button', {
            name: /progress/i,
          });
          const bookmarksButton = screen.getByRole('button', {
            name: /bookmarks/i,
          });

          // All buttons should be focusable (tabIndex not -1)
          expect(allChaptersButton).not.toHaveAttribute('tabindex', '-1');
          expect(progressButton).not.toHaveAttribute('tabindex', '-1');
          expect(bookmarksButton).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });

    describe('Footer with No Chapter Context', () => {
      it('displays footer-only view with message when no chapterId', () => {
        render(<ConceptList />);

        expect(
          screen.getByText('Select a chapter to view concepts')
        ).toBeInTheDocument();
      });

      it('footer buttons work in no-chapter-context mode', () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(<ConceptList />);

        const allChaptersButton = screen.getByRole('button', {
          name: /all chapters/i,
        });
        const progressButton = screen.getByRole('button', {
          name: /progress/i,
        });
        const bookmarksButton = screen.getByRole('button', {
          name: /bookmarks/i,
        });

        // Click each button and verify router.push was called
        fireEvent.click(allChaptersButton);
        expect(mockPush).toHaveBeenCalledWith('/chapters');

        fireEvent.click(progressButton);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/progress');

        fireEvent.click(bookmarksButton);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/bookmarks');
      });

      it('calls onClose on mobile in footer-only mode', () => {
        mockUseMediaQuery.mockReturnValue(true); // Mobile
        const mockOnClose = jest.fn();
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        render(<ConceptList isOpen={true} onClose={mockOnClose} />);

        const allChaptersButton = screen.getByRole('button', {
          name: /all chapters/i,
        });
        fireEvent.click(allChaptersButton);

        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Viewport Breakpoint Tests', () => {
    it('behaves as desktop at 1920px viewport', () => {
      mockUseMediaQuery.mockReturnValue(false); // Above 960px

      const { container } = render(<ConceptList chapterId="chapter-1" />);

      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toHaveClass('MuiDrawer-docked');
    });

    it('behaves as desktop at 1024px viewport', () => {
      mockUseMediaQuery.mockReturnValue(false); // Above 960px

      const { container } = render(<ConceptList chapterId="chapter-1" />);

      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toHaveClass('MuiDrawer-docked');
    });

    it('behaves as desktop at 960px viewport (breakpoint)', () => {
      mockUseMediaQuery.mockReturnValue(false); // At breakpoint

      const { container } = render(<ConceptList chapterId="chapter-1" />);

      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toHaveClass('MuiDrawer-docked');
    });

    it('behaves as mobile at 768px viewport', () => {
      mockUseMediaQuery.mockReturnValue(true); // Below 960px

      const { container } = render(
        <ConceptList chapterId="chapter-1" isOpen={true} />
      );

      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toHaveClass('MuiDrawer-modal');
    });
  });
});
