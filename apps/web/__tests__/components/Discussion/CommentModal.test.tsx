import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentModal } from '@/components/Discussion/CommentModal';
import { Comment } from '@/components/Discussion/types';

// Mock fetch
global.fetch = jest.fn();

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    user_id: 'user-1',
    user_name: 'Maria Santos',
    content: 'This was really helpful! Thanks for sharing.',
    like_count: 5,
    is_liked_by_user: false,
    created_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'comment-2',
    user_id: 'user-2',
    user_name: 'John Doe',
    content: 'Great explanation of the concept.',
    like_count: 3,
    is_liked_by_user: true,
    created_at: '2025-10-02T12:00:00Z',
  },
];

describe('CommentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render modal when open', () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: mockComments,
          total_count: 2,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test Concept"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      expect(
        screen.getByText(/💬 Discussion: Test Concept/i)
      ).toBeInTheDocument();
    });

    it('should display modal title with concept name', () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Cardiac Assessment"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      expect(
        screen.getByText(/💬 Discussion: Cardiac Assessment/i)
      ).toBeInTheDocument();
    });

    it('should show close button', () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByLabelText(/Close modal/i)).toBeInTheDocument();
    });
  });

  describe('Loading State Tests', () => {
    it('should display loading spinner while fetching comments', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Empty State Tests', () => {
    it('should display empty state when no comments exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Be the first to share/i)).toBeInTheDocument();
    });

    it('should show comment form in empty state', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Share your thoughts/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error State Tests', () => {
    it('should display error state when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to load comments/i)
        ).toBeInTheDocument();
      });
    });

    it('should show Retry button in error state', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Retry/i })
        ).toBeInTheDocument();
      });
    });

    it('should show Post Comment button in error state', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Create new comment/i })
        ).toBeInTheDocument();
      });
    });

    it('should retry fetching comments when Retry button clicked', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            comments: mockComments,
            total_count: 2,
            page: 1,
            page_size: 20,
            has_more: false,
          }),
        });
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Retry/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Comment Form Tests', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });
    });

    it('should accept text input in comment form', async () => {
      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Share your thoughts/i)
        ).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
      fireEvent.change(textarea, { target: { value: 'Test comment' } });

      expect(textarea).toHaveValue('Test comment');
    });

    it('should show character counter', async () => {
      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/0 \/ 2000/i)).toBeInTheDocument();
      });
    });

    it('should update character counter as user types', async () => {
      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        fireEvent.change(textarea, { target: { value: 'Hello' } });
      });

      expect(screen.getByText(/5 \/ 2000/i)).toBeInTheDocument();
    });

    it('should validate comment length and show error for over 2000 characters', async () => {
      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const longText = 'a'.repeat(2001);
        fireEvent.change(textarea, { target: { value: longText } });
      });

      expect(screen.getByText(/2001 \/ 2000/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Post Comment/i })
      ).toBeDisabled();
    });

    it('should disable submit button when content is empty', async () => {
      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Post Comment/i })
        ).toBeDisabled();
      });
    });
  });

  describe('Comment List Tests', () => {
    it('should render list of comments', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: mockComments,
          total_count: 2,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
    });

    it('should display comment count', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: mockComments,
          total_count: 2,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/2 comments/i)).toBeInTheDocument();
      });
    });
  });

  describe('Like Functionality Tests', () => {
    it('should toggle like state when like button clicked', async () => {
      (global.fetch as jest.Mock).mockImplementation(url => {
        if (url.includes('/comments')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              comments: mockComments,
              total_count: 2,
              page: 1,
              page_size: 20,
              has_more: false,
            }),
          });
        }
        if (url.includes('/like')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, like_count: 6 }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
      });

      const likeButtons = screen.getAllByLabelText(/Like comment/i);
      fireEvent.click(likeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination Tests', () => {
    it('should show Load More button when hasMore is true', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: mockComments,
          total_count: 25,
          page: 1,
          page_size: 20,
          has_more: true,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Load More Comments/i })
        ).toBeInTheDocument();
      });
    });

    it('should hide Load More button when all comments loaded', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: mockComments,
          total_count: 2,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /Load More Comments/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels on modal', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute(
          'aria-modal',
          'true'
        );
      });
    });

    it('should have proper ARIA label on close button', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          comments: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          has_more: false,
        }),
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByLabelText(/Close modal/i)).toBeInTheDocument();
    });

    it('should use role=alert for error state', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <CommentModal
          conceptSlug="test-concept"
          conceptTitle="Test"
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
