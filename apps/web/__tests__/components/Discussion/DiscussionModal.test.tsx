import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiscussionModal } from '@/components/Discussion/DiscussionModal';
import { Post } from '@/components/Discussion/types';

// Mock fetch
global.fetch = jest.fn();

describe('DiscussionModal', () => {
  const mockPosts: Post[] = [
    {
      id: 'post-1',
      user_id: 'user-1',
      user_name: 'Dr. Smith',
      user_role: 'instructor',
      post_type: 'question',
      content:
        'What are the key differences between systolic and diastolic heart failure?',
      like_count: 5,
      reply_count: 3,
      is_liked_by_user: false,
      is_pinned: true,
      created_at: '2025-10-01T10:00:00Z',
      replies: [
        {
          id: 'reply-1',
          user_id: 'user-2',
          user_name: 'Student A',
          user_role: 'student',
          content: 'Great question! I think it relates to ejection fraction.',
          created_at: '2025-10-01T11:00:00Z',
        },
      ],
    },
    {
      id: 'post-2',
      user_id: 'user-3',
      user_name: 'Student B',
      user_role: 'student',
      post_type: 'discussion',
      content: 'I found the concept about cardiac output really helpful.',
      like_count: 2,
      reply_count: 0,
      is_liked_by_user: true,
      is_pinned: false,
      created_at: '2025-10-01T12:00:00Z',
      replies: [],
    },
  ];

  const mockProps = {
    conceptId: 'concept-123',
    conceptTitle: 'Cardiac Physiology',
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render modal when open', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('💬 Discussion: Cardiac Physiology')
        ).toBeInTheDocument();
      });
    });

    it('should not render modal when closed', () => {
      render(<DiscussionModal {...mockProps} isOpen={false} />);

      expect(
        screen.queryByText('💬 Discussion: Cardiac Physiology')
      ).not.toBeInTheDocument();
    });

    it('should display close button', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('close');
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('should render tabs for All, Questions, and Discussions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
        expect(
          screen.getByRole('tab', { name: /questions/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('tab', { name: /discussions/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Post Loading', () => {
    it('should fetch posts on modal open', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/concept-123/discuss?tab=all&page=1'
        );
      });
    });

    it('should display loading state while fetching', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    posts: [],
                    total_count: 0,
                    page: 1,
                    page_size: 20,
                  }),
                }),
              100
            )
          )
      );

      render(<DiscussionModal {...mockProps} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch posts/i)).toBeInTheDocument();
      });
    });

    it('should display posts after successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(
          screen.getByText(
            'What are the key differences between systolic and diastolic heart failure?'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Tab Switching', () => {
    it('should fetch posts with correct tab filter when switching tabs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: /questions/i })
        ).toBeInTheDocument();
      });

      const questionsTab = screen.getByRole('tab', { name: /questions/i });
      fireEvent.click(questionsTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/concept-123/discuss?tab=questions&page=1'
        );
      });
    });

    it('should switch to discussions tab and fetch filtered posts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: /discussions/i })
        ).toBeInTheDocument();
      });

      const discussionsTab = screen.getByRole('tab', { name: /discussions/i });
      fireEvent.click(discussionsTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/concept-123/discuss?tab=discussions&page=1'
        );
      });
    });
  });

  describe('Instructor Post Styling', () => {
    it('should display instructor badge for instructor posts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        const instructorBadges = screen.getAllByText('Instructor');
        expect(instructorBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display pinned indicator for pinned posts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: mockPosts,
          total_count: 2,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pinned')).toBeInTheDocument();
      });
    });

    it('should display post type icon for questions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [mockPosts[0]],
          total_count: 1,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('question')).toBeInTheDocument();
      });
    });
  });

  describe('Like Functionality', () => {
    it('should toggle like state on like button click', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            posts: mockPosts,
            total_count: 2,
            page: 1,
            page_size: 20,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, like_count: 6 }),
        });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('5 Likes')).toBeInTheDocument();
      });

      const likeButton = screen.getByLabelText('like post');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText('6 Likes')).toBeInTheDocument();
      });
    });

    it('should call like API endpoint when liking a post', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            posts: mockPosts,
            total_count: 2,
            page: 1,
            page_size: 20,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, like_count: 6 }),
        });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('like post')).toBeInTheDocument();
      });

      const likeButton = screen.getByLabelText('like post');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/discuss/post-1/like', {
          method: 'POST',
        });
      });
    });

    it('should call unlike API endpoint when unliking a post', async () => {
      const likedPost = { ...mockPosts[1], is_liked_by_user: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            posts: [likedPost],
            total_count: 1,
            page: 1,
            page_size: 20,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, like_count: 1 }),
        });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('unlike post')).toBeInTheDocument();
      });

      const unlikeButton = screen.getByLabelText('unlike post');
      fireEvent.click(unlikeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/discuss/post-2/like', {
          method: 'DELETE',
        });
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no posts exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No posts yet')).toBeInTheDocument();
        expect(
          screen.getByText('Be the first to start a discussion!')
        ).toBeInTheDocument();
      });
    });

    it('should display create post button in empty state', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Create Post')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on modal', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('close')).toBeInTheDocument();
      });
    });

    it('should have accessible tabs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      render(<DiscussionModal {...mockProps} />);

      await waitFor(() => {
        const tabs = screen.getByRole('tablist', { name: /discussion tabs/i });
        expect(tabs).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [],
          total_count: 0,
          page: 1,
          page_size: 20,
        }),
      });

      const onClose = jest.fn();
      render(<DiscussionModal {...mockProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText('close')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
