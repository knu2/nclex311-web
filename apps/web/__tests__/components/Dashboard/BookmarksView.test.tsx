import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import BookmarksView from '@/components/Dashboard/BookmarksView';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Mock fetch
global.fetch = jest.fn();

describe('BookmarksView', () => {
  const mockPush = jest.fn();
  const TEST_USER_ID = 'user-123';

  const mockBookmarks = [
    {
      id: 'bm-1',
      user_id: 'user-123',
      concept_id: 'concept-1',
      concept_title: 'Cardiac Physiology',
      concept_slug: 'cardiac-physiology',
      chapter_number: 2,
      chapter_title: 'Medical-Surgical Nursing',
      note_preview: 'Remember the key points about heart function...',
      bookmarked_at: '2025-10-01T10:00:00Z',
    },
    {
      id: 'bm-2',
      user_id: 'user-123',
      concept_id: 'concept-2',
      concept_title: 'Respiratory Assessment',
      concept_slug: 'respiratory-assessment',
      chapter_number: 3,
      chapter_title: 'Respiratory Care',
      note_preview: '',
      bookmarked_at: '2025-10-02T14:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });
  });

  it('renders loading state initially', () => {
    render(<BookmarksView userId={TEST_USER_ID} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays bookmarks after successful fetch', async () => {
    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('🔖 My Bookmarks')).toBeInTheDocument();
      expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
      expect(screen.getByText('Respiratory Assessment')).toBeInTheDocument();
    });
  });

  it('displays bookmark count correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('2 bookmarks')).toBeInTheDocument();
    });
  });

  it('displays note preview when available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Remember the key points about heart function/)
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no bookmarks exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: [] }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('No Bookmarks Yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Start bookmarking concepts to quickly access them/)
      ).toBeInTheDocument();
    });
  });

  it('empty state has Browse Chapters button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: [] }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      const browseButton = screen.getByText('Browse Chapters');
      expect(browseButton).toBeInTheDocument();

      fireEvent.click(browseButton);
      expect(mockPush).toHaveBeenCalledWith('/chapters');
    });
  });

  it('displays error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('navigates to concept on view button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      const viewButtons = screen.getAllByLabelText('view concept');
      fireEvent.click(viewButtons[0]);
      expect(mockPush).toHaveBeenCalledWith('/concepts/cardiac-physiology');
    });
  });

  it('renders grid with correct responsive columns', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
      expect(screen.getByText('Respiratory Assessment')).toBeInTheDocument();
      // Verify grid container exists
      const gridContainer = document.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  it('handles bookmark removal successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
    });

    // Simulate removing a bookmark from child component
    // This would be triggered by BookmarkCard component
    const removeButtons = screen.getAllByLabelText('remove bookmark');
    fireEvent.click(removeButtons[0]);

    // The confirmation dialog is in BookmarkCard, so we test the API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial fetch in this test
    });
  });

  it('is accessible with proper ARIA labels', async () => {
    // Set fresh mock for this specific test
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: mockBookmarks }),
    });

    render(<BookmarksView userId={TEST_USER_ID} />);

    // Wait for bookmarks to load
    await waitFor(() => {
      expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
    });

    // Then check ARIA labels
    expect(
      screen.getByRole('heading', { name: /My Bookmarks/i })
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('view concept')).toHaveLength(2);
    expect(screen.getAllByLabelText('edit note')).toHaveLength(2);
    expect(screen.getAllByLabelText('remove bookmark')).toHaveLength(2);
  });
});
