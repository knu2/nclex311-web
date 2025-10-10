/**
 * Discussion Components - Simplified Commenting System
 * Story 1.5.6 - Basic commenting with likes (no roles, no nested replies)
 */

export { CommentModal } from './CommentModal';
export { CommentForm } from './CommentForm';
export { CommentCard } from './CommentCard';
export { CommentList } from './CommentList';
export { ErrorState } from './ErrorState';

export type {
  Comment,
  CommentModalProps,
  CommentModalState,
  CommentCardProps,
  CommentFormProps,
  CommentListProps,
  ErrorStateProps,
  GetCommentsResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  LikeResponse,
} from './types';

export { getUserInitials, getRelativeTime } from './types';
