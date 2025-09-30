'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  MenuBook as ConceptIcon,
  Lock as LockIcon,
  CheckCircle as FreeIcon,
} from '@mui/icons-material';
import { ChapterWithConcepts, ConceptPreview } from '@/lib/db/services';

interface ChapterListProps {
  chapters: ChapterWithConcepts[];
  loading?: boolean;
  error?: string | null;
  onConceptClick: (conceptSlug: string) => void;
}

interface ConceptItemProps {
  concept: ConceptPreview;
  onClick: (conceptSlug: string) => void;
}

/**
 * Individual concept item component
 */
const ConceptItem: React.FC<ConceptItemProps> = ({ concept, onClick }) => {
  const handleClick = () => {
    onClick(concept.slug);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={handleClick}
        sx={{
          py: 1,
          px: 2,
          borderRadius: 1,
          mb: 0.5,
          '&:hover': {
            backgroundColor: concept.isPremium
              ? 'warning.light'
              : 'action.hover',
            transform: 'translateX(4px)',
            transition: 'all 0.2s ease-in-out',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <ConceptIcon
            color={concept.isPremium ? 'disabled' : 'primary'}
            fontSize="small"
          />
        </ListItemIcon>

        <ListItemText
          primary={concept.title}
          secondary={`Concept ${concept.conceptNumber}`}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: 500,
            color: concept.isPremium ? 'text.secondary' : 'text.primary',
          }}
          secondaryTypographyProps={{
            variant: 'caption',
            color: 'text.secondary',
          }}
        />

        {concept.isPremium && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <LockIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
            <Chip
              label="Premium"
              size="small"
              color="warning"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                fontWeight: 500,
              }}
            />
          </Box>
        )}
      </ListItemButton>
    </ListItem>
  );
};

/**
 * Chapter List component with accordion layout
 * Displays all chapters with nested concepts and premium indicators
 */
export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  loading = false,
  error = null,
  onConceptClick,
}) => {
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

  const handleAccordionChange =
    (chapterId: string) =>
    (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedChapters(prev =>
        isExpanded ? [...prev, chapterId] : prev.filter(id => id !== chapterId)
      );
    };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading chapters...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No chapters found. Please check back later.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {chapters.map(chapter => {
        const isExpanded = expandedChapters.includes(chapter.id);
        const isFreeChapter = chapter.chapterNumber <= 4;
        const conceptCount = chapter.concepts.length;
        const freeConceptCount = chapter.concepts.filter(
          c => !c.isPremium
        ).length;

        return (
          <Accordion
            key={chapter.id}
            expanded={isExpanded}
            onChange={handleAccordionChange(chapter.id)}
            sx={{
              mb: 1,
              '&:before': {
                display: 'none', // Remove default MUI accordion divider
              },
              boxShadow: 1,
              borderRadius: 1,
              '&.Mui-expanded': {
                boxShadow: 2,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: isFreeChapter
                  ? 'success.light'
                  : 'warning.light',
                borderRadius: 1,
                '&.Mui-expanded': {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
                '&:hover': {
                  backgroundColor: isFreeChapter
                    ? 'success.main'
                    : 'warning.main',
                  '& .MuiTypography-root': {
                    color: isFreeChapter
                      ? 'success.contrastText'
                      : 'warning.contrastText',
                  },
                },
                minHeight: 64,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  pr: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {isFreeChapter ? (
                    <FreeIcon color="success" sx={{ mr: 1 }} />
                  ) : (
                    <LockIcon color="warning" sx={{ mr: 1 }} />
                  )}
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h3" component="h2" sx={{ mb: 0.5 }}>
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {conceptCount} concept{conceptCount !== 1 ? 's' : ''}
                    {!isFreeChapter && ` • ${freeConceptCount} free`}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={isFreeChapter ? 'Free' : 'Premium'}
                    color={isFreeChapter ? 'success' : 'warning'}
                    size="small"
                    variant="filled"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
              <List sx={{ p: 1 }}>
                {chapter.concepts.map(concept => (
                  <ConceptItem
                    key={concept.id}
                    concept={concept}
                    onClick={onConceptClick}
                  />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default ChapterList;
