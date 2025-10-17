'use client';

/**
 * ConceptList Sidebar Component
 * Displays chapter concepts with completion indicators and navigation
 * Story: 1.5.1 - Sidebar Navigation Component
 */

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  useMediaQuery,
  LinearProgress,
  Button,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookmarkIcon from '@mui/icons-material/Bookmark';

// TypeScript Interfaces
export interface ConceptListProps {
  chapterId?: string;
  currentConceptSlug?: string;
  onConceptClick?: (slug: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  concepts: Concept[];
}

export interface Concept {
  id: string;
  title: string;
  slug: string;
  conceptNumber: number;
  isCompleted: boolean;
  isPremium: boolean;
}

interface ChapterHeaderProps {
  chapter: Chapter;
  completedCount: number;
}

const DRAWER_WIDTH = 280;
const MOBILE_BREAKPOINT = 960;

/**
 * Sidebar Footer Component
 * Contains quick-access navigation buttons
 * Uses router.push() for client-side navigation to avoid auth redirect issues
 * Fixes: Similar to BUG-AUTH-BLANK-PAGE - prevents unnecessary /login redirects
 */
interface SidebarFooterProps {
  onClose?: () => void;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ onClose }) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    // Close mobile drawer if applicable
    if (onClose) {
      onClose();
    }
    // Use router.push for client-side navigation
    // This avoids the Link prefetch/RSC issues that can trigger auth redirects
    router.push(path);
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid #e1e7f0',
        backgroundColor: '#fff',
      }}
    >
      <Stack spacing={1}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<MenuBookIcon />}
          onClick={() => handleNavigation('/chapters')}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            color: '#2c3e50',
            borderColor: '#e1e7f0',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#f5f7fa',
              borderColor: '#2c5aa0',
            },
          }}
          aria-label="Go to all chapters"
        >
          📚 All Chapters
        </Button>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<BarChartIcon />}
          onClick={() => handleNavigation('/dashboard/progress')}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            color: '#2c3e50',
            borderColor: '#e1e7f0',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#f5f7fa',
              borderColor: '#2c5aa0',
            },
          }}
          aria-label="Go to progress dashboard"
        >
          📊 Progress
        </Button>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<BookmarkIcon />}
          onClick={() => handleNavigation('/dashboard/bookmarks')}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            color: '#2c3e50',
            borderColor: '#e1e7f0',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#f5f7fa',
              borderColor: '#2c5aa0',
            },
          }}
          aria-label="Go to bookmarks"
        >
          🔖 Bookmarks
        </Button>
      </Stack>
    </Box>
  );
};

/**
 * Chapter Header Component
 * Displays chapter title, number, and progress indicator
 */
const ChapterHeader: React.FC<ChapterHeaderProps> = ({
  chapter,
  completedCount,
}) => {
  const totalConcepts = chapter.concepts.length;
  const progressPercent =
    totalConcepts > 0 ? (completedCount / totalConcepts) * 100 : 0;

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: '1px solid #e1e7f0',
        backgroundColor: '#fff',
      }}
    >
      {/* Chapter Title */}
      <Typography
        variant="overline"
        sx={{
          fontSize: '0.75rem',
          color: '#6c757d',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'block',
          mb: 0.5,
        }}
      >
        Chapter {chapter.chapterNumber}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#2c3e50',
          mb: 1,
        }}
      >
        {chapter.title}
      </Typography>

      {/* Progress Indicator */}
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.9rem',
          color: '#6c757d',
          mb: 1,
        }}
        aria-label={`${completedCount} of ${totalConcepts} concepts completed`}
      >
        {completedCount}/{totalConcepts} completed
      </Typography>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e1e7f0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#00b894',
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
};

