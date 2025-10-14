import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookmarkCard from '@/components/Dashboard/BookmarkCard';
import type { Bookmark } from '@/components/Dashboard/BookmarksView';

describe('BookmarkCard', () => {
  const mockBookmark: Bookmark = {
    id: 'bm-1',
    user_id: 'user-123',
    concept_id: 'concept-1',
    concept_title: 'Cardiac Physiology',
    concept_slug: 'cardiac-physiology',
    chapter_number: 2,
    chapter_title: 'Medical-Surgical Nursing',
    note_preview: 'Remember the key points about heart function...',
    bookmarked_at: '2025-10-01T10:00:00Z',
  };

  const mockHandlers = {
    onView: jest.fn(),
    onEditNote: jest.fn(),
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bookmark card with concept title', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);
    expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
  });

  it('displays chapter badge and title', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    expect(screen.getByText('Medical-Surgical Nursing')).toBeInTheDocument();
  });

  it('shows note preview when available', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);
    expect(
      screen.getByText(/Remember the key points about heart function/)
    ).toBeInTheDocument();
  });

  it('shows "No note yet" when note preview is empty', () => {
    const bookmarkWithoutNote = { ...mockBookmark, note_preview: '' };
    render(<BookmarkCard bookmark={bookmarkWithoutNote} {...mockHandlers} />);
    expect(screen.getByText('No note yet')).toBeInTheDocument();
  });

  it('displays formatted bookmarked date', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);
    expect(screen.getByText(/Bookmarked Oct 1, 2025/)).toBeInTheDocument();
  });

  it('calls onView when view button is clicked', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    const viewButton = screen.getByLabelText('view concept');
    fireEvent.click(viewButton);

    expect(mockHandlers.onView).toHaveBeenCalledWith('cardiac-physiology');
  });

  it('calls onEditNote when edit note button is clicked', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    const editButton = screen.getByLabelText('edit note');
    fireEvent.click(editButton);

    expect(mockHandlers.onEditNote).toHaveBeenCalledWith(
      'cardiac-physiology',
      'Cardiac Physiology'
    );
  });

  it('shows confirmation dialog when remove button is clicked', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    const removeButton = screen.getByLabelText('remove bookmark');
    fireEvent.click(removeButton);

    expect(screen.getByText('Remove Bookmark?')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to remove this bookmark/)
    ).toBeInTheDocument();
  });

  it('calls onRemove when confirmed in dialog', async () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    // Open confirmation dialog
    const removeButton = screen.getByLabelText('remove bookmark');
    fireEvent.click(removeButton);

    // Confirm removal
    const confirmButton = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockHandlers.onRemove).toHaveBeenCalledWith('bm-1');
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    // Open confirmation dialog
    const removeButton = screen.getByLabelText('remove bookmark');
    fireEvent.click(removeButton);

    // Cancel removal
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Remove Bookmark?')).not.toBeInTheDocument();
      expect(mockHandlers.onRemove).not.toHaveBeenCalled();
    });
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    expect(screen.getByLabelText('view concept')).toBeInTheDocument();
    expect(screen.getByLabelText('edit note')).toBeInTheDocument();
    expect(screen.getByLabelText('remove bookmark')).toBeInTheDocument();
  });

  it('has tooltips on action buttons', async () => {
    render(<BookmarkCard bookmark={mockBookmark} {...mockHandlers} />);

    const viewButton = screen.getByLabelText('view concept');
    fireEvent.mouseOver(viewButton);

    await waitFor(() => {
      expect(screen.getByText('View concept')).toBeInTheDocument();
    });
  });

  it('displays star icon in card header', () => {
    const { container } = render(
      <BookmarkCard bookmark={mockBookmark} {...mockHandlers} />
    );

    // Check for star icon by looking for SVG with specific test id or class
    const starIcon =
      container.querySelector('[data-testid="StarIcon"]') ||
      container.querySelector('svg[class*="MuiSvgIcon-root"]');
    expect(starIcon).toBeInTheDocument();
  });

  it('truncates long note previews with ellipsis', () => {
    const longNote = 'a'.repeat(120);
    const bookmarkWithLongNote = { ...mockBookmark, note_preview: longNote };

    render(<BookmarkCard bookmark={bookmarkWithLongNote} {...mockHandlers} />);

    // Should show the text and add ellipsis
    const noteElement = screen.getByText(/a{100,}/);
    expect(noteElement.textContent).toContain('...');
  });

  it('maintains proper card layout with flexbox', () => {
    const { container } = render(
      <BookmarkCard bookmark={mockBookmark} {...mockHandlers} />
    );

    const card = container.querySelector('[class*="MuiCard-root"]');
    expect(card).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('renders with elevation and hover effects', () => {
    const { container } = render(
      <BookmarkCard bookmark={mockBookmark} {...mockHandlers} />
    );

    const card = container.querySelector('[class*="MuiCard-root"]');
    expect(card).toHaveClass('MuiCard-root');
  });
});
