/**
 * TypeScript Type Definitions for Discussion Modal Components
 * Story 1.5.6 - Discussion Modal (Simplified)
 * Updated in Story 1.5.6.1 to use Drizzle ORM types
 *
 * This is a simplified commenting system:
 * - No instructor roles (all users are students)
 * - No question/discussion types (single comment type)
 * - No nested replies (flat structure)
 * - Basic commenting with likes
 */

import type {
  Comment as DbComment,
  CommentLike as DbCommentLike,
} from '@/lib/db/schema';

/**
 * Comment data structure returned from API
 * Extends the Drizzle ORM Comment type with additional computed fields
 */
export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  like_count: number;
  is_liked_by_user: boolean;
  created_at: string;
}

/**
 * Re-export Drizzle ORM database types for use in components if needed
 */
export type { DbComment, DbCommentLike };

/**
 * Props for the main CommentModal component
 */
export interface CommentModalProps {
  conceptSlug: string;
  conceptTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Internal state management for CommentModal
 */
export interface CommentModalState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  submitting: boolean;
}

/**
 * Props for CommentCard component
 */
export interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
}

/**
 * Props for CommentForm component
 */
export interface CommentFormProps {
  currentUserName: string;
  onSubmit: (content: string) => Promise<void>;
  submitting: boolean;
}

/**
 * Props for CommentList component
 */
export interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
}

/**
 * Props for ErrorState component
 */
export interface ErrorStateProps {
  onRetry: () => void;
  onCreatePost: () => void;
}

/**
 * API response for GET /api/concepts/{id}/comments
 */
export interface GetCommentsResponse {
  comments: Comment[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * API request body for POST /api/concepts/{id}/comments
 */
export interface CreateCommentRequest {
  content: string;
}

/**
 * API response for POST /api/concepts/{id}/comments
 */
export interface CreateCommentResponse {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  like_count: number;
  is_liked_by_user: boolean;
  created_at: string;
}

/**
 * API response for like/unlike operations
 */
export interface LikeResponse {
  success: boolean;
  like_count: number;
}

/**
 * Helper function to get user initials from full name
 * @param userName - Full name of the user
 * @returns Two-letter initials in uppercase
 */
export function getUserInitials(userName: string): string {
  return userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Helper function to format timestamp as relative time
 * @param timestamp - ISO 8601 timestamp string
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return past.toLocaleDateString();
  }
}