/**
 * ConceptList Component
 * Main sidebar component for chapter navigation
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const ConceptList: React.FC<ConceptListProps> = React.memo(
  ({
    chapterId,
    currentConceptSlug,
    onConceptClick,
    isMobile: isMobileProp,
    isOpen = false,
    onClose,
  }) => {
    const router = useRouter();
    const pathname = usePathname();

    // Responsive behavior
    const isMobileBreakpoint = useMediaQuery(
      `(max-width:${MOBILE_BREAKPOINT}px)`
    );
    const isMobile = isMobileProp ?? isMobileBreakpoint;

    // State
    const [chapterData, setChapterData] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Calculate completed concepts
    const completedCount =
      chapterData?.concepts.filter(c => c.isCompleted).length ?? 0;

    // Fetch chapter data - wrapped in useCallback to prevent unnecessary recreations
    const fetchChapterData = React.useCallback(async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/chapters/${chapterId}/concepts`, {
          cache: 'no-store', // Always fetch fresh data
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chapter data');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load chapter');
        }

        setChapterData(data.data);
      } catch (err) {
        console.error('Error fetching chapter data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, [chapterId]);

    // Initial fetch
    useEffect(() => {
      if (chapterId) {
        fetchChapterData();
      }
    }, [chapterId, fetchChapterData]);

    // Listen for completion events to refresh sidebar
    useEffect(() => {
      const handleConceptComplete = () => {
        // Refetch chapter data when a concept is marked complete
        fetchChapterData();
      };

      // Listen for custom event
      window.addEventListener(
        'conceptCompletionChanged',
        handleConceptComplete
      );

      return () => {
        window.removeEventListener(
          'conceptCompletionChanged',
          handleConceptComplete
        );
      };
    }, [fetchChapterData]);

    // Handle concept click
    const handleConceptClick = (concept: Concept): void => {
      if (onConceptClick) {
        onConceptClick(concept.slug);
      } else {
        router.push(`/concepts/${concept.slug}`);
      }

      // Close drawer on mobile after navigation
      if (isMobile && onClose) {
        onClose();
      }
    };

    // Determine if concept is active
    const isConceptActive = (conceptSlug: string): boolean => {
      if (currentConceptSlug) {
        return conceptSlug === currentConceptSlug;
      }
      // Fallback to pathname matching
      return pathname.includes(conceptSlug);
    };

    // Close drawer on mobile after footer navigation
    const handleFooterClose = (): void => {
      if (isMobile && onClose) {
        onClose();
      }
    };

    // Drawer content
    const drawerContent = (
      <Box
        sx={{
          width: DRAWER_WIDTH,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
        }}
        role="navigation"
        aria-label="Concept navigation"
      >
        {/* Logo Header Section - Story 1.5.12: Ray Gapuz Review System branding */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e1e7f0',
            backgroundColor: '#fff',
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src="/images/logo_ragrs.svg"
            alt="Ray Gapuz Review System Logo"
            sx={{
              height: '60px',
              mx: 'auto',
              mb: 2,
              display: 'block',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.3rem',
              fontWeight: 600,
              color: '#2c5aa0',
              mb: 0.5,
            }}
          >
            NCLEX 311
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.85rem',
              color: '#6c757d',
            }}
          >
            Functional Nursing Concepts
          </Typography>
        </Box>

        {/* No Chapter ID - Show Footer Only */}
        {!chapterId && (
          <>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                Select a chapter to view concepts
              </Typography>
            </Box>
            <SidebarFooter onClose={handleFooterClose} />
          </>
        )}

        {/* Loading State */}
        {chapterId && loading && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {chapterId && error && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {/* Content */}
        {chapterId && chapterData && !loading && !error && (
          <>
            {/* Chapter Header */}
            <ChapterHeader
              chapter={chapterData}
              completedCount={completedCount}
            />

            {/* Concept List */}
            <List
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                pt: 1,
              }}
            >
              {chapterData.concepts.map(concept => {
                const isActive = isConceptActive(concept.slug);

                return (
                  <ListItem key={concept.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleConceptClick(concept)}
                      selected={isActive}
                      sx={{
                        borderRadius: '6px',
                        pl: isActive ? '0.5rem' : '0.75rem',
                        pr: '0.75rem',
                        py: '0.75rem',
                        borderLeft: isActive ? '4px solid #2c5aa0' : 'none',
                        backgroundColor: isActive ? '#e8f0fe' : '#fff',
                        transition: 'all 150ms ease-out',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 240, 254, 0.5)',
                        },
                        '&.Mui-focusVisible': {
                          outline: '2px solid #2c5aa0',
                          outlineOffset: '2px',
                        },
                      }}
                      aria-label={`${concept.title}${concept.isCompleted ? ', completed' : ''}${concept.isPremium ? ', premium content' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Completion Icon */}
                      {concept.isCompleted && (
                        <ListItemIcon
                          sx={{
                            minWidth: 'auto',
                            mr: 1,
                          }}
                        >
                          <CheckCircleIcon
                            sx={{
                              fontSize: '18px',
                              color: '#00b894',
                            }}
                            aria-label="Completed"
                          />
                        </ListItemIcon>
                      )}

                      {/* Concept Text */}
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: '16px',
                              fontWeight: isActive ? 600 : 400,
                              color: '#2c3e50',
                            }}
                          >
                            {concept.conceptNumber}. {concept.title}
                          </Typography>
                        }
                      />

                      {/* Premium Lock Icon */}
                      {concept.isPremium && (
                        <ListItemIcon
                          sx={{
                            minWidth: 'auto',
                            ml: 1,
                          }}
                        >
                          <LockIcon
                            sx={{
                              fontSize: '18px',
                              color: '#6c757d',
                              opacity: 0.7,
                            }}
                            aria-label="Premium content"
                          />
                        </ListItemIcon>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            {/* Sidebar Footer */}
            <SidebarFooter onClose={handleFooterClose} />
          </>
        )}
      </Box>
    );

    return (
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? isOpen : true}
        onClose={isMobile ? onClose : undefined}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: isMobile ? 3 : 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }
);

ConceptList.displayName = 'ConceptList';

export default ConceptList;
